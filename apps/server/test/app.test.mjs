import assert from "node:assert/strict";
import { test } from "node:test";

import { buildApp } from "../dist/app.js";

const createTestApp = async () =>
  buildApp({
    logger: false,
    port: 3000,
    clientOrigin: "http://localhost:5173",
    publicApiBaseUrl: "https://api.example.com",
    socketPath: "/socket.io",
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
    assert.deepEqual(restoreResponse.json(), {
      sessionToken: loginSession.sessionToken,
      user: loginSession.user,
      isNewUser: false,
    });
  } finally {
    await app.close();
  }
});
