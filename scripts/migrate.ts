/** Apply migrations. PGlite locally (also seeds), Postgres when DATABASE_URL is set. */
import path from "node:path";

async function main() {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const { migrate } = await import("drizzle-orm/postgres-js/migrator");
    const postgres = (await import("postgres")).default;
    const client = postgres(url, { max: 1, prepare: false });
    await migrate(drizzle(client), { migrationsFolder: path.join(process.cwd(), "db", "migrations") });
    await client.end();
    console.log("migrated (postgres)");
  } else {
    const { getDb } = await import("../lib/db/index");
    await getDb();
    console.log("migrated + seeded (pglite at .data/pglite)");
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
