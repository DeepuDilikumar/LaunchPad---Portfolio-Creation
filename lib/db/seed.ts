import { products as productConfig } from "@/config/pricing";
import * as s from "@/db/schema";
import type { Db } from "./index";

export const DEMO_USER = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "demo@buildproof.dev",
  handle: "demo",
  name: "Demo learner",
};
export const ADMIN_USER = {
  id: "00000000-0000-4000-8000-0000000000ad",
  email: "admin@buildproof.dev",
  handle: "admin",
  name: "Admin",
};
export const SAMPLE_USER = {
  id: "00000000-0000-4000-8000-00000000005a",
  email: "sample@buildproof.dev",
  handle: "sample",
  name: "Sample learner",
};

export async function seedProducts(db: Db) {
  for (const p of Object.values(productConfig)) {
    await db
      .insert(s.products)
      .values({ kind: p.kind, slug: p.slug, priceInr: p.price.INR, priceUsd: p.price.USD })
      .onConflictDoUpdate({ target: s.products.slug, set: { priceInr: p.price.INR, priceUsd: p.price.USD } });
  }
}

/** Idempotent local seed: products, a demo learner, an admin and a clearly fictional sample profile. */
export async function seed(db: Db) {
  await seedProducts(db);
  for (const u of [DEMO_USER, ADMIN_USER, SAMPLE_USER]) {
    await db.insert(s.users).values({ id: u.id, email: u.email }).onConflictDoNothing();
  }
  await db
    .insert(s.profiles)
    .values([
      { userId: DEMO_USER.id, email: DEMO_USER.email, handle: DEMO_USER.handle, name: DEMO_USER.name, headline: "Learning in public", isPublic: true },
      { userId: ADMIN_USER.id, email: ADMIN_USER.email, handle: ADMIN_USER.handle, name: ADMIN_USER.name, role: "admin", isPublic: false, onboardedAt: new Date() },
      {
        userId: SAMPLE_USER.id,
        email: SAMPLE_USER.email,
        handle: SAMPLE_USER.handle,
        name: SAMPLE_USER.name,
        headline: "Fictional profile that shows what a proof page looks like",
        githubUsername: null,
        isPublic: true,
        onboardedAt: new Date(),
      },
    ])
    .onConflictDoNothing();

  // Sample proof page: published but never verified (no badge), with obviously illustrative numbers.
  await db
    .insert(s.decisions)
    .values({
      userId: SAMPLE_USER.id,
      project: "pulse",
      module: "spec-and-system-design",
      cellId: "decision-architecture",
      text: "The agent proposed ordering messages by created_at. I switched to a per-conversation sequence number assigned in the insert, because clock skew between gateway nodes would reorder messages.",
      isPublic: true,
      featured: true,
    })
    .onConflictDoNothing();
  await db
    .insert(s.proofPacks)
    .values({
      userId: SAMPLE_USER.id,
      project: "pulse",
      repoUrl: "https://github.com/example/pulse",
      liveUrl: "https://pulse.example.com",
      verifyToken: "sample-token",
      metrics: [
        { label: "p95 message latency", value: "84 ms (illustrative)" },
        { label: "Concurrent sockets in load test", value: "3,000 (illustrative)" },
        { label: "Tests", value: "112 (illustrative)" },
      ],
      caseStudyMd:
        "## Problem\nThis is a sample case study with fictional numbers, so you can see the format.\n\n## Approach\nA WebSocket gateway with Redis pub/sub fan-out and Postgres for history.\n\n## Key decisions\nPer-conversation sequence numbers instead of timestamps for ordering.\n\n## Results\nIllustrative only.\n\n## What I'd do next\nAdd end-to-end encryption for 1:1 chats.",
      bullets: [
        "Built a real-time messenger with WebSockets, Redis pub/sub and Postgres (sample).",
        "Replaced timestamp ordering with per-conversation sequence numbers to survive clock skew (sample).",
      ],
      publishedAt: new Date(),
    })
    .onConflictDoNothing();
}
