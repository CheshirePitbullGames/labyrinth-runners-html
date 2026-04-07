export const API_HEALTH_ENDPOINT = "/health";

export const DEFAULT_CLIENT_PLAYER_NAME = "Adventurer";

export interface ApiHealthResponse {
  status: "ok";
  service: "server";
  timestamp: string;
}

export interface MatchSnapshot {
  roomId: string;
  description: string;
  playersInRoom: number;
  hazardState: "dormant" | "advancing";
}

export interface SystemMessagePayload {
  message: string;
  level: "info" | "warning" | "error";
}

export interface PlayerReadyPayload {
  playerName: string;
}

export interface PlayerPingPayload {
  at: string;
}

export interface ClientRuntimeConfig {
  apiBaseUrl: string;
  wsUrl: string;
}

export interface ServerToClientEvents {
  "match:snapshot": (payload: MatchSnapshot) => void;
  "system:message": (payload: SystemMessagePayload) => void;
}

export interface ClientToServerEvents {
  "player:ready": (payload: PlayerReadyPayload) => void;
  "player:ping": (payload: PlayerPingPayload) => void;
}

export const DEFAULT_ROOM_STATE: MatchSnapshot = {
  roomId: "room-start-001",
  description: "Starter room for the Maze Adventure Game vertical slice scaffold.",
  playersInRoom: 1,
  hazardState: "dormant",
};
