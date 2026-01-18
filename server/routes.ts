import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { api, errorSchemas } from "@shared/routes";
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

  // --- WebSocket & Matchmaking Logic ---
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  // Simple in-memory queue and session tracking
  const queue: WebSocket[] = [];
  const peers = new Map<WebSocket, WebSocket>(); // Local -> Remote

  wss.on("connection", (ws) => {
    console.log("New client connected");

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
        console.error("WebSocket message error:", error);
      }
    });

    ws.on("close", () => {
      handleDisconnect(ws);
    });
  });

  function handleJoin(ws: WebSocket) {
    // If already in a call, do nothing or handle re-queue logic if explicit
    if (peers.has(ws)) return;

    // If already in queue, ignore
    if (queue.includes(ws)) return;

    console.log("Client joined queue. Queue size:", queue.length + 1);
    queue.push(ws);
    processQueue();
  }

  function processQueue() {
    if (queue.length < 2) return;

    // Pop two users
    const peer1 = queue.shift();
    const peer2 = queue.shift();

    if (!peer1 || !peer2) return;

    // Verify they are still open
    if (peer1.readyState !== WebSocket.OPEN) {
      if (peer2.readyState === WebSocket.OPEN) queue.unshift(peer2); // Return valid peer
      processQueue();
      return;
    }
    if (peer2.readyState !== WebSocket.OPEN) {
      if (peer1.readyState === WebSocket.OPEN) queue.unshift(peer1); // Return valid peer
      processQueue();
      return;
    }

    // Match them
    peers.set(peer1, peer2);
    peers.set(peer2, peer1);

    console.log("Matched two peers");

    // Notify Peer 1 (Initiator)
    const matchMsg1: SignalingMessage = {
      type: WS_MESSAGES.MATCH,
      payload: { initiator: true, peerId: "peer2" } // IDs are ephemeral/internal here
    };
    peer1.send(JSON.stringify(matchMsg1));

    // Notify Peer 2
    const matchMsg2: SignalingMessage = {
      type: WS_MESSAGES.MATCH,
      payload: { initiator: false, peerId: "peer1" }
    };
    peer2.send(JSON.stringify(matchMsg2));
  }

  function relayMessage(sender: WebSocket, message: SignalingMessage) {
    const receiver = peers.get(sender);
    if (receiver && receiver.readyState === WebSocket.OPEN) {
      receiver.send(JSON.stringify(message));
    }
  }

  function handleLeave(ws: WebSocket) {
    // Remove from queue if present
    const qIndex = queue.indexOf(ws);
    if (qIndex > -1) {
      queue.splice(qIndex, 1);
      console.log("Removed from queue");
    }

    // Handle active call disconnect
    const peer = peers.get(ws);
    if (peer) {
      peers.delete(ws);
      peers.delete(peer);

      if (peer.readyState === WebSocket.OPEN) {
        const leftMsg: SignalingMessage = { type: WS_MESSAGES.PEER_LEFT };
        peer.send(JSON.stringify(leftMsg));
      }
      console.log("Peer disconnected, notified partner");
    }
  }

  function handleDisconnect(ws: WebSocket) {
    handleLeave(ws); // Reuse leave logic
  }

  return httpServer;
}
