import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { Server as SocketIOServer } from "socket.io";
import {
  DEFAULT_ROOM_STATE,
  type ClientToServerEvents,
  type ServerToClientEvents,
} from "@maze/shared";

export interface ServerRuntimeOptions {
  clientOrigin?: string;
  port?: number;
  socketPath?: string;
  publicApiBaseUrl?: string;
  logger?: boolean;
}

export const buildApp = async (
  options: ServerRuntimeOptions = {},
): Promise<FastifyInstance> => {
  const port = options.port ?? Number(process.env.PORT ?? 3000);
  const clientOrigin =
    options.clientOrigin ?? process.env.CLIENT_ORIGIN ?? "http://localhost:5173";
  const socketPath = options.socketPath ?? process.env.SOCKET_PATH ?? "/socket.io";

  const app = Fastify({
    logger: options.logger ?? true,
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
    restBaseUrl:
      options.publicApiBaseUrl ??
      process.env.PUBLIC_API_BASE_URL ??
      `http://localhost:${port}`,
    socketPath,
    authoritative: true,
  }));

  return app;
};

export const registerSocketServer = (
  app: FastifyInstance,
  options: ServerRuntimeOptions = {},
) => {
  const clientOrigin =
    options.clientOrigin ?? process.env.CLIENT_ORIGIN ?? "http://localhost:5173";
  const socketPath = options.socketPath ?? process.env.SOCKET_PATH ?? "/socket.io";

  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(
    app.server,
    {
      cors: {
        origin: clientOrigin,
        credentials: true,
      },
      path: socketPath,
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

  return io;
};
