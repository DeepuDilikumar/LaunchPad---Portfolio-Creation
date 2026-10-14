import { MemoryStore } from "./memory";
import { SupabaseStore } from "./supabase";
import type { Store } from "./types";

export type * from "./types";

const g = globalThis as unknown as { __sqStore?: Store };

/** Supabase when configured; otherwise an in-memory store for development and tests. */
export function getStore(): Store {
  if (g.__sqStore) return g.__sqStore;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    g.__sqStore = new SupabaseStore(url, key);
  } else {
    if (process.env.NODE_ENV === "production" && process.env.ALLOW_MEMORY_STORE !== "1") {
      throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in production");
    }
    g.__sqStore = new MemoryStore();
  }
  return g.__sqStore;
}

/** Tests swap in a fresh store. */
export function setStore(store: Store | undefined): void {
  g.__sqStore = store;
}
