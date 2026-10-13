---
id: be-db-002
guide: backend
module: databases-and-transactions
title: "A migration locked the orders table at peak traffic. What went wrong?"
rounds: [technical-deep-dive, production-experience]
seniority: ["2-4", "4-8"]
intent: "How schema changes take locks, and how to roll them out safely."
weak_answer: "Run migrations at night."
why_it_fails: "A quiet hour hides the lock, it doesn't remove it. Large tables can lock for longer than the quiet window, and global users have no quiet hour."
red_note: "hides it, doesn't fix it"
flow:
  nodes:
    - { label: "Migration" }
    - { label: "orders table", bad: true }
    - { label: "Checkout API" }
  note: "table lock held for 4 minutes"
follow_ups:
  - type: failure
    question: "Which statements take a lock on the whole table?"
    what_it_tests: "Knowing which DDL rewrites or blocks a table."
    strong_points:
      - "Changing a column type usually rewrites the table under an exclusive lock."
      - "Creating an index without CONCURRENTLY blocks writes."
      - "Even a quick ALTER waits behind long transactions, and everything queues behind it."
  - type: tradeoff
    question: "Add the column with a default, or backfill later?"
    what_it_tests: "Expand and contract migrations."
    strong_points:
      - "Add a nullable column, backfill in small batches, then add the constraint."
      - "Recent Postgres versions add a constant default without a rewrite; a volatile default still rewrites."
  - type: measurement
    question: "How do you know a migration is safe before production?"
    what_it_tests: "Testing against realistic data and setting lock timeouts."
    strong_points:
      - "Run it on a copy of production-sized data and time it."
      - "Set lock_timeout so it fails fast instead of queueing traffic."
  - type: ownership
    question: "What check did you add to CI afterwards?"
    what_it_tests: "Turning a lesson into a guardrail."
    strong_points:
      - "A linter that flags risky DDL in migration files."
      - "A required lock_timeout in every migration."
rejection_signals:
  - "Thinks running at night solves it."
  - "Doesn't know that an ALTER can queue behind a long transaction."
answer_framework:
  - "Know which schema changes rewrite or lock the whole table."
  - "Expand and contract: add, backfill in batches, then switch reads."
  - "Set a lock timeout, and dry-run on a copy of production data."
model_answer: "The migration took a lock that blocked reads or writes on orders. Common causes are changing a column type, adding a constraint that validates every row, or creating an index without CONCURRENTLY. Even a fast ALTER can do damage if it waits behind a long-running transaction, because every new query then queues behind the ALTER. I'd roll schema changes out in steps: add a nullable column, backfill in small batches, add constraints as NOT VALID and validate separately, and switch reads last. Every migration sets a lock_timeout so it fails fast instead of stalling checkout, and it's timed on a production-sized copy first."
self_check:
  - "Can you explain why a fast ALTER can still cause an outage?"
  - "Can you list the steps of an expand and contract change?"
sources:
  - "https://www.postgresql.org/docs/current/sql-altertable.html"
  - "https://www.postgresql.org/docs/current/explicit-locking.html"
concepts: [sql-vs-nosql]
reviewed: false
---
