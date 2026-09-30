import "server-only"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

import { getSupabaseEnv } from "@/lib/supabase/env"
import type { Db, Match, Row, SelectOptions, TableName } from "./types"

/**
 * Server-only Supabase access with the service-role key. Every query in the app is
 * scoped to the signed-in user's id by the calling code; RLS stays on as a second line
 * of defence for any direct client access.
 */
let admin: SupabaseClient | null = null

export function supabaseAdmin(): SupabaseClient {
  if (admin) return admin
  const env = getSupabaseEnv()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!env || !key) throw new Error("Supabase service role is not configured")
  admin = createClient(env.url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  return admin
}

type SupabaseError = { message: string; code?: string } | null
type Result = { data: unknown; error: SupabaseError }

/**
 * The generic table API is untyped by design (see lib/db/types.ts), so the query builder is
 * used through this minimal structural type instead of Supabase's generated generics.
 */
type Query = PromiseLike<Result> & {
  select(columns: string): Query
  eq(column: string, value: unknown): Query
  is(column: string, value: null): Query
  order(column: string, options: { ascending: boolean }): Query
  limit(count: number): Query
  maybeSingle(): PromiseLike<Result>
  single(): PromiseLike<Result>
}
type TableRef = {
  select(columns: string): Query
  insert(row: Row): Query
  upsert(row: Row, options: { onConflict: string }): Query
  update(patch: Row): Query
  delete(): Query
}

function table(name: TableName): TableRef {
  return supabaseAdmin().from(name) as unknown as TableRef
}

function applyMatch(query: Query, match: Match): Query {
  let q = query
  for (const [column, value] of Object.entries(match)) {
    q = value === null ? q.is(column, null) : q.eq(column, value)
  }
  return q
}

function check(tableName: string, op: string, error: SupabaseError) {
  // Never include row data in errors: rows can contain resume content.
  if (error) throw new Error(`db ${op} ${tableName} failed: ${error.code ?? ""} ${error.message}`)
}

export const supabaseStore: Db = {
  async select<T extends Row>(name: TableName, match: Match, options?: SelectOptions) {
    let q = applyMatch(table(name).select("*"), match)
    if (options?.order) q = q.order(options.order.column, { ascending: options.order.ascending ?? true })
    if (options?.limit) q = q.limit(options.limit)
    const { data, error } = await q
    check(name, "select", error)
    return (data ?? []) as T[]
  },

  async selectOne<T extends Row>(name: TableName, match: Match) {
    const { data, error } = await applyMatch(table(name).select("*"), match).limit(1).maybeSingle()
    check(name, "selectOne", error)
    return (data ?? null) as T | null
  },

  async insert<T extends Row>(name: TableName, row: Partial<T>) {
    const { data, error } = await table(name).insert(row as Row).select("*").single()
    check(name, "insert", error)
    return data as T
  },

  async upsert<T extends Row>(name: TableName, row: Partial<T>, onConflict: string[]) {
    const { data, error } = await table(name)
      .upsert(row as Row, { onConflict: onConflict.join(",") })
      .select("*")
      .single()
    check(name, "upsert", error)
    return data as T
  },

  async update<T extends Row>(name: TableName, match: Match, patch: Partial<T>) {
    const { data, error } = await applyMatch(table(name).update(patch as Row), match).select("*")
    check(name, "update", error)
    return (data ?? []) as T[]
  },

  async delete(name: TableName, match: Match) {
    const { error } = await applyMatch(table(name).delete(), match)
    check(name, "delete", error)
  },
}
