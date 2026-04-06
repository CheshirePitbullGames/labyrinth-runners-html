# Maze Adventure Game

Maze Adventure Game is a browser-first multiplayer PvPvE maze crawler built around
procedural rooms, real-time combat, extraction pressure, and session-based
roguelite progression. This repository is being initialized with the core project
documentation and local development infrastructure needed to begin implementation.

## Vision

Players enter dangerous procedurally generated mazes, loot gear, survive monsters,
outplay or cooperate with rival players, and push toward a central boss objective
while an outer hazard forces the match inward.

The long-term product direction combines:

- online multiplayer action-adventure
- room-based maze exploration
- PvPvE encounters
- extraction and survival tension
- light roguelite session structure
- server-authoritative browser gameplay

## Planned Stack

### Client

- HTML5
- TypeScript
- Phaser 3
- WebSocket client for live gameplay
- REST API integration for account and meta systems

### Server

- Node.js
- TypeScript
- Fastify
- Socket.IO or `ws`
- Redis for transient state and matchmaking support
- PostgreSQL for persistent player and progression data

## Repository Layout

This repository currently contains the initial documentation and infrastructure
scaffold. The intended project layout is:

```text
.
|-- apps/
|   |-- client/        # Browser game client (planned)
|   `-- server/        # API + match server (planned)
|-- docs/
|   `-- GAME_DESIGN_DOCUMENT.md
|-- docker-compose.yml
|-- .env.example
`-- README.md
```

## Documentation

- [Game Design Document](docs/GAME_DESIGN_DOCUMENT.md)

## Local Development

### 1. Create your environment file

```bash
cp .env.example .env
```

### 2. Start core infrastructure

This brings up PostgreSQL and Redis, which are the required backing services for
the planned backend architecture.

```bash
docker compose up -d postgres redis
```

### 3. Start the application profile later

The compose file also includes `client` and `server` services under the `app`
profile. These services are ready to use once `apps/client` and `apps/server`
have been initialized with their package manifests and dev scripts.

```bash
docker compose --profile app up
```

### 4. Inspect logs

```bash
docker compose logs -f postgres redis
```

## Initial Architecture Notes

- The multiplayer simulation should stay server authoritative.
- Maze instances should be managed per match, with room logic separated
  internally instead of one process per room.
- Redis should handle transient state, queues, and reconnect/session support.
- PostgreSQL should hold accounts, cosmetics, account progression, and match
  history.
- The first milestone should target a desktop browser MVP with a small player
  count and a single region/theme.

## MVP Focus

The initial playable target is one browser-based maze run with:

- account login
- one region tileset
- 2 to 4 players
- procedural room-based maze generation
- basic PvE and PvP combat
- chest, trap, merchant, and boss rooms
- hazard pressure toward the center
- temporary in-match progression
- cosmetic-only persistent account progression

## Next Steps

Recommended follow-up work after this repo initialization:

1. scaffold `apps/client` with Phaser + TypeScript + Vite
2. scaffold `apps/server` with Fastify + WebSocket support
3. define shared game protocol and room state schemas
4. prototype maze generation and room transition rules
5. add local development scripts, linting, and test foundations
