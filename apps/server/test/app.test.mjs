import assert from "node:assert/strict";
import { once } from "node:events";
import { test } from "node:test";

import { io as createSocketClient } from "socket.io-client";

import { buildApp, registerSocketServer } from "../dist/app.js";

const createTestApp = async () =>
  buildApp({
    logger: false,
    port: 3000,
    clientOrigin: "http://localhost:5173",
    publicApiBaseUrl: "https://api.example.com",
    socketPath: "/socket.io",
  });

const startRealtimeServer = async () => {
  const app = await createTestApp();

  registerSocketServer(app, {
    logger: false,
    clientOrigin: "http://localhost:5173",
    socketPath: "/socket.io",
  });

  await app.listen({
    port: 0,
    host: "127.0.0.1",
  });

  const address = app.server.address();

  if (!address || typeof address === "string") {
    throw new Error("Failed to start test server.");
  }

  return {
    app,
    baseUrl: `http://127.0.0.1:${address.port}`,
  };
};

/**
 * The server emits some socket events immediately after connection, so tests
 * register the listener before connecting and fail fast if the event never arrives.
 */
const waitForSocketEvent = (socket, eventName, timeoutMs = 2000) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(eventName, handleEvent);
      reject(new Error(`Timed out waiting for socket event: ${eventName}`));
    }, timeoutMs);

    const handleEvent = (payload) => {
      clearTimeout(timer);
      resolve(payload);
    };

    socket.once(eventName, handleEvent);
  });

test("GET /health returns server status", async () => {
  const app = await createTestApp();

  try {
    const response = await app.inject({
      method: "GET",
      url: "/health",
    });

    assert.equal(response.statusCode, 200);
    const payload = response.json();
    assert.equal(payload.status, "ok");
    assert.equal(payload.service, "server");
    assert.match(payload.timestamp, /^\d{4}-\d{2}-\d{2}T/);
  } finally {
    await app.close();
  }
});

test("GET /api/config returns runtime config", async () => {
  const app = await createTestApp();

  try {
    const response = await app.inject({
      method: "GET",
      url: "/api/config",
    });

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json(), {
      restBaseUrl: "https://api.example.com",
      socketPath: "/socket.io",
      authoritative: true,
    });
  } finally {
    await app.close();
  }
});

test("POST /api/session rejects blank or too-long player names", async () => {
  const app = await createTestApp();

  try {
    const blankResponse = await app.inject({
      method: "POST",
      url: "/api/session",
      payload: {
        name: "   ",
      },
    });

    assert.equal(blankResponse.statusCode, 400);
    assert.deepEqual(blankResponse.json(), {
      error: "Name is required.",
    });

    const tooLongResponse = await app.inject({
      method: "POST",
      url: "/api/session",
      payload: {
        name: "A".repeat(33),
      },
    });

    assert.equal(tooLongResponse.statusCode, 400);
    assert.deepEqual(tooLongResponse.json(), {
      error: "Name must be 32 characters or fewer.",
    });
  } finally {
    await app.close();
  }
});

test("POST /api/session creates a new player and reuses the user record", async () => {
  const app = await createTestApp();

  try {
    const firstResponse = await app.inject({
      method: "POST",
      url: "/api/session",
      payload: {
        name: "  Alice   Example  ",
      },
    });

    assert.equal(firstResponse.statusCode, 200);

    const firstSession = firstResponse.json();
    assert.equal(typeof firstSession.sessionToken, "string");
    assert.equal(firstSession.isNewUser, true);
    assert.equal(firstSession.user.name, "Alice Example");
    assert.equal(firstSession.user.loginCount, 1);

    const secondResponse = await app.inject({
      method: "POST",
      url: "/api/session",
      payload: {
        name: "alice example",
      },
    });

    assert.equal(secondResponse.statusCode, 200);

    const secondSession = secondResponse.json();
    assert.equal(secondSession.isNewUser, false);
    assert.equal(secondSession.user.id, firstSession.user.id);
    assert.equal(secondSession.user.loginCount, 2);

    const loginAudit = app.authStore.getLogins();
    assert.equal(loginAudit.length, 2);
    assert.equal(loginAudit[0].user.id, firstSession.user.id);
    assert.equal(loginAudit[0].isNewUser, false);
    assert.equal(loginAudit[1].isNewUser, true);
  } finally {
    await app.close();
  }
});

test("GET /api/session restores a saved session token", async () => {
  const app = await createTestApp();

  try {
    const loginResponse = await app.inject({
      method: "POST",
      url: "/api/session",
      payload: {
        name: "Maze Runner",
      },
    });

    const loginSession = loginResponse.json();

    const restoreResponse = await app.inject({
      method: "GET",
      url: "/api/session",
      headers: {
        authorization: `Bearer ${loginSession.sessionToken}`,
      },
    });

    assert.equal(restoreResponse.statusCode, 200);
    const restoredSession = restoreResponse.json();
    assert.equal(restoredSession.sessionToken, loginSession.sessionToken);
    assert.equal(restoredSession.isNewUser, false);
    assert.equal(restoredSession.user.id, loginSession.user.id);
    assert.equal(restoredSession.user.name, loginSession.user.name);
    assert.equal(restoredSession.user.loginCount, loginSession.user.loginCount);
    assert.match(restoredSession.user.createdAt, /^\d{4}-\d{2}-\d{2}T/);
    assert.match(restoredSession.user.lastLoginAt, /^\d{4}-\d{2}-\d{2}T/);
  } finally {
    await app.close();
  }
});

test("GET /api/session rejects missing or unknown session tokens", async () => {
  const app = await createTestApp();

  try {
    const missingTokenResponse = await app.inject({
      method: "GET",
      url: "/api/session",
    });

    assert.equal(missingTokenResponse.statusCode, 401);
    assert.deepEqual(missingTokenResponse.json(), {
      error: "Missing session token.",
    });

    const unknownTokenResponse = await app.inject({
      method: "GET",
      url: "/api/session",
      headers: {
        authorization: "Bearer unknown-session-token",
      },
    });

    assert.equal(unknownTokenResponse.statusCode, 401);
    assert.deepEqual(unknownTokenResponse.json(), {
      error: "Session not found.",
    });
  } finally {
    await app.close();
  }
});

test("websocket rejects player connections without a valid session", async () => {
  const { app, baseUrl } = await startRealtimeServer();

  try {
    const socket = createSocketClient(baseUrl, {
      path: "/socket.io",
      transports: ["websocket"],
      auth: {},
      reconnection: false,
    });

    const [connectionError] = await once(socket, "connect_error");
    assert.equal(connectionError.message, "Session required before opening realtime connection.");
    socket.close();
  } finally {
    await app.close();
  }
});

test("websocket authenticates players and emits admin login notifications", async () => {
  const { app, baseUrl } = await startRealtimeServer();

  try {
    const adminSocket = createSocketClient(baseUrl, {
      path: "/socket.io",
      transports: ["websocket"],
      auth: {
        role: "admin",
      },
      autoConnect: false,
      reconnection: false,
    });

    const adminConnected = once(adminSocket, "connect");
    const adminLoginEvent = waitForSocketEvent(adminSocket, "admin:user:login");
    adminSocket.connect();
    await adminConnected;

    const loginResponse = await app.inject({
      method: "POST",
      url: "/api/session",
      payload: {
        name: "Explorer One",
      },
    });

    assert.equal(loginResponse.statusCode, 200);
    const session = loginResponse.json();

    const adminLoginPayload = await adminLoginEvent;
    assert.equal(adminLoginPayload.user.id, session.user.id);
    assert.equal(adminLoginPayload.user.name, "Explorer One");
    assert.equal(adminLoginPayload.isNewUser, true);
    assert.equal(adminLoginPayload.activeSessions, 1);
    assert.match(adminLoginPayload.loginAt, /^\d{4}-\d{2}-\d{2}T/);

    const playerSocket = createSocketClient(baseUrl, {
      path: "/socket.io",
      transports: ["websocket"],
      auth: {
        sessionToken: session.sessionToken,
      },
      autoConnect: false,
      reconnection: false,
    });

    const playerConnected = once(playerSocket, "connect");
    const matchSnapshotEvent = waitForSocketEvent(playerSocket, "match:snapshot");
    const welcomeMessageEvent = waitForSocketEvent(playerSocket, "system:message");
    playerSocket.connect();
    await playerConnected;

    const matchSnapshot = await matchSnapshotEvent;
    assert.equal(matchSnapshot.roomId, "room-start-001");

    const welcomeMessage = await welcomeMessageEvent;
    assert.equal(welcomeMessage.level, "info");
    assert.equal(welcomeMessage.message, "Welcome back, Explorer One.");

    const joinedMessageEvent = waitForSocketEvent(playerSocket, "system:message");
    playerSocket.emit("player:ready", {
      playerName: "Ignored Name",
    });

    const joinedMessage = await joinedMessageEvent;
    assert.equal(joinedMessage.level, "info");
    assert.equal(joinedMessage.message, "Explorer One joined the maze lobby");

    playerSocket.close();
    adminSocket.close();
  } finally {
    await app.close();
  }
});
