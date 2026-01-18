## Packages
framer-motion | For smooth animations and transitions between states
canvas-confetti | For celebration effects (optional but fun)
socket.io-client | For WebSocket connections (if using socket.io, otherwise native WS is fine, but client usually helps with reconnections)

## Notes
Tailwind Config - extend fontFamily:
fontFamily: {
  display: ["var(--font-display)"],
  body: ["var(--font-body)"],
  mono: ["var(--font-mono)"],
}
