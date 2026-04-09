import { randomUUID } from "node:crypto";

import type {
  AdminUserLoginPayload,
  SessionResponse,
  SessionUser,
} from "@maze/shared";

interface UserRecord {
  id: string;
  name: string;
  normalizedName: string;
  createdAt: string;
  lastLoginAt: string;
  loginCount: number;
}

interface SessionRecord {
  token: string;
  userId: string;
  createdAt: string;
  lastAccessedAt: string;
}

interface LoginAuditRecord extends AdminUserLoginPayload {
  id: string;
}

export interface AuthStore {
  createOrReuseSession: (name: string) => {
    session: SessionResponse;
    adminLogin: AdminUserLoginPayload;
  };
  getSession: (token: string) => SessionResponse | null;
  getLogins: () => LoginAuditRecord[];
}

const normalizeName = (value: string) => value.trim().replace(/\s+/g, " ");

const buildSessionUser = (user: UserRecord): SessionUser => ({
  id: user.id,
  name: user.name,
  createdAt: user.createdAt,
  lastLoginAt: user.lastLoginAt,
  loginCount: user.loginCount,
});

export const createAuthStore = (): AuthStore => {
  const usersByName = new Map<string, UserRecord>();
  const usersById = new Map<string, UserRecord>();
  const sessions = new Map<string, SessionRecord>();
  const loginAudit: LoginAuditRecord[] = [];

  return {
    createOrReuseSession: (rawName) => {
      const name = normalizeName(rawName);
      const normalizedName = name.toLocaleLowerCase();
      const existingUser = usersByName.get(normalizedName);
      const now = new Date().toISOString();

      const user: UserRecord = existingUser ?? {
        id: randomUUID(),
        name,
        normalizedName,
        createdAt: now,
        lastLoginAt: now,
        loginCount: 0,
      };

      const isNewUser = existingUser === undefined;
      user.name = name;
      user.lastLoginAt = now;
      user.loginCount += 1;

      usersByName.set(user.normalizedName, user);
      usersById.set(user.id, user);

      const sessionToken = randomUUID();
      sessions.set(sessionToken, {
        token: sessionToken,
        userId: user.id,
        createdAt: now,
        lastAccessedAt: now,
      });

      const adminPayload: AdminUserLoginPayload = {
        user: buildSessionUser(user),
        isNewUser,
        loginAt: now,
        activeSessions: sessions.size,
      };

      loginAudit.unshift({
        id: randomUUID(),
        ...adminPayload,
      });

      return {
        session: {
          sessionToken,
          user: adminPayload.user,
          isNewUser,
        },
        adminLogin: adminPayload,
      };
    },
    getSession: (token) => {
      const session = sessions.get(token);

      if (!session) {
        return null;
      }

      session.lastAccessedAt = new Date().toISOString();

      const user = usersById.get(session.userId);

      if (!user) {
        sessions.delete(token);
        return null;
      }

      return {
        sessionToken: session.token,
        user: buildSessionUser(user),
        isNewUser: false,
      };
    },
    getLogins: () => [...loginAudit],
  };
};
