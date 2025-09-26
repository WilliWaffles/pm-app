// client/src/lib/socket.js
import { io } from "socket.io-client";

const NOTIFY_URL = import.meta.env.VITE_NOTIFY_URL || "http://localhost:3002";

// Singleton de socket para toda la app
export const socket = io(NOTIFY_URL, {
  autoConnect: true,       // intenta conectar al cargar
  reconnection: true,      // reintenta si se cae
  reconnectionAttempts: 5, // límite de reintentos
  reconnectionDelay: 1000, // ms
});

socket.on("connect", () => {
  console.log("[socket] connected", socket.id);
});
socket.on("disconnect", (reason) => {
  console.log("[socket] disconnected:", reason);
});
socket.on("connect_error", (err) => {
  console.error("[socket] connect_error:", err.message);
});
