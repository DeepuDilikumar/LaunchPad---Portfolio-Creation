/** Seed products (and demo data in local mode). Safe to re-run. */
async function main() {
  const { getDb } = await import("../lib/db/index");
  const { seedProducts } = await import("../lib/db/seed");
  const db = await getDb();
  await seedProducts(db);
  console.log("seeded products");
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
