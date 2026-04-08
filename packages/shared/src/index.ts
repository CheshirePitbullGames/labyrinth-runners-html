export const API_HEALTH_ENDPOINT = "/health";
export const API_SESSION_ENDPOINT = "/api/session";

export const PLAYER_NAME_MAX_LENGTH = 32;

export interface ApiHealthResponse {
  status: "ok";
  service: "server";
  timestamp: string;
}

export interface ApiErrorResponse {
  error: string;
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

export interface SessionUser {
  id: string;
  name: string;
  createdAt: string;
  lastLoginAt: string;
  loginCount: number;
}

export interface CreateSessionRequest {
  name: string;
}

export interface SessionResponse {
  sessionToken: string;
  user: SessionUser;
  isNewUser: boolean;
}

export interface AdminUserLoginPayload {
  user: SessionUser;
  isNewUser: boolean;
  loginAt: string;
  activeSessions: number;
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
  "admin:user:login": (payload: AdminUserLoginPayload) => void;
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
