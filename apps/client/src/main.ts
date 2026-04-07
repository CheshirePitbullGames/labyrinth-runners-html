import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import {
  API_HEALTH_ENDPOINT,
  DEFAULT_CLIENT_PLAYER_NAME,
  type ApiHealthResponse,
  type ClientToServerEvents,
  type ServerToClientEvents,
} from "@maze/shared";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
const wsUrl = import.meta.env.VITE_WS_URL ?? apiBaseUrl;

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root element was not found.");
}

app.innerHTML = `
  <main>
    <h1>Maze Adventure Game</h1>
    <p>Monorepo scaffold for the browser client, backend server, and shared protocol package.</p>
    <section>
      <h2>API status</h2>
      <pre id="api-status">Loading...</pre>
    </section>
    <section>
      <h2>Realtime status</h2>
      <pre id="socket-status">Connecting...</pre>
    </section>
  </main>
`;

const apiStatus = document.querySelector<HTMLPreElement>("#api-status");
const socketStatus = document.querySelector<HTMLPreElement>("#socket-status");

const renderJson = (target: HTMLPreElement | null, value: unknown) => {
  if (target) {
    target.textContent = JSON.stringify(value, null, 2);
  }
};

void fetch(`${apiBaseUrl}${API_HEALTH_ENDPOINT}`)
  .then(async (response) => {
    const json = (await response.json()) as ApiHealthResponse;
    renderJson(apiStatus, json);
  })
  .catch((error: unknown) => {
    renderJson(apiStatus, {
      ok: false,
      message: "Failed to reach API",
      error: error instanceof Error ? error.message : String(error),
    });
  });

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(wsUrl, {
  transports: ["websocket"],
});

socket.on("connect", () => {
  renderJson(socketStatus, {
    ok: true,
    message: "Socket connected",
    socketId: socket.id,
  });

  socket.emit("player:ready", {
    playerName: DEFAULT_CLIENT_PLAYER_NAME,
  });
});

socket.on("match:snapshot", (payload) => {
  renderJson(socketStatus, {
    connected: true,
    snapshot: payload,
  });
});

socket.on("system:message", (payload) => {
  renderJson(socketStatus, payload);
});

socket.on("connect_error", (error: Error) => {
  renderJson(socketStatus, {
    ok: false,
    message: "Socket connection failed",
    error: error.message,
  });
});
