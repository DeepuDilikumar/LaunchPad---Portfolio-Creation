/**
 * The typed course catalog. Structure lives here; module content lives in
 * content/projects/<slug>/<nn>-<module>.mdx (frontmatter must agree with this file,
 * which `pnpm content:check` enforces).
 */
import { accents } from "@/lib/accents";

export type ProjectSlug = "foundations" | "pulse" | "ledger" | "reel" | "dispatch" | "scribe" | "atlas";

export interface CatalogModule {
  order: number;
  slug: string;
  title: string;
  summary: string;
  objectives: string[];
  /** Readable without purchase. */
  free: boolean;
}

export interface CatalogProject {
  slug: ProjectSlug;
  number: string;
  name: string;
  kind: "track" | "project";
  accent: string;
  /** Short label for the landing switcher. */
  tabLabel: string;
  title: string;
  tagline: string;
  /** Landing S4 caption: bold first sentence, rest muted. */
  caption: [string, string];
  description: string;
  hardParts: string[];
  interviewTopics: string[];
  stack: string[];
  frame: "phone" | "laptop";
  modules: CatalogModule[];
}

const projectStack = [
  "TypeScript",
  "Next.js",
  "Fastify",
  "Postgres",
  "Redis",
  "Docker",
  "GitHub Actions",
  "OpenTelemetry",
  "Sentry",
  "k6",
];

interface ProjectSpecifics {
  spec: string;
  dataModel: string;
  slice1: [string, string, string[]];
  slice2: [string, string, string[]];
  hard: [string, string, string[]];
  testing: string;
  security: string;
  observability: string;
  scale: string;
  freeUpTo?: number;
}

function templateModules(name: string, s: ProjectSpecifics): CatalogModule[] {
  const free = (order: number) => s.freeUpTo !== undefined && order <= s.freeUpTo;
  const m = (order: number, slug: string, title: string, summary: string, objectives: string[]): CatalogModule => ({
    order,
    slug,
    title,
    summary,
    objectives,
    free: free(order),
  });
  return [
    m(0, "spec-and-system-design", "Spec and system design", s.spec, [
      `Write a one-page PRD for ${name} with the agent, then cut it to what ships in v1`,
      "Draw the architecture and name every component's job in one sentence",
      "Record the first two architecture decisions as ADRs",
    ]),
    m(1, "repo-and-agent-setup", "Repo and agent setup", "Scaffold the monorepo, write CLAUDE.md and AGENTS.md, and get CI running before any feature exists.", [
      "Scaffold the repo with the agent from your spec, in plan mode first",
      "Write CLAUDE.md and AGENTS.md so both agents follow the same conventions",
      "Add a CI skeleton and a pre-commit hook that runs typecheck and tests",
    ]),
    m(2, "data-model", "Data model", s.dataModel, [
      "Design the schema and migrations with constraints that protect correctness",
      "Seed realistic data and write tests that prove the constraints hold",
      "Decide what the database guarantees and what the application must",
    ]),
    m(3, s.slice1[0], s.slice1[1], s.slice1[2][0] ?? "", s.slice1[2].slice(1)),
    m(4, s.slice2[0], s.slice2[1], s.slice2[2][0] ?? "", s.slice2[2].slice(1)),
    m(5, s.hard[0], s.hard[1], s.hard[2][0] ?? "", s.hard[2].slice(1)),
    m(6, "testing", "Testing", s.testing, [
      "Fill the gaps between unit, integration and end-to-end tests",
      "Add property-based tests where invariants matter",
      "Make the suite fast enough that you run it on every change",
    ]),
    m(7, "security", "Security", s.security, [
      "Review authentication and authorization paths with the agent as an attacker",
      "Add rate limits, input validation and secret handling",
      "Run an OWASP Top 10 pass and fix what you find",
    ]),
    m(8, "observability", "Observability", s.observability, [
      "Add structured logs, metrics and traces with OpenTelemetry",
      "Wire up error tracking and one dashboard you would actually look at",
      "Write the alert you'd want at 3am, and the runbook for it",
    ]),
    m(9, "deploy-and-scale", "Deploy and scale", s.scale, [
      "Containerize and deploy with CI/CD",
      "Load test with k6, find the bottleneck, fix it, and re-measure",
      "Write down the numbers: before, after and why",
    ]),
    m(10, "proof-pack", "Proof pack", `Turn ${name} into a case study, resume bullets, a demo script and answers you can defend in an interview.`, [
      "Draft a case study from your build journal and measured numbers",
      "Write resume bullets that only use numbers you measured",
      "Rehearse interview defense drills on your own design decisions",
    ]),
  ];
}

export const catalog: CatalogProject[] = [
  {
    slug: "foundations",
    number: "00",
    name: "Foundations",
    kind: "track",
    accent: accents.foundations,
    tabLabel: "Foundations",
    title: "Agent-native engineering basics",
    tagline: "Your first checkpoint in about ten minutes.",
    caption: [
      "Foundations, free.",
      "Set up Claude Code and Codex, learn the spec → plan → build → verify loop, use tests as guardrails, and ship a rate-limited URL shortener with CI and a live deploy.",
    ],
    description:
      "Five short modules that teach the loop every project uses: write a spec, plan before you build, let tests guard the agent, keep context focused, and ship. Ends with a small deployed app.",
    hardParts: ["Reviewing an agent's plan", "Failing tests first", "Reading diffs", "Context and cost", "A real deploy"],
    interviewTopics: ["How you work with AI agents", "Testing strategy", "Rate limiting"],
    stack: ["Claude Code", "Codex", "TypeScript", "Vitest", "GitHub Actions"],
    frame: "laptop",
    modules: [
      {
        order: 1,
        slug: "setup-agents",
        title: "Set up your agents",
        summary: "Install Claude Code and Codex, see how agents read your repo, and write your first CLAUDE.md and AGENTS.md.",
        objectives: [
          "Install and sign in to Claude Code or Codex",
          "Understand what an agent reads when it opens your repo",
          "Write a CLAUDE.md and AGENTS.md and pass your first checkpoint",
        ],
        free: true,
      },
      {
        order: 2,
        slug: "the-loop",
        title: "Plan before you build",
        summary: "Write a spec, have the agent plan in plan mode, review the plan like a tech lead, then build.",
        objectives: ["Write a short spec the agent can follow", "Use plan mode and review the plan before any code is written", "Recognise a bad plan and redirect it"],
        free: true,
      },
      {
        order: 3,
        slug: "tests-as-guardrails",
        title: "Tests as guardrails",
        summary: "Ask for failing tests first, read the diff, and know when to take the wheel.",
        objectives: ["Ask the agent for failing tests before the implementation", "Read a diff for intent, not just syntax", "Know the signals that mean you should take over"],
        free: true,
      },
      {
        order: 4,
        slug: "context-and-cost",
        title: "Context and cost",
        summary: "Keep sessions focused, and use skills, subagents and hooks for the checks that must always run.",
        objectives: ["Keep sessions small and focused", "Use subagents for exploration and review", "Add a hook that runs checks deterministically"],
        free: true,
      },
      {
        order: 5,
        slug: "mini-build-url-shortener",
        title: "Mini-build: a URL shortener",
        summary: "Build a URL shortener with a rate limiter, tests and CI, and deploy it live.",
        objectives: ["Spec, plan and build a small service end to end", "Add a token-bucket rate limiter with tests", "Ship it with CI and a live URL"],
        free: true,
      },
    ],
  },
  {
    slug: "pulse",
    number: "01",
    name: "Pulse",
    kind: "project",
    accent: accents.pulse,
    tabLabel: "Messenger",
    title: "Real-time messenger",
    tagline: "1:1 and group chat that holds up under load.",
    caption: [
      "Pulse, a real-time messenger.",
      "WebSockets, presence, typing indicators, read receipts, offline sync, and media uploads, load-tested with thousands of concurrent connections.",
    ],
    description:
      "Build the kind of system behind modern chat apps: a WebSocket gateway, presence and typing, delivery and read receipts, ordered messages with idempotent client IDs, offline sync, media via presigned uploads, push, and Redis pub/sub fan-out.",
    hardParts: [
      "WebSocket gateway",
      "Presence and typing",
      "Delivery and read receipts",
      "Message ordering with idempotent client IDs",
      "Offline sync",
      "Presigned media uploads",
      "Redis pub/sub fan-out",
      "Load testing thousands of sockets",
    ],
    interviewTopics: ["Chat system design", "Fan-out strategies", "Consistency vs latency"],
    stack: [...projectStack, "WebSockets"],
    frame: "phone",
    modules: templateModules("Pulse", {
      freeUpTo: 2,
      spec: "Write the PRD and architecture for a real-time messenger with the agent, and decide what v1 does not do.",
      dataModel: "Model users, conversations, members and messages so ordering and idempotency are enforced by the database.",
      slice1: ["delivery-receipts", "Delivery receipts", ["Send, deliver and read: three states for every message, in 1:1 and group chats.", "Implement sent, delivered and read states", "Use client message IDs so retries never duplicate", "Choose between per-message receipts and per-conversation read cursors"]],
      slice2: ["presence-at-scale", "Presence at scale", ["Online status and typing indicators that stay accurate without flooding the server.", "Track presence with heartbeats and expiry", "Throttle typing events and fan them out efficiently", "Handle reconnects without false offline flickers"]],
      hard: ["fan-out", "Fan-out with Redis pub/sub", ["Scale the WebSocket gateway horizontally and fan messages out across nodes.", "Run multiple gateway nodes behind a load balancer", "Fan out with Redis pub/sub and measure the cost", "Load test thousands of concurrent sockets and find the limit"]],
      testing: "Test ordering, idempotency and reconnects, including the races that only show up under concurrency.",
      security: "Authenticate sockets, authorize every conversation access, and rate-limit messages.",
      observability: "Measure connection counts, message latency and fan-out lag, and trace a message end to end.",
      scale: "Deploy the gateway, load test with k6, find what breaks first, and fix it.",
    }),
  },
  {
    slug: "ledger",
    number: "02",
    name: "Ledger",
    kind: "project",
    accent: accents.ledger,
    tabLabel: "Payments",
    title: "Payments and wallet API",
    tagline: "Money that is never created or lost.",
    caption: [
      "Ledger, a payments and wallet API.",
      "Double-entry accounting, idempotency keys, signed webhooks with retries, an outbox, reconciliation, refunds, and a dashboard to watch it all.",
    ],
    description:
      "Build the kind of system behind payment platforms: a double-entry ledger, idempotency keys, webhook delivery with signatures and retries, the outbox pattern, a reconciliation job, refunds, concurrency control and an audit log.",
    hardParts: ["Double-entry ledger", "Idempotency keys", "Signed webhooks with retries", "Outbox pattern", "Reconciliation", "Refunds", "Concurrency control", "Audit log"],
    interviewTopics: ["Payment system design", "Exactly-once myths", "Money correctness"],
    stack: projectStack,
    frame: "laptop",
    modules: templateModules("Ledger", {
      spec: "Specify a wallet and payments API where every balance can be explained by its entries.",
      dataModel: "Model accounts, transactions and entries so the books always balance, enforced in the database.",
      slice1: ["transfers-and-idempotency", "Transfers and idempotency", ["Move money between wallets safely, even when clients retry.", "Implement transfers as balanced double-entry transactions", "Add idempotency keys with stored responses", "Prevent double spends under concurrency"]],
      slice2: ["webhooks-and-outbox", "Webhooks and the outbox", ["Tell other systems what happened, reliably.", "Publish events through a transactional outbox", "Deliver signed webhooks with retries and backoff", "Let receivers verify and deduplicate"]],
      hard: ["reconciliation", "Reconciliation and refunds", ["Prove your books match the provider's, and undo money movements correctly.", "Write a reconciliation job that finds and explains mismatches", "Implement partial and full refunds as new entries", "Keep an append-only audit log"]],
      testing: "Property-test the ledger: no sequence of operations may create or destroy money.",
      security: "Protect money movement: authorization, signature checks, rate limits and secrets.",
      observability: "Track money flows, webhook delivery health and reconciliation drift.",
      scale: "Deploy, load test concurrent transfers, find the lock contention, and fix it.",
    }),
  },
  {
    slug: "reel",
    number: "03",
    name: "Reel",
    kind: "project",
    accent: accents.reel,
    tabLabel: "Short video",
    title: "Short-video platform",
    tagline: "Upload, transcode, stream, scroll.",
    caption: [
      "Reel, a short-video platform.",
      "Resumable uploads, an ffmpeg transcoding queue, HLS adaptive streaming behind a CDN, thumbnails, and a cursor-paginated feed with batched view counts.",
    ],
    description:
      "Build the kind of system behind short-video apps: resumable uploads, a transcoding queue with ffmpeg workers, HLS adaptive streaming, a CDN, thumbnails, a cursor-paginated feed and batched view counters.",
    hardParts: ["Resumable uploads", "Transcoding queue with ffmpeg workers", "HLS adaptive streaming", "CDN", "Thumbnails", "Cursor-paginated feed", "Batched view counters"],
    interviewTopics: ["Video pipeline design", "Queues", "Caching and CDNs"],
    stack: [...projectStack, "ffmpeg", "Cloudflare R2"],
    frame: "phone",
    modules: templateModules("Reel", {
      spec: "Specify a short-video app from upload to feed, and size the storage and bandwidth honestly.",
      dataModel: "Model videos, renditions, jobs and views so the pipeline's state is always visible.",
      slice1: ["resumable-uploads", "Resumable uploads", ["Uploads that survive flaky mobile networks.", "Implement multipart, resumable uploads to object storage", "Use presigned URLs so files never pass through your API", "Track upload state and clean up abandoned parts"]],
      slice2: ["feed", "The feed", ["A fast, cursor-paginated feed with view counts that don't melt the database.", "Build cursor pagination that stays stable as new videos arrive", "Batch view counters through Redis", "Cache feed pages and invalidate them correctly"]],
      hard: ["transcoding-pipeline", "Transcoding and HLS", ["Turn uploads into adaptive streams with a queue of ffmpeg workers.", "Run a job queue with ffmpeg workers and retries", "Produce HLS renditions and thumbnails", "Serve through a CDN and measure start-up time"]],
      testing: "Test the pipeline with real media fixtures, and the failure paths workers will hit.",
      security: "Validate uploads, sign URLs, limit abuse and keep storage private by default.",
      observability: "Measure queue depth, transcode time and playback start-up.",
      scale: "Deploy workers, load test the feed, find the bottleneck, and fix it.",
    }),
  },
  {
    slug: "dispatch",
    number: "04",
    name: "Dispatch",
    kind: "project",
    accent: accents.dispatch,
    tabLabel: "Ride-hailing",
    title: "Ride-hailing and delivery",
    tagline: "Match riders and drivers in real time.",
    caption: [
      "Dispatch, a ride-hailing and delivery app.",
      "Live location streaming, geospatial indexing, driver matching, a trip state machine, ETAs, basic surge pricing, and a live map.",
    ],
    description:
      "Build the kind of system behind ride-hailing apps: live location streaming, geospatial indexing with PostGIS or H3, matching, a trip state machine, ETAs, surge basics and a map UI with MapLibre and OpenStreetMap.",
    hardParts: ["Live location streaming", "Geospatial indexing (PostGIS or H3)", "Matching", "Trip state machine", "ETAs", "Surge basics", "Map UI (MapLibre + OSM)"],
    interviewTopics: ["Geo systems", "State machines", "Real-time matching"],
    stack: [...projectStack, "PostGIS", "H3", "MapLibre"],
    frame: "phone",
    modules: templateModules("Dispatch", {
      spec: "Specify a ride-hailing flow from request to drop-off, and decide what 'nearby' means.",
      dataModel: "Model riders, drivers, locations and trips with a state machine the database can enforce.",
      slice1: ["live-locations", "Live locations", ["Stream driver locations and show them on a map.", "Stream locations over WebSockets with sensible update rates", "Store the latest position efficiently", "Render a live map with MapLibre and OpenStreetMap"]],
      slice2: ["trip-state-machine", "The trip state machine", ["Requested, accepted, arriving, on trip, completed: no illegal jumps.", "Model trip states and legal transitions explicitly", "Handle cancellations and timeouts", "Make transitions idempotent"]],
      hard: ["matching", "Geospatial matching", ["Find the right driver within 2 km in milliseconds.", "Index locations with PostGIS or H3", "Match riders to drivers without double-assigning", "Estimate ETAs and add basic surge"]],
      testing: "Test the state machine exhaustively and simulate a city of drivers.",
      security: "Protect locations, authorize trip actions and rate-limit requests.",
      observability: "Track match latency, location lag and trip funnel drop-off.",
      scale: "Deploy, simulate thousands of drivers with k6, find the bottleneck, and fix it.",
    }),
  },
  {
    slug: "scribe",
    number: "05",
    name: "Scribe",
    kind: "project",
    accent: accents.scribe,
    tabLabel: "Collaborative docs",
    title: "Collaborative docs editor",
    tagline: "Many cursors, one document.",
    caption: [
      "Scribe, a collaborative docs editor.",
      "CRDTs with Yjs, live cursors, sharing and permissions, version history, comments, and offline-first editing that merges cleanly.",
    ],
    description:
      "Build the kind of system behind collaborative editors: CRDTs with Yjs, live cursors, sharing and permissions, version history, comments and offline-first editing.",
    hardParts: ["CRDTs (Yjs)", "Live cursors", "Sharing and permissions", "Version history", "Comments", "Offline-first"],
    interviewTopics: ["Real-time collaboration", "CRDT vs OT", "Permission models"],
    stack: [...projectStack, "Yjs"],
    frame: "laptop",
    modules: templateModules("Scribe", {
      spec: "Specify a collaborative editor and decide how conflicts, permissions and history should behave.",
      dataModel: "Model documents, updates, snapshots and permissions so history is never lost.",
      slice1: ["live-editing", "Live editing and cursors", ["Two people, one document, no lost keystrokes.", "Sync a Yjs document over WebSockets", "Show live cursors and selections", "Persist updates and snapshots"]],
      slice2: ["sharing-and-permissions", "Sharing and permissions", ["Owners, editors, commenters and viewers, enforced on the server.", "Design a permission model with link sharing", "Enforce permissions on every sync message", "Add comments anchored to text"]],
      hard: ["offline-and-history", "Offline-first and version history", ["Edit on a plane, merge on landing, and travel back in time.", "Make editing work offline and merge on reconnect", "Build version history from snapshots", "Explain CRDT vs OT trade-offs with your own numbers"]],
      testing: "Fuzz concurrent edits and prove every replica converges.",
      security: "Authorize every document operation and protect shared links.",
      observability: "Measure sync latency, document size growth and reconnect storms.",
      scale: "Deploy the sync server, load test many editors per document, and fix the bottleneck.",
    }),
  },
  {
    slug: "atlas",
    number: "06",
    name: "Atlas",
    kind: "project",
    accent: accents.atlas,
    tabLabel: "AI answer engine",
    title: "AI answer engine with sources",
    tagline: "Answers you can check.",
    caption: [
      "Atlas, an AI answer engine with sources.",
      "Ingestion, embeddings with pgvector, hybrid search, streaming answers with citations, tool use, an eval harness, and cost and latency budgets.",
    ],
    description:
      "Build the kind of system behind AI answer engines: ingestion, embeddings with pgvector, hybrid search, streaming answers with citations, tool use, an eval harness, cost and latency budgets, guardrails and caching.",
    hardParts: ["Ingestion", "Embeddings (pgvector)", "Hybrid search", "Streaming answers with citations", "Tool use", "Eval harness", "Cost and latency budgets", "Guardrails", "Caching"],
    interviewTopics: ["LLM system design", "RAG", "Evals", "AI product trade-offs"],
    stack: [...projectStack, "pgvector", "Anthropic API"],
    frame: "laptop",
    modules: templateModules("Atlas", {
      spec: "Specify an answer engine with sources, and set cost and latency budgets before writing code.",
      dataModel: "Model documents, chunks, embeddings and answers so every claim traces to a source.",
      slice1: ["ingestion-and-search", "Ingestion and hybrid search", ["Turn documents into something you can search well.", "Ingest, chunk and embed documents into pgvector", "Combine keyword and vector search", "Measure retrieval quality on a small labelled set"]],
      slice2: ["streaming-answers", "Streaming answers with citations", ["Stream an answer where every claim links to its source.", "Stream answers from the model with citations", "Add tool use for fresh data", "Show sources the user can check"]],
      hard: ["evals", "Evals, budgets and guardrails", ["Know whether a change made answers better, and what it cost.", "Build an eval harness and track a score over time", "Enforce cost and latency budgets with caching", "Add guardrails for unsupported or unsafe questions"]],
      testing: "Test retrieval, prompts and streaming, and keep evals in CI.",
      security: "Defend against prompt injection, protect keys and rate-limit expensive calls.",
      observability: "Trace every answer: retrieval, tokens, latency and cost.",
      scale: "Deploy, load test concurrent questions, find the bottleneck, and fix it.",
    }),
  },
];

export function getProject(slug: string): CatalogProject | undefined {
  return catalog.find((p) => p.slug === slug);
}

export function getCatalogModule(project: string, module: string): CatalogModule | undefined {
  return getProject(project)?.modules.find((m) => m.slug === module);
}

export const projects = catalog.filter((p) => p.kind === "project");

export function moduleFileName(m: CatalogModule): string {
  return `${String(m.order).padStart(2, "0")}-${m.slug}.mdx`;
}

export function moduleLabel(project: CatalogProject, m: CatalogModule): string {
  return project.kind === "track" ? `Module ${m.order}` : `Module ${m.order}`;
}
