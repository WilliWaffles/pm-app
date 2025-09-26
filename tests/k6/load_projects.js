import http from "k6/http";
import { check, sleep } from "k6";

export const options = { vus: 20, duration: "30s" };

export default function () {
  const res = http.get("http://localhost:3001/api/projects");
  check(res, {
    "status 200": (r) => r.status === 200,
    "json": (r) => String(r.headers["Content-Type"] || "").includes("application/json"),
  });
  sleep(1);
}
