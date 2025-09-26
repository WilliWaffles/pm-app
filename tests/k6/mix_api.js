import http from "k6/http";
import { check, sleep } from "k6";

export const options = { vus: 10, duration: "30s" };
const BASE = "http://localhost:3001";

export default function () {
  // 1) GET proyectos
  let res = http.get(`${BASE}/api/projects`);
  check(res, { "GET /projects 200": (r) => r.status === 200 });

  // 2) Si hay alguno, crea una tarea en el primero
  const list = res.json();
  if (Array.isArray(list) && list.length > 0) {
    const pid = list[0].id;
    const payload = JSON.stringify({ title: `Task ${Date.now()}`, status: "todo" });
    res = http.post(`${BASE}/api/projects/${pid}/tasks`, payload, {
      headers: { "Content-Type": "application/json" },
    });
    check(res, { "POST /tasks 201": (r) => r.status === 201 });
  }

  sleep(1);
}
