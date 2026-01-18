import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  reason: text("reason").notNull(),
  details: text("details"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertReportSchema = createInsertSchema(reports).pick({
  reason: true,
  details: true,
});

export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;

// WebSocket Message Types
export const WS_MESSAGES = {
  JOIN: 'JOIN',           // Client -> Server: Join queue
  LEAVE: 'LEAVE',         // Client -> Server: Leave queue/call
  MATCH: 'MATCH',         // Server -> Client: You are matched (initiator: true/false)
  OFFER: 'OFFER',         // Peer -> Peer (relayed)
  ANSWER: 'ANSWER',       // Peer -> Peer (relayed)
  CANDIDATE: 'CANDIDATE', // Peer -> Peer (relayed)
  CHAT: 'CHAT',           // Peer -> Peer (relayed via Server for persistence/safety if needed, or just relay)
  PEER_LEFT: 'PEER_LEFT', // Server -> Client: Peer disconnected
  ERROR: 'ERROR'          // Server -> Client: Something went wrong
} as const;

export type SignalingMessage = 
  | { type: 'JOIN' }
  | { type: 'LEAVE' }
  | { type: 'MATCH'; payload: { initiator: boolean; peerId: string } }
  | { type: 'OFFER'; payload: RTCSessionDescriptionInit }
  | { type: 'ANSWER'; payload: RTCSessionDescriptionInit }
  | { type: 'CANDIDATE'; payload: RTCIceCandidateInit }
  | { type: 'CHAT'; payload: { message: string; timestamp: number } }
  | { type: 'PEER_LEFT' }
  | { type: 'ERROR'; payload: { message: string } };
