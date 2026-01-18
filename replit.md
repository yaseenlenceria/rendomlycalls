# StrangerVoice

## Overview

StrangerVoice is a real-time stranger voice and chat application that connects random users via WebRTC for audio communication and text chat. Users can find strangers, talk with them, send text messages, skip to the next person, end calls, and report abuse. The system uses WebSocket-based signaling for peer connection establishment and maintains a matchmaking queue on the server.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack React Query for server state, React hooks for local state
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **UI Components**: shadcn/ui component library (Radix UI primitives with custom styling)
- **Animations**: Framer Motion for smooth transitions and UI animations
- **Build Tool**: Vite with React plugin

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **WebSocket**: Native `ws` library for real-time signaling
- **HTTP Server**: Express serves both API routes and static files
- **Architecture Pattern**: Single server handling both HTTP API and WebSocket connections

### Real-Time Communication
- **Signaling Protocol**: Custom WebSocket protocol with message types (JOIN, LEAVE, MATCH, OFFER, ANSWER, CANDIDATE, CHAT, PEER_LEFT, ERROR)
- **Matchmaking**: Server-side queue that pairs users randomly when two are available
- **WebRTC**: Browser-native WebRTC API for peer-to-peer audio and data channels
- **Message Relay**: Server relays WebRTC signaling messages (offers, answers, ICE candidates) between matched peers

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` contains all database table definitions
- **Migrations**: Drizzle Kit for schema migrations (`drizzle-kit push`)
- **Current Tables**: `reports` table for abuse reporting functionality

### API Design
- **Route Definitions**: Centralized in `shared/routes.ts` with Zod schemas for input validation
- **Endpoints**: REST API at `/api/*` for persistent operations (e.g., creating reports)
- **WebSocket Path**: `/ws` for real-time signaling

### Code Organization
- **`client/`**: Frontend React application
- **`server/`**: Backend Express server
- **`shared/`**: Shared types, schemas, and route definitions used by both client and server
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and schema management

### Frontend Libraries
- **Radix UI**: Accessible, unstyled UI primitives (dialogs, dropdowns, tooltips, etc.)
- **TanStack Query**: Server state management and caching
- **Framer Motion**: Animation library
- **socket.io-client**: Available for WebSocket connections (though native WebSocket is currently used)

### Development Tools
- **Vite**: Frontend build and dev server with HMR
- **esbuild**: Server bundling for production builds
- **Replit Plugins**: Dev banner, cartographer, and runtime error overlay for Replit environment

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (required)
- `VITE_SIGNALING_SERVER_URL`: Optional override for WebSocket signaling server URL
- `NODE_ENV`: Controls development vs production behavior