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
    assert.deepEqual(response.json(), {
      status: "ok",
      service: "server",
    });
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
