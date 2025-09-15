const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { PrismaClient } = require("@prisma/client");
const http = require("http");
const { Server } = require("socket.io");

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

/** ------- REST: USERS ------- **/
app.get("/api/users", async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

app.post("/api/users", async (req, res) => {
  const { name, email } = req.body || {};
  if (!name || !email) return res.status(400).json({ error: "name y email requeridos" });
  const user = await prisma.user.create({ data: { name, email } });
  res.status(201).json(user);
});

/** ------- REST: USERS (Update/Delete) ------- **/

// GET opcional: obtener 1 usuario
app.get("/api/users/:id", async (req, res) => {
  const id = Number(req.params.id);
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ error: "no existe" });
  res.json(user);
});

// UPDATE usuario
app.put("/api/users/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { name, email } = req.body || {};
  if (!name && !email) {
    return res.status(400).json({ error: "nada que actualizar" });
  }
  try {
    const updated = await prisma.user.update({
      where: { id },
      data: { ...(name !== undefined && { name }), ...(email !== undefined && { email }) }
    });
    res.json(updated);
  } catch (e) {
    // email @unique podría chocar
    if (e.code === "P2002") return res.status(409).json({ error: "email en uso" });
    if (e.code === "P2025") return res.status(404).json({ error: "no existe" });
    console.error(e);
    res.status(500).json({ error: "error actualizando usuario" });
  }
});

// DELETE usuario (deja tareas con assigneeId = NULL por el onDelete:SetNull)
app.delete("/api/users/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    await prisma.user.delete({ where: { id } });
    res.status(204).end();
  } catch (e) {
    if (e.code === "P2025") return res.status(404).json({ error: "no existe" });
    console.error(e);
    res.status(500).json({ error: "error eliminando usuario" });
  }
});

/** ------- REST: PROJECTS ------- **/
app.get("/api/projects", async (req, res) => {
  const projects = await prisma.project.findMany({ orderBy: { id: "desc" } });
  res.json(projects);
});

app.post("/api/projects", async (req, res) => {
  const { name, description } = req.body || {};
  if (!name) return res.status(400).json({ error: "name requerido" });
  const project = await prisma.project.create({ data: { name, description } });
  res.status(201).json(project);
});

app.get("/api/projects/:id", async (req, res) => {
  const id = Number(req.params.id);
  const project = await prisma.project.findUnique({
    where: { id },
    include: { tasks: { include: { assignee: true } } }
  });
  if (!project) return res.status(404).json({ error: "no existe" });
  res.json(project);
});

app.put("/api/projects/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { name, description } = req.body || {};
  const updated = await prisma.project.update({
    where: { id },
    data: { name, description }
  });
  res.json(updated);
});

app.delete("/api/projects/:id", async (req, res) => {
  const id = Number(req.params.id);
  await prisma.task.deleteMany({ where: { projectId: id } });
  await prisma.project.delete({ where: { id } });
  res.status(204).end();
});

/** ------- REST: TASKS ------- **/
app.get("/api/projects/:id/tasks", async (req, res) => {
  const projectId = Number(req.params.id);
  const tasks = await prisma.task.findMany({
    where: { projectId },
    include: { assignee: true },
    orderBy: { id: "desc" }
  });
  res.json(tasks);
});

app.post("/api/projects/:id/tasks", async (req, res) => {
  const projectId = Number(req.params.id);
  const { title, status = "todo", assigneeId, dueDate } = req.body || {};
  if (!title) return res.status(400).json({ error: "title requerido" });

  const task = await prisma.task.create({
    data: { title, status, projectId, assigneeId: assigneeId ?? null, dueDate: dueDate ? new Date(dueDate) : null },
    include: { assignee: true }
  });

  // Emitir tiempo real
  io.to(`project:${projectId}`).emit("task:created", { projectId, task });
  res.status(201).json(task);
});

app.put("/api/tasks/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { title, status, assigneeId, dueDate } = req.body || {};

  const data = {};
  if (title !== undefined) data.title = title;
  if (status !== undefined) data.status = status;
  if (assigneeId !== undefined) {
    // permite desasignar explícitamente con null,
    // o mantener asignado si no se envía el campo
    data.assigneeId = assigneeId === null ? null : Number(assigneeId);
  }
  if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;

  const updated = await prisma.task.update({
    where: { id },
    data,
    include: { assignee: true }
  });

  io.to(`project:${updated.projectId}`).emit("task:updated", { projectId: updated.projectId, task: updated });
  res.json(updated);
});


app.delete("/api/tasks/:id", async (req, res) => {
  const id = Number(req.params.id);
  const task = await prisma.task.delete({ where: { id } });
  io.to(`project:${task.projectId}`).emit("task:deleted", { projectId: task.projectId, taskId: id });
  res.status(204).end();
});

/** ------- HTTP + Socket.IO ------- **/
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  // Cliente se une a la sala de un proyecto para recibir eventos
  socket.on("joinProject", (projectId) => {
    socket.join(`project:${projectId}`);
  });
});

const PORT = process.env.PORT || 3001;
module.exports = { app, server, prisma };

if (require.main === module && process.env.NODE_ENV !== "test") {
  server.listen(PORT, () =>
    console.log(`API+Socket escuchando en http://localhost:${PORT}`)
  );
}

