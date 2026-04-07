import Fastify from "fastify";
import cors from "@fastify/cors";
import { Server as SocketIOServer } from "socket.io";
import {
  DEFAULT_ROOM_STATE,
  type ClientToServerEvents,
  type ServerToClientEvents,
} from "@maze/shared";

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "0.0.0.0";
const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

const app = Fastify({
  logger: true,
});

await app.register(cors, {
  origin: clientOrigin,
  credentials: true,
});

app.get("/health", async () => ({
  status: "ok",
  service: "server",
}));

app.get("/api/config", async () => ({
  restBaseUrl: process.env.PUBLIC_API_BASE_URL ?? `http://localhost:${port}`,
  socketPath: process.env.SOCKET_PATH ?? "/socket.io",
  authoritative: true,
}));

const server = await app.listen({
  port,
  host,
});

const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(
  app.server,
  {
    cors: {
      origin: clientOrigin,
      credentials: true,
    },
    path: process.env.SOCKET_PATH ?? "/socket.io",
  },
);

io.on("connection", (socket) => {
  app.log.info({ socketId: socket.id }, "client connected");

  socket.emit("match:snapshot", DEFAULT_ROOM_STATE);

  socket.on("player:ready", (payload) => {
    socket.emit("system:message", {
      message: `${payload.playerName} joined the maze lobby`,
      level: "info",
    });
  });

  socket.on("player:ping", (payload) => {
    socket.emit("system:message", {
      message: `Ping received at ${payload.at}`,
      level: "info",
    });
  });

  socket.on("disconnect", (reason) => {
    app.log.info({ socketId: socket.id, reason }, "client disconnected");
  });
});

app.log.info(`HTTP and WebSocket server listening at ${server}`);
