const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const Redis = require("ioredis");
const cors = require("cors");

const PORT = process.env.PORT || 3002;
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const app = express();
app.use(cors());
app.get("/health", (_, res) => res.json({ ok: true }));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Suscripción a Redis (canal "tasks")
const sub = new Redis(REDIS_URL);

io.on("connection", (socket) => {
  socket.on("joinProject", (projectId) => {
    socket.join(`project:${projectId}`);
  });
});

sub.subscribe("tasks", (err) => {
  if (err) console.error("Error subscripción Redis:", err);
});

sub.on("message", (channel, msg) => {
  if (channel !== "tasks") return;
  try {
    const event = JSON.parse(msg);
    // Reenviar a la sala correspondiente
    if (event?.projectId && event?.type) {
      io.to(`project:${event.projectId}`).emit(event.type, {
        projectId: event.projectId,
        task: event.payload
      });
    }
  } catch (e) {
    console.error("Mensaje inválido:", e);
  }
});

server.listen(PORT, () => {
  console.log(`Notify service escuchando en http://localhost:${PORT}`);
});
