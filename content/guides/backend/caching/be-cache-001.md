---
id: be-cache-001
guide: backend
module: caching
title: "A popular cache key expires and database load spikes for a minute. What's happening?"
rounds: [technical-deep-dive]
seniority: ["2-4", "4-8"]
intent: "Do they recognise a cache stampede and know how to prevent it?"
weak_answer: "The database needs a bigger instance."
why_it_fails: "The database is fine at normal load. The spike comes from many requests missing the cache at the same moment."
red_note: "it's the misses, not the DB"
flow:
  nodes:
    - { label: "1,000 requests" }
    - { label: "cache miss", bad: true }
    - { label: "Database" }
  note: "everyone misses at once"
follow_ups:
  - type: technical
    question: "How do you make only one request rebuild the value?"
    what_it_tests: "Request coalescing and short locks."
    strong_points:
      - "Coalesce requests in-process so one fetch serves all waiters."
      - "Across instances, a short lock with an expiry; others serve stale data or wait briefly."
  - type: tradeoff
    question: "Serve stale data while you refresh, or make users wait?"
    what_it_tests: "Freshness against latency."
    strong_points:
      - "Stale-while-revalidate keeps latency flat for data that can be slightly old."
      - "Prices or balances may not tolerate staleness."
  - type: technical
    question: "Many keys were written at the same time and all expire together. Fix it."
    what_it_tests: "Jittered expiry and early refresh."
    strong_points:
      - "Add random jitter to TTLs."
      - "Refresh early with some probability as expiry approaches."
  - type: measurement
    question: "Which metrics tell you this is a stampede?"
    what_it_tests: "Correlating hit ratio, misses per key and DB load."
    strong_points:
      - "A drop in hit ratio that lines up with the DB spike."
      - "Misses concentrated on a few hot keys."
rejection_signals:
  - "Scales the database first."
  - "Never mentions coalescing or jitter."
answer_framework:
  - "Name the stampede: many requests miss the same key at once."
  - "Let one request rebuild, and serve stale or wait for the rest."
  - "Spread expiry with jitter, and refresh hot keys early."
model_answer: "This is a cache stampede. A hot key expires and every request that arrives before it's rebuilt goes to the database at the same moment. I'd confirm it by lining up the hit-ratio drop with the database spike and checking that misses concentrate on a few keys. Then I'd make sure only one request rebuilds the value: coalesce in-process, and use a short lock across instances while others serve the stale value. For keys written together, add jitter to TTLs so they don't expire together, and refresh the hottest keys early before they expire."
self_check:
  - "Can you explain stampede, coalescing and jitter in one sentence each?"
  - "Can you name data that should not be served stale?"
sources:
  - "https://en.wikipedia.org/wiki/Cache_stampede"
  - "https://aws.amazon.com/builders-library/caching-challenges-and-strategies/"
reviewed: false
---
