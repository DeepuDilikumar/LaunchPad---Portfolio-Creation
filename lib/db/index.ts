import "server-only"

import { supabaseStoreEnabled } from "@/lib/env"
import { fileStore } from "./file-store"
import { supabaseStore } from "./supabase-store"
import type { Db } from "./types"

export type { Db, Row, Match } from "./types"

/** The active database: Supabase when fully configured, otherwise the demo file store. */
export function db(): Db {
  return supabaseStoreEnabled() ? supabaseStore : fileStore
}
