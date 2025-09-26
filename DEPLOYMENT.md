# Despliegue (Docker Compose)

## Requisitos
- Docker Desktop
- Puertos disponibles: 3001 (API), 3002 (notify), 4173 (frontend, preview), 6379 (Redis)

## Variables de entorno
- `services/api/.env`:
DATABASE_URL=file:/app/data/dev.db
REDIS_URL=redis://redis:6379
- `services/notify/.env`:
REDIS_URL=redis://redis:6379

## Levantar todo
```bash
cd infra
docker compose up -d --build
docker compose ps
```

## Salud y pruebas rápidas

API: curl http://localhost:3001/api/projects (debería dar [] o lista)

Notify: http://localhost:3002/health → { "ok": true }

Frontend: http://localhost:4173

Escalar Notify
docker compose up -d --scale notify=2

Parar/borrar
docker compose down
# o con datos:
docker compose down -v
