# Maze Adventure Game

Maze Adventure Game is a browser-first multiplayer PvPvE maze crawler built
around procedural rooms, real-time combat, extraction pressure, and
session-based roguelite progression.

This repository now uses a **monorepo** layout with separate client and server
applications plus a shared package for protocol contracts.

## Architecture Direction

The recommended structure for this project is:

- **one repository**
- **separate client and server apps**
- **shared protocol/types package**
- **REST for account and meta flows**
- **WebSocket for realtime gameplay**
- **server-authoritative simulation**

This is the best balance for an early multiplayer game because it keeps
contracts, DTOs, event names, and shared config close together while still
keeping deployment boundaries clean.

## Tech Stack

### Client

- HTML5
- TypeScript
- Vite
- Phaser 3 later for gameplay scenes
- Socket.IO client for realtime communication

### Server

- Node.js
- TypeScript
- Fastify
- Socket.IO
- Redis
- PostgreSQL

### Shared

- shared event names
- shared payload types
- shared runtime constants
- shared DTOs and schemas

## Repository Layout

```text
.
|-- apps/
|   |-- client/        # Browser frontend
|   `-- server/        # REST API + realtime game server
|-- packages/
|   `-- shared/        # Shared protocol/types/constants
|-- docs/
|   `-- GAME_DESIGN_DOCUMENT.md
|-- compose.yaml
|-- .env.example
|-- package.json
`-- tsconfig.base.json
```

## Documentation

- [Game Design Document](docs/GAME_DESIGN_DOCUMENT.md)

## Communication Model

### REST / HTTP

Use REST for:

- login and auth
- profile/account data
- cosmetics/store
- matchmaking entry and leave
- progression and meta systems

### WebSocket

Use WebSocket for:

- player input
- room snapshots
- door and hazard state
- combat events
- live match updates
- reconnect flow

The current scaffold uses **Socket.IO** to make early iteration, reconnect
handling, and room-based messaging easier.

## Docker Compose Naming

The modern preferred filename is:

- `compose.yaml`

This is the canonical name recognized by modern Docker Compose. Older names like
`docker-compose.yml` still work in many setups, but `compose.yaml` is the better
default for new projects.

## Local Development

### 1. Create your environment file

```bash
cp .env.example .env
```

### 2. Install dependencies locally

```bash
npm install
```

### 3. Run the apps without Docker

In separate terminals:

```bash
npm run dev:server
npm run dev:client
```

### 4. Start the full stack with Docker Compose

```bash
docker compose up --build
```

This starts:

- PostgreSQL
- Redis
- backend server on `http://localhost:3000`
- frontend client on `http://localhost:5173`

### 5. Inspect logs

```bash
docker compose logs -f client server postgres redis
```

## Scaffolded Packages

### `packages/shared`

Contains the first shared protocol definitions for:

- health endpoint constants
- player ready payload
- ping payload
- match snapshot payload
- system message payload
- typed Socket.IO event contracts

### `apps/server`

Contains a minimal Fastify + Socket.IO server with:

- `GET /health`
- `GET /api/config`
- a typed realtime connection
- an initial lobby snapshot event

### `apps/client`

Contains a minimal Vite client that:

- calls the health endpoint
- opens a Socket.IO connection
- sends a `player:ready` event
- renders server responses onscreen

## Initial Architecture Notes

- The multiplayer simulation should stay server authoritative.
- Maze instances should be managed per match, with room logic separated
  internally instead of one process per room.
- Redis should handle transient state, queues, and reconnect/session support.
- PostgreSQL should hold accounts, cosmetics, account progression, and match
  history.
- The first milestone should target a desktop browser MVP with a small player
  count and a single region/theme.

## Next Recommended Steps

1. add Phaser to `apps/client`
2. model room and entity snapshots in `packages/shared`
3. add database and Redis adapters in `apps/server`
4. add matchmaking and session lifecycle modules
5. define a first maze generation prototype
