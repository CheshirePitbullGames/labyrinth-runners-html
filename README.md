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

### 4. Run the automated checks

```bash
npm run typecheck
npm test
```

### 5. Start the full stack with Docker Compose

```bash
docker compose up --build
```

This starts:

- PostgreSQL
- Redis
- backend server on `http://localhost:3000`
- frontend client on `http://localhost:5173`

### 6. Inspect logs

```bash
docker compose logs -f client server postgres redis
```

## GitHub Actions Deployment

The repository includes a GitHub Actions workflow at
`.github/workflows/docker-deploy.yml` that:

- builds production images for `apps/server` and `apps/client`
- pushes those images to `ghcr.io/<owner>/<repo>/server:<commit-sha>` and
  `ghcr.io/<owner>/<repo>/client:<commit-sha>`
- connects to a Hetzner server over SSH
- updates a Docker Compose stack using `deploy/compose.hetzner.yaml`

### Required GitHub Actions secrets

Set these repository secrets before enabling the workflow:

- `HETZNER_HOST` - server hostname or IP
- `HETZNER_USER` - SSH user for deployments
- `HETZNER_SSH_KEY` - private key GitHub Actions uses to connect
- `GHCR_USERNAME` - GitHub username or machine user that can pull GHCR packages
- `GHCR_TOKEN` - GitHub token with `read:packages`
- `APP_BASE_URL` - public client URL, for example `https://game.example.com`
- `API_BASE_URL` - public API/WebSocket URL, for example
  `https://api.example.com`
- `POSTGRES_PASSWORD` - database password for the production database container

Optional secrets:

- `HETZNER_PORT` - defaults to `22`
- `HETZNER_DEPLOY_PATH` - defaults to `/opt/maze-adventure-game`
- `POSTGRES_DB` - defaults to `maze_adventure`
- `POSTGRES_USER` - defaults to `maze`
- `CLIENT_PORT` - defaults to `80`
- `SERVER_PORT` - defaults to `3000`
- `SOCKET_PATH` - defaults to `/socket.io`

### Workflow behavior

- `pull_request` runs build-only validation for both Docker images
- `push` to `main` builds, publishes, and deploys the updated images
- `workflow_dispatch` lets you manually trigger the same publish and deploy flow

### Hetzner host prerequisites

The target server should already have:

- Docker Engine installed
- Docker Compose v2 available as `docker compose`
- network access to `ghcr.io`
- permission for the configured SSH user to run Docker commands

The deployment writes an `.env` file into the remote deploy directory and then
runs:

```bash
docker compose --env-file .env -f compose.hetzner.yaml pull
docker compose --env-file .env -f compose.hetzner.yaml up -d --remove-orphans
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
