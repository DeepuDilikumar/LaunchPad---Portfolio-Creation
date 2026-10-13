---
id: be-db-001
guide: backend
module: databases-and-transactions
title: "Two users booked the last seat at the same time. How did that happen?"
rounds: [technical-deep-dive]
seniority: ["2-4", "4-8"]
intent: "Do they see the read-then-write race and know how to close it?"
weak_answer: "We check if the seat is free before booking, so it shouldn't happen."
why_it_fails: "Check-then-act is the race. Both requests read 'free' before either writes."
red_note: "check-then-act is the bug"
flow:
  nodes:
    - { label: "Request A" }
    - { label: "seats row", bad: true }
    - { label: "Request B" }
  note: "both read 'free'"
follow_ups:
  - type: technical
    question: "Show me the fix in SQL."
    what_it_tests: "Conditional updates, row locks and unique constraints."
    strong_points:
      - "A conditional update: UPDATE seats SET booked_by = ? WHERE id = ? AND booked_by IS NULL, then check rows affected."
      - "Or SELECT ... FOR UPDATE inside a transaction."
      - "Or a unique constraint on (show_id, seat_id) in a bookings table."
  - type: tradeoff
    question: "Pessimistic lock or optimistic version check?"
    what_it_tests: "Contention level against lock wait time."
    strong_points:
      - "Pessimistic suits hot rows with frequent conflicts."
      - "Optimistic suits rare conflicts, but losers must retry or fail fast."
  - type: technical
    question: "Would raising the isolation level to SERIALIZABLE fix it?"
    what_it_tests: "What isolation levels guarantee and what they cost."
    strong_points:
      - "Yes, but conflicting transactions fail with serialization errors that must be retried."
      - "Repeatable read alone may not prevent this write skew in every database."
  - type: failure
    question: "The booking succeeded, but the payment failed. What happens to the seat?"
    what_it_tests: "Holds with expiry instead of permanent bookings."
    strong_points:
      - "Hold the seat with an expiry, confirm on payment."
      - "A job releases expired holds."
rejection_signals:
  - "Fixes it with a check in application code only."
  - "Uses a distributed lock for a single-database problem without saying why."
answer_framework:
  - "Name the race: both read 'free' before either writes."
  - "Make the database decide: a conditional update or a unique constraint."
  - "Hold with expiry, confirm on payment."
model_answer: "This is a check-then-act race. Both requests read the seat as free, then both wrote a booking. The application check cannot fix it because it happens outside the write. I'd let the database decide atomically, for example a conditional update that only books if the seat is still free and then checks the affected row count, or a unique constraint on the seat in the bookings table so the second insert fails. Because payment can fail after the seat is taken, I'd hold the seat with an expiry and confirm it only when payment succeeds, with a job releasing expired holds."
self_check:
  - "Can you write the conditional UPDATE from memory?"
  - "Can you explain what the loser of an optimistic check experiences?"
sources:
  - "https://www.postgresql.org/docs/current/transaction-iso.html"
  - "https://www.postgresql.org/docs/current/explicit-locking.html"
concepts: [strong-consistency]
reviewed: false
---
