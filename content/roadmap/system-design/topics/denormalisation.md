---
id: denormalisation
title: Denormalisation
section: databases
why_here: Joins get expensive at scale.
summary: "Denormalising stores copies of data where it's read, so a page needs one query instead of five joins. Reads get faster; writes get harder, because every copy must be updated. It's a deliberate trade: say which reads you're speeding up and how you keep the copies in sync."
key_tradeoff: Faster reads versus more complex, slower writes.
questions:
  - text: An order history page joins five tables and takes 800 ms. Would you denormalise, and what exactly would you copy?
    weak_answer: Put everything in one table so there are no joins.
    red_note: and who updates copies?
    follow_ups:
      - type: failure
        text: A restaurant renames itself. Which name do old orders show, and is that right?
      - type: technical
        text: "How do the copies get updated: in the same transaction, or by an event?"
      - type: tradeoff
        text: Denormalise, or add the right index and a cache first?
      - type: measurement
        text: How would you find out that the copies have drifted from the source?
    strong_moves:
      - Name the one slow read, and check indexes and the query plan before changing the schema.
      - Copy only the fields the page needs, and decide per field whether it's a snapshot or must stay in sync.
      - Update synced copies in the same transaction or through an event, and run a job that finds drift.
    asked_in: Technical deep dive · SDE-2 · often after “design order history”
  - text: You update the source row and publish an event to fix the copies, but sometimes the event never goes out. What now?
    free: false
    guide_ref: be-cons-001
self_check:
  - Can you say which copies in your design are snapshots and which must stay in sync?
  - Can you explain how a denormalised copy gets updated when the source changes?
reviewed: false
---
