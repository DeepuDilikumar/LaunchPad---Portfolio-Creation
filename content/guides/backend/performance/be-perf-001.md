---
id: be-perf-001
guide: backend
module: performance
title: "p99 latency doubled after a deploy, but the average looks fine. Where do you look?"
rounds: [technical-deep-dive, production-experience]
seniority: ["2-4", "4-8"]
intent: "Can they read latency distributions and tie a tail regression to one change?"
weak_answer: "The average is fine, so it's probably noise."
why_it_fails: "Averages hide tails. One in a hundred requests getting slower barely moves the mean but hurts real users on every page that makes many calls."
red_note: "averages hide tails"
flow:
  nodes:
    - { label: "Load balancer" }
    - { label: "Service v2.4", bad: true }
    - { label: "Postgres" }
  note: "p99: 180 ms → 410 ms"
follow_ups:
  - type: failure
    question: "Only some users feel it. Which ones, and why?"
    what_it_tests: "Slicing the tail by endpoint, tenant, instance and payload size."
    strong_points:
      - "Break p99 down by endpoint, instance, version and customer."
      - "Large accounts or large payloads often own the tail."
      - "Check whether one instance or zone is the outlier."
  - type: tradeoff
    question: "Roll back now, or fix forward?"
    what_it_tests: "Putting user impact ahead of pride, and knowing when rollback is unsafe."
    strong_points:
      - "Roll back if users are hurting and the deploy is reversible."
      - "Fix forward only when rollback is risky, for example after a schema change."
  - type: technical
    question: "The new code added one query per item in a list. Why does that hit p99 harder than the average?"
    what_it_tests: "Understanding N+1 queries and how cost scales with input size."
    strong_points:
      - "Cost grows with list length, so big lists form the tail."
      - "Batch the lookups or join them in one query."
  - type: measurement
    question: "Which metric proves the fix worked?"
    what_it_tests: "Choosing a percentile and a guard for future deploys."
    strong_points:
      - "p99 and p99.9 per endpoint, compared with the previous version."
      - "A canary that compares tail latency before promoting a deploy."
  - type: ownership
    question: "What did you change in the release process afterwards?"
    what_it_tests: "Turning one incident into a durable guardrail."
    strong_points:
      - "Canary analysis on tail latency, not just error rate."
      - "A load test with production-sized payloads in CI or staging."
rejection_signals:
  - "Looks only at the average."
  - "Starts tuning before finding the change that caused it."
  - "Never mentions rolling back."
answer_framework:
  - "Break p99 down by endpoint, version and instance before guessing."
  - "Find the one change behind it: a new query, a lock, a GC pause, a cold cache."
  - "Roll back if users are hurting, then ship the fix with a guard metric."
model_answer: "First I'd confirm it lines up with the deploy by comparing p99 for the old and new version side by side. Then I'd slice the tail: which endpoints, which instances, which customers. Usually it narrows to one endpoint and a class of large requests. From there I diff the release for things that scale with input size, like a new per-item query, a lock taken on a hot row, or bigger allocations causing GC pauses. If users are hurting and the deploy is reversible, I roll back first and investigate on the old build. The fix ships behind a canary that compares tail latency, so the next regression is caught before it reaches everyone."
self_check:
  - "Can you explain why the mean barely moved?"
  - "Can you name three dimensions to slice p99 by?"
sources:
  - "https://sre.google/sre-book/monitoring-distributed-systems/"
  - "https://www.brendangregg.com/usemethod.html"
reviewed: false
---
