---
id: be-cache-002
guide: backend
module: caching
title: "You updated a price, but some users see the old one far longer than the cache TTL. How?"
rounds: [technical-deep-dive]
seniority: ["2-4", "4-8"]
intent: "Can they find every cache layer and the race that writes stale data back?"
weak_answer: "Lower the TTL."
why_it_fails: "If data outlives the TTL, the TTL isn't the layer serving it, or something keeps writing the old value back."
red_note: "which cache is it?"
follow_ups:
  - type: failure
    question: "A reader missed the cache, read the old price, and wrote it back after your update. Walk me through the timing."
    what_it_tests: "The cache-aside race between a slow reader and a writer."
    strong_points:
      - "Reader misses, reads the old value from the database."
      - "Writer updates the database and deletes the key."
      - "Reader then writes the old value into the cache, where it lives for a full TTL."
  - type: technical
    question: "Name every place this price might be cached."
    what_it_tests: "Seeing layers beyond Redis."
    strong_points:
      - "Browser and app caches, the CDN, in-process caches, Redis, and read replicas that lag."
      - "Sliding expiry on any layer can keep a value alive forever."
  - type: tradeoff
    question: "Delete the key on write, or update it in place?"
    what_it_tests: "Invalidation strategies and their races."
    strong_points:
      - "Delete is simpler but has the stale write-back race."
      - "Versioned keys or a delayed second delete narrow the window."
  - type: measurement
    question: "How would you know how stale users' data really is?"
    what_it_tests: "Measuring staleness rather than guessing."
    strong_points:
      - "Store a version or updated-at timestamp with the cached value and compare on read in a sample."
rejection_signals:
  - "Only knows about one cache layer."
  - "Thinks lowering the TTL fixes a write-back race."
answer_framework:
  - "List every cache layer, from browser to replica."
  - "Look for a race that writes the old value back after the update."
  - "Version the data so stale writes lose."
model_answer: "If users see old data well past the TTL, either another layer is serving it or the old value keeps getting written back. I'd list the layers first: app or browser caches, the CDN, in-process caches, Redis, and replicas that lag behind the primary. Then I'd check the cache-aside race: a reader misses, reads the old price, the writer updates and deletes the key, and the reader writes the old price back for a full TTL. A version number on the cached value, so writes with an older version are rejected, closes that race. For prices I'd also purge the CDN on change and avoid sliding expiry."
self_check:
  - "Can you draw the four-step stale write-back race?"
  - "Can you name a cache layer outside your servers?"
sources:
  - "https://aws.amazon.com/builders-library/caching-challenges-and-strategies/"
  - "https://redis.io/docs/latest/develop/clients/client-side-caching/"
reviewed: false
---
