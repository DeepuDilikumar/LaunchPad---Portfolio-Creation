---
id: be-perf-002
guide: backend
module: performance
title: "An endpoint that was fast at launch is slow now, and nothing was deployed. Why?"
rounds: [technical-deep-dive]
seniority: ["2-4", "4-8"]
intent: "Do they think about data growth, query plans and indexes rather than code changes?"
weak_answer: "Something must have been deployed. I'd check the release history."
why_it_fails: "Data changes without deploys. Tables grow, distributions shift and the query planner picks new plans on its own."
red_note: "the data changed, not the code"
follow_ups:
  - type: technical
    question: "The query uses an index on day one and a sequential scan today. What changed?"
    what_it_tests: "How planners choose plans from table statistics and selectivity."
    strong_points:
      - "Statistics changed as the table grew, so the planner's estimates changed."
      - "A filter that was selective became common, or stale statistics mislead the planner."
      - "Use EXPLAIN ANALYZE to compare estimated and actual rows."
  - type: failure
    question: "A query is fast for most customers and slow for one large customer. Why?"
    what_it_tests: "Skewed data and plans that suit the average but not the outlier."
    strong_points:
      - "One tenant has orders of magnitude more rows."
      - "A composite index starting with the tenant ID helps, and so does pagination."
  - type: tradeoff
    question: "You can add an index. What does it cost you?"
    what_it_tests: "Write amplification, storage and lock-free index creation."
    strong_points:
      - "Every insert and update now maintains the index."
      - "Create it without blocking writes, for example CREATE INDEX CONCURRENTLY in Postgres."
  - type: measurement
    question: "How would you spot this before users complain?"
    what_it_tests: "Tracking query latency over time, not just at release."
    strong_points:
      - "Track slow-query logs and per-query latency trends weekly."
      - "Alert on p95 drift for key endpoints even without a deploy."
rejection_signals:
  - "Insists something must have been deployed."
  - "Adds an index without checking the query plan."
answer_framework:
  - "Assume the data changed: growth, skew or stale statistics."
  - "Compare the query plan with EXPLAIN ANALYZE, estimated against actual rows."
  - "Fix the access path, then watch latency trends, not just releases."
model_answer: "If nothing was deployed, the data changed. Tables grow, one customer becomes much larger than the rest, or table statistics go stale so the planner picks a worse plan. I'd find the slow query in the slow-query log, run EXPLAIN ANALYZE, and compare estimated rows with actual rows. A big gap points at statistics; a sequential scan on a large table points at a missing or unusable index. The fix might be an index created without blocking writes, a query rewrite, or pagination for the largest tenants. Then I'd add weekly trend tracking on query latency so slow drift is visible before anyone complains."
self_check:
  - "Can you explain what EXPLAIN ANALYZE shows that EXPLAIN does not?"
  - "Can you name the write cost of a new index?"
sources:
  - "https://www.postgresql.org/docs/current/using-explain.html"
  - "https://use-the-index-luke.com/"
concepts: [sql-vs-nosql, tail-latency]
reviewed: false
---
