import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { WS_MESSAGES, type SignalingMessage } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // --- HTTP Routes ---
  app.post(api.reports.create.path, async (req, res) => {
    try {
      const input = api.reports.create.input.parse(req.body);
      await storage.createReport(input);
      res.status(201).json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // --- Production WebSocket Signaling Server ---
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  const queue: WebSocket[] = [];
  const peers = new Map<WebSocket, WebSocket>();

  wss.on("connection", (ws) => {
    ws.on("message", (rawMessage) => {
      try {
        const message = JSON.parse(rawMessage.toString()) as SignalingMessage;
        switch (message.type) {
          case WS_MESSAGES.JOIN:
            handleJoin(ws);
            break;
          case WS_MESSAGES.LEAVE:
            handleLeave(ws);
            break;
          case WS_MESSAGES.OFFER:
          case WS_MESSAGES.ANSWER:
          case WS_MESSAGES.CANDIDATE:
          case WS_MESSAGES.CHAT:
            relayMessage(ws, message);
            break;
        }
      } catch (error) {
        console.error("Signal Error:", error);
      }
    });

    ws.on("close", () => handleLeave(ws));
    ws.on("error", () => handleLeave(ws));
  });

  function handleJoin(ws: WebSocket) {
    if (peers.has(ws) || queue.includes(ws)) return;
    queue.push(ws);
    if (queue.length >= 2) {
      const p1 = queue.shift()!;
      const p2 = queue.shift()!;
      peers.set(p1, p2);
      peers.set(p2, p1);
      p1.send(JSON.stringify({ type: WS_MESSAGES.MATCH, payload: { initiator: true, peerId: 'remote' } }));
      p2.send(JSON.stringify({ type: WS_MESSAGES.MATCH, payload: { initiator: false, peerId: 'remote' } }));
    }
  }

  function handleLeave(ws: WebSocket) {
    const qIdx = queue.indexOf(ws);
    if (qIdx > -1) queue.splice(qIdx, 1);
    const peer = peers.get(ws);
    if (peer) {
      peers.delete(ws);
      peers.delete(peer);
      if (peer.readyState === WebSocket.OPEN) {
        peer.send(JSON.stringify({ type: WS_MESSAGES.PEER_LEFT }));
      }
    }
  }

  function relayMessage(sender: WebSocket, message: SignalingMessage) {
    const receiver = peers.get(sender);
    if (receiver?.readyState === WebSocket.OPEN) {
      receiver.send(JSON.stringify(message));
    }
  }

  return httpServer;
}
