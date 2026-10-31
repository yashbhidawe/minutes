"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import type { ReactNode } from "react";
import { api, User } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);
const AUTH_CHANGE_MESSAGE = "MINUTE_AI_AUTH_CHANGE";
const EMPTY_AUTH_SNAPSHOT = "";

type StoredAuth = {
  token: string | null;
  user: User | null;
};

function isTokenExpired(token: string): boolean {
  try {
    // JWTs are base64url; atob() only understands the standard alphabet.
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

function getAuthSnapshot(): string {
  if (typeof window === "undefined") return EMPTY_AUTH_SNAPSHOT;
  return JSON.stringify([localStorage.getItem("token"), localStorage.getItem("user")]);
}

function getServerAuthSnapshot(): string {
  return EMPTY_AUTH_SNAPSHOT;
}

function subscribeToAuth(callback: () => void): () => void {
  const handleMessage = (event: MessageEvent<{ type?: string }>) => {
    if (event.data?.type === AUTH_CHANGE_MESSAGE) callback();
  };

  window.addEventListener("storage", callback);
  window.addEventListener("message", handleMessage);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("message", handleMessage);
  };
}

function getHydratedClientSnapshot(): boolean {
  return true;
}

function getHydratedServerSnapshot(): boolean {
  return false;
}

function subscribeToHydration(): () => void {
  return () => {};
}

function parseAuthSnapshot(snapshot: string): StoredAuth {
  if (!snapshot) return { token: null, user: null };

  try {
    const [savedToken, savedUser] = JSON.parse(snapshot) as [unknown, unknown];
    if (typeof savedToken !== "string" || typeof savedUser !== "string") {
      return { token: null, user: null };
    }

    const user = JSON.parse(savedUser) as User | null;
    return { token: savedToken, user };
  } catch {
    return { token: null, user: null };
  }
}

function broadcastAuthChange(token: string | null, user: User | null) {
  if (typeof window !== "undefined") {
    window.postMessage(
      {
        type: AUTH_CHANGE_MESSAGE,
        token,
        user,
      },
      "*"
    );
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const authSnapshot = useSyncExternalStore(
    subscribeToAuth,
    getAuthSnapshot,
    getServerAuthSnapshot
  );
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydratedClientSnapshot,
    getHydratedServerSnapshot
  );
  const storedAuth = useMemo(() => parseAuthSnapshot(authSnapshot), [authSnapshot]);
  const token = storedAuth.token && !isTokenExpired(storedAuth.token) ? storedAuth.token : null;
  const user = token ? storedAuth.user : null;
  const isLoading = !isHydrated;

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    broadcastAuthChange(null, null);
  }, []);

  useEffect(() => {
    if (storedAuth.token && !token) {
      logout();
    }
  }, [logout, storedAuth.token, token]);

  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      if (isTokenExpired(token)) {
        logout();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [token, logout]);

  const login = async (email: string, password: string) => {
    const res = await api.auth.login(email, password);
    localStorage.setItem("token", res.access_token);
    localStorage.setItem("user", JSON.stringify(res.user));
    broadcastAuthChange(res.access_token, res.user);
  };

  const register = async (email: string, password: string) => {
    await api.auth.register(email, password);
    await login(email, password);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
