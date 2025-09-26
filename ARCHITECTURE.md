# Arquitectura de pm-app (Fase 2)

## Visión general
- **API Service (services/api)**: CRUD de usuarios/proyectos/tareas. Lee/escribe en **SQLite** (migrado a `/app/data/dev.db` con volumen). Publica eventos en **Redis (canal `tasks`)** y cachea `/api/projects` (clave `cache:projects`).
- **Notify Service (services/notify)**: WebSocket (Socket.IO) para tiempo real. Se suscribe a `tasks` en Redis y hace **fan-out** a los clientes conectados por sala (`project:{id}`).
- **Redis**: Broker Pub/Sub + caché.
- **Client (client/)**: React + Vite. Se conecta a la API (HTTP) y a notify (WS). Gestor de estado ligero, componentes de Proyectos/Usuarios/Detalle.

## Patrones
- **Microservicios**: Separación API / tiempo real (notify). Permite escalar de forma independiente.
- **Pub/Sub**: Redis como distribuidor de eventos de tareas. Mejora tolerancia a fallos y desacopla los servicios.
- **Cache**: GET `/api/projects` con TTL (30–120s), reduciendo carga en DB.

## Escalabilidad
- Escalar `notify` horizontalmente (`docker compose up -d --scale notify=N`).
- API puede escalarse; para sesiones WS no hay estado en API, por lo que solo no rompe.  
- Futuro: balanceador (Nginx/Traefik) y dominios para producción.
