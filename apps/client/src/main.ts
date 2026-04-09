import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import {
  API_HEALTH_ENDPOINT,
  API_SESSION_ENDPOINT,
  PLAYER_NAME_MAX_LENGTH,
  type ApiErrorResponse,
  type ApiHealthResponse,
  type ClientToServerEvents,
  type CreateSessionRequest,
  type ServerToClientEvents,
  type SessionResponse,
} from "@maze/shared";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
const wsUrl = import.meta.env.VITE_WS_URL ?? apiBaseUrl;
const SAVED_SESSION_TOKEN_KEY = "maze.sessionToken";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root element was not found.");
}

app.innerHTML = `
  <main>
    <h1>Maze Adventure Game</h1>
    <p>Enter a player name to start. Your last session is restored automatically on this device.</p>
    <section>
      <h2>Player registration</h2>
      <form id="registration-form">
        <label for="player-name">Name</label>
        <input
          id="player-name"
          name="player-name"
          type="text"
          maxlength="${PLAYER_NAME_MAX_LENGTH}"
          autocomplete="nickname"
          required
        />
        <button type="submit">Enter maze</button>
        <button type="button" id="clear-session">Forget saved session</button>
      </form>
      <pre id="session-status">Checking for saved session...</pre>
    </section>
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

const registrationForm =
  document.querySelector<HTMLFormElement>("#registration-form");
const playerNameInput = document.querySelector<HTMLInputElement>("#player-name");
const clearSessionButton =
  document.querySelector<HTMLButtonElement>("#clear-session");
const sessionStatus = document.querySelector<HTMLPreElement>("#session-status");
const apiStatus = document.querySelector<HTMLPreElement>("#api-status");
const socketStatus = document.querySelector<HTMLPreElement>("#socket-status");

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

const renderJson = (target: HTMLPreElement | null, value: unknown) => {
  if (target) {
    target.textContent = JSON.stringify(value, null, 2);
  }
};

const renderSession = (value: unknown) => {
  renderJson(sessionStatus, value);
};

const closeSocket = () => {
  if (!socket) {
    return;
  }

  const activeSocket = socket;
  socket = null;
  activeSocket.removeAllListeners();
  activeSocket.disconnect();
};

const clearSavedSession = (message: string) => {
  localStorage.removeItem(SAVED_SESSION_TOKEN_KEY);
  closeSocket();
  renderSession({
    ok: false,
    message,
  });
  renderJson(socketStatus, {
    ok: false,
    message: "Realtime connection is idle until a session is active.",
  });
};

const connectSocket = (session: SessionResponse) => {
  closeSocket();

  socket = io(wsUrl, {
    transports: ["websocket"],
    auth: {
      sessionToken: session.sessionToken,
    },
  });

  socket.on("connect", () => {
    renderJson(socketStatus, {
      ok: true,
      message: "Socket connected",
      socketId: socket?.id,
      player: session.user.name,
    });

    socket?.emit("player:ready", {
      playerName: session.user.name,
    });
  });

  socket.on("match:snapshot", (payload) => {
    renderJson(socketStatus, {
      connected: true,
      player: session.user.name,
      snapshot: payload,
    });
  });

  socket.on("system:message", (payload) => {
    renderJson(socketStatus, {
      player: session.user.name,
      ...payload,
    });
  });

  socket.on("connect_error", (error: Error) => {
    renderJson(socketStatus, {
      ok: false,
      message: "Socket connection failed",
      error: error.message,
    });

    if (error.message.includes("Session")) {
      clearSavedSession("Saved session is no longer valid. Enter your name again.");
    }
  });

  socket.on("disconnect", (reason) => {
    renderJson(socketStatus, {
      ok: false,
      message: "Socket disconnected",
      reason,
    });
  });
};

const saveAndRenderSession = (session: SessionResponse, source: "created" | "restored") => {
  localStorage.setItem(SAVED_SESSION_TOKEN_KEY, session.sessionToken);

  if (playerNameInput) {
    playerNameInput.value = session.user.name;
  }

  renderSession({
    ok: true,
    source,
    isNewUser: session.isNewUser,
    sessionSaved: true,
    user: session.user,
  });
};

const readApiError = async (response: Response) => {
  try {
    const json = (await response.json()) as ApiErrorResponse;
    return json.error;
  } catch {
    return `Request failed with status ${response.status}`;
  }
};

const restoreSavedSession = async () => {
  const savedSessionToken = localStorage.getItem(SAVED_SESSION_TOKEN_KEY);

  if (!savedSessionToken) {
    renderSession({
      ok: false,
      message: "No saved session. Enter your name to continue.",
    });
    return;
  }

  renderSession({
    ok: true,
    message: "Restoring saved session...",
  });

  const response = await fetch(`${apiBaseUrl}${API_SESSION_ENDPOINT}`, {
    headers: {
      Authorization: `Bearer ${savedSessionToken}`,
    },
  });

  if (!response.ok) {
    clearSavedSession("Saved session expired. Enter your name to continue.");
    return;
  }

  const session = (await response.json()) as SessionResponse;
  saveAndRenderSession(session, "restored");
  connectSocket(session);
};

const createSession = async (name: string) => {
  const payload: CreateSessionRequest = {
    name,
  };

  const response = await fetch(`${apiBaseUrl}${API_SESSION_ENDPOINT}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  return (await response.json()) as SessionResponse;
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

registrationForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const rawName = playerNameInput?.value ?? "";
  const name = rawName.trim().replace(/\s+/g, " ");

  if (!name) {
    renderSession({
      ok: false,
      message: "Enter your name before joining.",
    });
    return;
  }

  renderSession({
    ok: true,
    message: "Saving session...",
  });

  void createSession(name)
    .then((session) => {
      saveAndRenderSession(session, "created");
      connectSocket(session);
    })
    .catch((error: unknown) => {
      renderSession({
        ok: false,
        message: error instanceof Error ? error.message : String(error),
      });
    });
});

clearSessionButton?.addEventListener("click", () => {
  clearSavedSession("Saved session cleared. Enter your name to continue.");
});

void restoreSavedSession();

if (playerNameInput) {
  playerNameInput.maxLength = PLAYER_NAME_MAX_LENGTH;
  if (!playerNameInput.value) {
    playerNameInput.focus();
  }
}
