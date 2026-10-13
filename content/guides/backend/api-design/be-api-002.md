---
id: be-api-002
guide: backend
module: api-design
title: "A client says your list endpoint returns duplicates and skips items while paging. Why?"
rounds: [technical-deep-dive]
seniority: ["2-4", "4-8"]
intent: "Offset pagination against cursor pagination on changing data."
weak_answer: "The client must be calling it wrong."
why_it_fails: "Offset pagination over data that changes between calls shifts rows across page boundaries. The client is right."
red_note: "the client is right"
follow_ups:
  - type: technical
    question: "Show me how an insert causes a duplicate with offset paging."
    what_it_tests: "Walking through the page boundary shift."
    strong_points:
      - "Page 1 reads rows 1 to 20. A new row is inserted at the top."
      - "Page 2 with offset 20 now starts at the old row 20, so it repeats."
      - "A delete shifts the other way and skips a row."
  - type: technical
    question: "How does cursor pagination fix it?"
    what_it_tests: "Keyset paging on a stable, unique sort key."
    strong_points:
      - "Return a cursor encoding the last row's sort key, and query WHERE (created_at, id) < cursor."
      - "The sort key must be unique, so add the ID as a tie-breaker."
  - type: tradeoff
    question: "What do you lose with cursors?"
    what_it_tests: "Jumping to page N, total counts and sort flexibility."
    strong_points:
      - "No jumping to an arbitrary page."
      - "Each sort order needs its own index and cursor format."
  - type: measurement
    question: "Why is offset paging also slow on page 500?"
    what_it_tests: "Offset cost grows with depth."
    strong_points:
      - "The database still reads and discards every skipped row."
      - "Keyset queries use the index and stay fast at any depth."
rejection_signals:
  - "Blames the client without reproducing it."
  - "Uses a non-unique sort key for the cursor."
answer_framework:
  - "Explain the boundary shift with offsets on changing data."
  - "Switch to a cursor on a unique, indexed sort key."
  - "Be clear about what cursors give up."
model_answer: "With offset pagination, inserts and deletes between page requests shift rows across page boundaries. An insert at the top pushes the last row of page 1 onto page 2, so the client sees it twice; a delete pulls a row back, so it's skipped. I'd move to cursor pagination: the response includes an opaque cursor encoding the last row's sort key plus the ID as a tie-breaker, and the next query asks for rows after that key. It's stable while data changes and stays fast on deep pages because it uses the index instead of skipping rows. The cost is no jumping to page N, which most feeds don't need."
self_check:
  - "Can you explain why the ID must be part of the cursor?"
  - "Can you explain why offset 10,000 is slow?"
sources:
  - "https://use-the-index-luke.com/no-offset"
  - "https://docs.stripe.com/api/pagination"
reviewed: false
---
