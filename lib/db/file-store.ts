import "server-only"

import { randomUUID } from "node:crypto"
import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import path from "node:path"

import { TABLES, TABLES_WITH_ID, type Db, type Match, type Row, type SelectOptions, type TableName } from "./types"

/**
 * Demo-mode database: one JSON file under .data/ (git-ignored).
 * Writes are serialised in-process and written atomically. Not for production use.
 */
const DATA_DIR = process.env.LAUNCHPAD_DATA_DIR ?? path.join(process.cwd(), ".data")
const DB_FILE = path.join(DATA_DIR, "launchpad-demo.json")

type Store = Record<TableName, Row[]>

/**
 * Shared on globalThis: Next.js can load this module more than once per process (route
 * handlers and pages are bundled separately), and every copy must see the same data.
 */
const shared = globalThis as unknown as { __launchpadFileStore?: { cache: Store | null; queue: Promise<unknown> } }
const state = (shared.__launchpadFileStore ??= { cache: null, queue: Promise.resolve() })

function emptyStore(): Store {
  return Object.fromEntries(TABLES.map((t) => [t, []])) as unknown as Store
}

async function load(): Promise<Store> {
  if (state.cache) return state.cache
  try {
    const parsed = JSON.parse(await readFile(DB_FILE, "utf8")) as Partial<Store>
    state.cache = { ...emptyStore(), ...parsed }
  } catch {
    state.cache = emptyStore()
  }
  return state.cache
}

async function persist(store: Store) {
  await mkdir(DATA_DIR, { recursive: true })
  const tmp = `${DB_FILE}.${process.pid}.tmp`
  await writeFile(tmp, JSON.stringify(store))
  await rename(tmp, DB_FILE)
}

/** Runs mutations one at a time so concurrent requests can't clobber each other. */
function exclusive<T>(fn: (store: Store) => Promise<T> | T): Promise<T> {
  const run = state.queue.then(async () => {
    const store = await load()
    const result = await fn(store)
    await persist(store)
    return result
  })
  state.queue = run.catch(() => undefined)
  return run
}

function matches(row: Row, match: Match) {
  return Object.entries(match).every(([k, v]) => (row[k] ?? null) === v)
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

function stamp(table: TableName, row: Row, isNew: boolean): Row {
  const now = new Date().toISOString()
  const out = { ...row }
  if (isNew && TABLES_WITH_ID.includes(table) && !out.id) out.id = randomUUID()
  if (isNew && !out.created_at) out.created_at = now
  out.updated_at = now
  return out
}

export const fileStore: Db = {
  async select<T extends Row>(table: TableName, match: Match, options?: SelectOptions) {
    const store = await load()
    let rows = store[table].filter((r) => matches(r, match))
    if (options?.order) {
      const { column, ascending = true } = options.order
      rows = [...rows].sort((a, b) => {
        const av = a[column] as string | number
        const bv = b[column] as string | number
        if (av === bv) return 0
        return (av > bv ? 1 : -1) * (ascending ? 1 : -1)
      })
    }
    if (options?.limit) rows = rows.slice(0, options.limit)
    return clone(rows) as T[]
  },

  async selectOne<T extends Row>(table: TableName, match: Match) {
    const store = await load()
    const row = store[table].find((r) => matches(r, match))
    return row ? (clone(row) as T) : null
  },

  insert<T extends Row>(table: TableName, row: Partial<T>) {
    return exclusive((store) => {
      const created = stamp(table, row as Row, true)
      store[table].push(created)
      return clone(created) as T
    })
  },

  upsert<T extends Row>(table: TableName, row: Partial<T>, onConflict: string[]) {
    return exclusive((store) => {
      const key = Object.fromEntries(onConflict.map((c) => [c, (row as Row)[c] ?? null])) as Match
      const index = store[table].findIndex((r) => matches(r, key))
      if (index === -1) {
        const created = stamp(table, row as Row, true)
        store[table].push(created)
        return clone(created) as T
      }
      const merged = stamp(table, { ...store[table][index], ...(row as Row) }, false)
      store[table][index] = merged
      return clone(merged) as T
    })
  },

  update<T extends Row>(table: TableName, match: Match, patch: Partial<T>) {
    return exclusive((store) => {
      const updated: Row[] = []
      store[table] = store[table].map((r) => {
        if (!matches(r, match)) return r
        const next = stamp(table, { ...r, ...(patch as Row) }, false)
        updated.push(next)
        return next
      })
      return clone(updated) as T[]
    })
  },

  delete(table: TableName, match: Match) {
    return exclusive((store) => {
      store[table] = store[table].filter((r) => !matches(r, match))
    })
  },
}

export function demoUploadsDir() {
  return path.join(DATA_DIR, "uploads")
}
