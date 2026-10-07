import path from "node:path";
import { mkdirSync } from "node:fs";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "@/db/schema";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

type Holder = { db?: Promise<Db> };
const g = globalThis as unknown as { __bpDb?: Holder };
const holder: Holder = (g.__bpDb ??= {});

const MIGRATIONS = path.join(process.cwd(), "db", "migrations");

async function connect(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const postgres = (await import("postgres")).default;
    const client = postgres(url, { prepare: false, max: 5 });
    return drizzle(client, { schema }) as unknown as Db;
  }
  // Local / test: embedded Postgres (PGlite). Migrated and seeded on first use.
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const memory = process.env.DB_MEMORY === "1";
  const dir = process.env.PGLITE_DIR ?? path.join(process.cwd(), ".data", "pglite");
  if (!memory) mkdirSync(dir, { recursive: true });
  const client = memory ? new PGlite() : new PGlite(dir);
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: MIGRATIONS });
  const { seed } = await import("./seed");
  await seed(db as unknown as Db);
  return db as unknown as Db;
}

export function getDb(): Promise<Db> {
  holder.db ??= connect().catch((e) => {
    holder.db = undefined;
    throw e;
  });
  return holder.db;
}

/** Tests: drop the cached connection so the next getDb() starts fresh. */
export function resetDbForTests() {
  holder.db = undefined;
}

export { schema };
