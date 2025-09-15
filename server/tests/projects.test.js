const request = require("supertest");
const { app, server, prisma } = require("../index");

beforeAll(async () => {
  // Limpia tablas para un estado predecible
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
  server.close();
});

describe("Projects API", () => {
  test("GET /api/projects debe responder [] inicialmente", async () => {
    const res = await request(app).get("/api/projects");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("POST /api/projects crea un proyecto", async () => {
    const res = await request(app)
      .post("/api/projects")
      .send({ name: "Proyecto Test", description: "Descripción" })
      .set("Content-Type", "application/json");
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.name).toBe("Proyecto Test");
  });

  test("GET /api/projects/:id devuelve el proyecto creado", async () => {
    const all = await request(app).get("/api/projects");
    const id = all.body[0].id;
    const res = await request(app).get(`/api/projects/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(id);
    expect(Array.isArray(res.body.tasks)).toBe(true);
  });
});
