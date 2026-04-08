import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { Server as SocketIOServer } from "socket.io";
import {
  API_SESSION_ENDPOINT,
  DEFAULT_ROOM_STATE,
  PLAYER_NAME_MAX_LENGTH,
  type ApiErrorResponse,
  type ClientToServerEvents,
  type CreateSessionRequest,
  type ServerToClientEvents,
  type SessionResponse,
  type SessionUser,
} from "@maze/shared";

import { createAuthStore, type AuthStore } from "./auth-store.js";

export interface ServerRuntimeOptions {
  clientOrigin?: string;
  port?: number;
  socketPath?: string;
  publicApiBaseUrl?: string;
  logger?: boolean;
}

interface MazeSocketData {
  role: "admin" | "player";
  user?: SessionUser;
}

declare module "fastify" {
  interface FastifyInstance {
    authStore: AuthStore;
    io: SocketIOServer<
      ClientToServerEvents,
      ServerToClientEvents,
      Record<string, never>,
      MazeSocketData
    > | null;
  }
}

const ADMIN_ROOM = "admin-panel";

const normalizeName = (value: string) => value.trim().replace(/\s+/g, " ");

const getBearerToken = (authorizationHeader?: string) => {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token.trim();
};

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

  app.decorate("authStore", createAuthStore());
  app.decorate("io", null);

  await app.register(cors, {
    origin: clientOrigin,
    credentials: true,
  });

  app.get("/health", async () => ({
    status: "ok",
    service: "server",
    timestamp: new Date().toISOString(),
  }));

  app.get("/api/config", async () => ({
    restBaseUrl:
      options.publicApiBaseUrl ??
      process.env.PUBLIC_API_BASE_URL ??
      `http://localhost:${port}`,
    socketPath,
    authoritative: true,
  }));

  app.get<{ Reply: SessionResponse | ApiErrorResponse }>(
    API_SESSION_ENDPOINT,
    async (request, reply) => {
      const sessionToken = getBearerToken(request.headers.authorization);

      if (!sessionToken) {
        return reply.code(401).send({
          error: "Missing session token.",
        });
      }

      const session = app.authStore.getSession(sessionToken);

      if (!session) {
        return reply.code(401).send({
          error: "Session not found.",
        });
      }

      return session;
    },
  );

  app.post<{ Body: CreateSessionRequest; Reply: SessionResponse | ApiErrorResponse }>(
    API_SESSION_ENDPOINT,
    async (request, reply) => {
      const name = normalizeName(request.body?.name ?? "");

      if (!name) {
        return reply.code(400).send({
          error: "Name is required.",
        });
      }

      if (name.length > PLAYER_NAME_MAX_LENGTH) {
        return reply.code(400).send({
          error: `Name must be ${PLAYER_NAME_MAX_LENGTH} characters or fewer.`,
        });
      }

      const { session, adminLogin } = app.authStore.createOrReuseSession(name);

      app.log.info(
        {
          userId: session.user.id,
          playerName: session.user.name,
          isNewUser: session.isNewUser,
          loginAt: adminLogin.loginAt,
        },
        "player login",
      );

      app.io?.to(ADMIN_ROOM).emit("admin:user:login", adminLogin);

      return session;
    },
  );

  return app;
};

export const registerSocketServer = (
  app: FastifyInstance,
  options: ServerRuntimeOptions = {},
) => {
  const clientOrigin =
    options.clientOrigin ?? process.env.CLIENT_ORIGIN ?? "http://localhost:5173";
  const socketPath = options.socketPath ?? process.env.SOCKET_PATH ?? "/socket.io";

  const io = new SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    Record<string, never>,
    MazeSocketData
  >(app.server, {
    cors: {
      origin: clientOrigin,
      credentials: true,
    },
    path: socketPath,
  });

  app.io = io;

  io.use((socket, next) => {
    const role =
      socket.handshake.auth && typeof socket.handshake.auth === "object"
        ? socket.handshake.auth.role
        : undefined;

    if (role === "admin") {
      socket.data.role = "admin";
      return next();
    }

    const sessionToken =
      socket.handshake.auth &&
      typeof socket.handshake.auth === "object" &&
      typeof socket.handshake.auth.sessionToken === "string"
        ? socket.handshake.auth.sessionToken
        : null;

    if (!sessionToken) {
      return next(new Error("Session required before opening realtime connection."));
    }

    const session = app.authStore.getSession(sessionToken);

    if (!session) {
      return next(new Error("Session is invalid or expired."));
    }

    socket.data.role = "player";
    socket.data.user = session.user;
    return next();
  });

  io.on("connection", (socket) => {
    if (socket.data.role === "admin") {
      socket.join(ADMIN_ROOM);
      app.log.info({ socketId: socket.id }, "admin panel connected");
      return;
    }

    app.log.info(
      {
        socketId: socket.id,
        userId: socket.data.user?.id,
        playerName: socket.data.user?.name,
      },
      "client connected",
    );

    socket.emit("match:snapshot", DEFAULT_ROOM_STATE);
    socket.emit("system:message", {
      message: `Welcome back, ${socket.data.user?.name ?? "player"}.`,
      level: "info",
    });

    socket.on("player:ready", (payload) => {
      socket.emit("system:message", {
        message: `${socket.data.user?.name ?? payload.playerName} joined the maze lobby`,
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
      app.log.info(
        {
          socketId: socket.id,
          userId: socket.data.user?.id,
          playerName: socket.data.user?.name,
          reason,
        },
        "client disconnected",
      );
    });
  });

  return io;
};
