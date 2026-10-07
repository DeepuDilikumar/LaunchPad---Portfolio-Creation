"use client";

import { useSyncExternalStore } from "react";

/**
 * A non-sensitive "bp_auth=1" cookie mirrors whether a session exists, so static
 * marketing pages can swap "Start free" for "Dashboard" without a server round trip.
 * It grants nothing; the real session is checked on the server.
 */
export const SIGNED_IN_FLAG = "bp_auth";

function read() {
  return typeof document !== "undefined" && document.cookie.split("; ").includes(`${SIGNED_IN_FLAG}=1`);
}

export function useSignedIn(): boolean {
  return useSyncExternalStore(
    () => () => {},
    read,
    () => false,
  );
}
