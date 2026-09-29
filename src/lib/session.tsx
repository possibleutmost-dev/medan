"use client";

/**
 * Auth session for the MeDan web client.
 *
 * The API issues its own JWT (see AuthController) — there is no Firebase here,
 * despite the backend README. The token is kept in localStorage so a refresh
 * doesn't sign the student out; that is readable by any script on the origin,
 * which is the accepted trade-off for a SPA-style client and the reason we
 * never store anything but the token and a cached profile.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ApiError, api } from "./api";
import type { AuthResponse, UserResponse } from "./types";

const TOKEN_KEY = "medan.token";
const EXPIRY_KEY = "medan.expiresAt";

interface SessionValue {
  token: string | null;
  user: UserResponse | null;
  /** True until the stored token has been read and validated on first mount. */
  loading: boolean;
  signIn: (auth: AuthResponse) => void;
  signOut: () => void;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

function readStoredToken(): string | null {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    // Drop an expired token before any request uses it, so the student sees
    // the sign-in screen rather than a string of failed calls.
    const expiresAt = localStorage.getItem(EXPIRY_KEY);
    if (expiresAt && new Date(expiresAt).getTime() < Date.now()) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(EXPIRY_KEY);
      return null;
    }
    return token;
  } catch {
    return null; // private mode / storage disabled
  }
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const signOut = useCallback(() => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(EXPIRY_KEY);
    } catch {
      /* storage unavailable — in-memory sign-out still applies */
    }
    setToken(null);
    setUser(null);
  }, []);

  const signIn = useCallback((auth: AuthResponse) => {
    try {
      localStorage.setItem(TOKEN_KEY, auth.token);
      localStorage.setItem(EXPIRY_KEY, auth.expiresAt);
    } catch {
      /* fall through: the session still works for this tab */
    }
    setToken(auth.token);
    setUser(auth.user);
  }, []);

  const loadUser = useCallback(
    async (activeToken: string) => {
      try {
        setUser(await api.me(activeToken));
      } catch (err) {
        // A rejected token is worthless — clear it. Anything else (network,
        // Render cold start) leaves the session alone so a blip doesn't sign
        // the student out.
        if (err instanceof ApiError && err.status === 401) signOut();
      }
    },
    [signOut],
  );

  // localStorage only exists in the browser, so the stored token can't be read
  // during render or in a useState initialiser without a hydration mismatch —
  // the server would render "signed out" and the client "signed in". Reading
  // after mount is the correct trade: one frame of `loading` instead.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const stored = readStoredToken();
      if (stored && !cancelled) {
        setToken(stored);
        await loadUser(stored);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadUser]);

  const refresh = useCallback(async () => {
    if (token) await loadUser(token);
  }, [token, loadUser]);

  const value = useMemo(
    () => ({ token, user, loading, signIn, signOut, refresh }),
    [token, user, loading, signIn, signOut, refresh],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}
