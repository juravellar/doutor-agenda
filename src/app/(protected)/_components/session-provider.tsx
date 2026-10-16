"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
} from "react";

import type { SessionUser } from "@/lib/server-session";

const SessionUserContext = createContext<SessionUser | null>(null);

// Plan changes reach the database by Stripe webhook, after the page loaded.
// Coming back to the tab re-renders the server layout, at most once a minute.
const REFRESH_ON_FOCUS_MS = 60_000;

/**
 * Hands the session the server layout already read to client components, so
 * the browser never asks for it (no /api/auth/get-session). After a change,
 * call router.refresh(): the layout reads the session again and passes it on.
 */
export function SessionProvider({
  user,
  children,
}: {
  user: SessionUser;
  children: ReactNode;
}) {
  const router = useRouter();
  const lastRefresh = useRef(Date.now());

  useEffect(() => {
    const onVisible = () => {
      if (
        document.visibilityState === "visible" &&
        Date.now() - lastRefresh.current > REFRESH_ON_FOCUS_MS
      ) {
        lastRefresh.current = Date.now();
        router.refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [router]);

  return (
    <SessionUserContext.Provider value={user}>
      {children}
    </SessionUserContext.Provider>
  );
}

export function useSessionUser() {
  const user = useContext(SessionUserContext);
  if (!user) {
    throw new Error("useSessionUser must be used inside the protected layout");
  }
  return user;
}
