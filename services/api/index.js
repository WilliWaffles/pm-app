// services/api/index.js
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { PrismaClient } = require("@prisma/client");
const Redis = require("ioredis");

const prisma = new PrismaClient();
const app = express();

// Redis
const redis = new Redis(process.env.REDIS_URL || "redis://redis:6379");

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

/** ---------------- USERS ---------------- **/
app.get("/api/users", async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

app.post("/api/users", async (req, res) => {
  const { name, email } = req.body || {};
  if (!name || !email) return res.status(400).json({ error: "name y email requeridos" });
  try {
    const user = await prisma.user.create({ data: { name, email } });
    res.status(201).json(user);
  } catch (e) {
    if (e.code === "P2002") return res.status(409).json({ error: "email en uso" });
    throw e;
  }
});

app.get("/api/users/:id", async (req, res) => {
  const id = Number(req.params.id);
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ error: "no existe" });
  res.json(user);
});

app.put("/api/users/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { name, email } = req.body || {};
  if (!name && !email) return res.status(400).json({ error: "nada que actualizar" });
  try {
    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email })
      }
    });
    res.json(updated);
  } catch (e) {
    if (e.code === "P2002") return res.status(409).json({ error: "email en uso" });
    if (e.code === "P2025") return res.status(404).json({ error: "no existe" });
    console.error(e);
    res.status(500).json({ error: "error actualizando usuario" });
  }
});

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

/** ---------------- PROJECTS (+cache) ---------------- **/
app.get("/api/projects", async (req, res) => {
  try {
    const cached = await redis.get("cache:projects");
    if (cached) return res.json(JSON.parse(cached));
  } catch (e) {
    console.warn("Cache GET /api/projects fallo:", e.message);
  }

  const projects = await prisma.project.findMany({ orderBy: { id: "desc" } });

  try {
    await redis.set("cache:projects", JSON.stringify(projects), "EX", 30);
  } catch (e) {
    console.warn("Cache SET /api/projects fallo:", e.message);
  }

  res.json(projects);
});

app.post("/api/projects", async (req, res) => {
  const { name, description } = req.body || {};
  if (!name) return res.status(400).json({ error: "name requerido" });

  const project = await prisma.project.create({ data: { name, description } });

  // invalidar cache
  try { await redis.del("cache:projects"); } catch {}

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

  // invalidar cache
  try { await redis.del("cache:projects"); } catch {}

  res.json(updated);
});

app.delete("/api/projects/:id", async (req, res) => {
  const id = Number(req.params.id);
  await prisma.task.deleteMany({ where: { projectId: id } });
  await prisma.project.delete({ where: { id } });

  // invalidar cache
  try { await redis.del("cache:projects"); } catch {}

  res.status(204).end();
});

/** ---------------- TASKS (Pub/Sub) ---------------- **/
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
    data: {
      title,
      status,
      projectId,
      assigneeId: assigneeId ?? null,
      dueDate: dueDate ? new Date(dueDate) : null
    },
    include: { assignee: true }
  });

  // Publicar evento para notify-service
  try {
    await redis.publish("tasks", JSON.stringify({
      type: "task:created",
      projectId,
      payload: task
    }));
  } catch (e) {
    console.warn("Redis publish task:created fallo:", e.message);
  }

  res.status(201).json(task);
});

app.put("/api/tasks/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { title, status, assigneeId, dueDate } = req.body || {};

  const data = {};
  if (title !== undefined) data.title = title;
  if (status !== undefined) data.status = status;
  if (assigneeId !== undefined) data.assigneeId = assigneeId === null ? null : Number(assigneeId);
  if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;

  const updated = await prisma.task.update({
    where: { id },
    data,
    include: { assignee: true }
  });

  try {
    await redis.publish("tasks", JSON.stringify({
      type: "task:updated",
      projectId: updated.projectId,
      payload: updated
    }));
  } catch (e) {
    console.warn("Redis publish task:updated fallo:", e.message);
  }

  res.json(updated);
});

app.delete("/api/tasks/:id", async (req, res) => {
  const id = Number(req.params.id);
  const deleted = await prisma.task.delete({ where: { id } });

  try {
    await redis.publish("tasks", JSON.stringify({
      type: "task:deleted",
      projectId: deleted.projectId,
      payload: { id }
    }));
  } catch (e) {
    console.warn("Redis publish task:deleted fallo:", e.message);
  }

  res.status(204).end();
});

/** ---------------- LISTEN ---------------- **/
const PORT = process.env.PORT || 3001;

if (require.main === module && process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`API escuchando en http://localhost:${PORT}`);
  });
}

module.exports = { app, prisma };
