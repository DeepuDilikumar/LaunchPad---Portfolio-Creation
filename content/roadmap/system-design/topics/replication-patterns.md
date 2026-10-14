---
id: replication-patterns
title: Replication
section: availability-patterns
why_here: Keeping copies of data means losing a machine doesn't lose data.
summary: In leader–follower replication one node takes writes and copies them to followers that serve reads. Multi-leader lets several nodes take writes, which helps across regions but creates conflicts to resolve. Copies can be synchronous (safe, slower) or asynchronous (fast, may lose the last few writes in a crash).
key_tradeoff: Synchronous safety versus asynchronous speed.
questions:
  - text: Orders go to a leader with two async followers. The leader crashes. What happens to the last second of orders?
    weak_answer: Nothing, we have replicas.
    red_note: async means maybe lost
    follow_ups:
      - type: tradeoff
        text: Make one follower synchronous. What does that cost on every write?
      - type: failure
        text: A user places an order, reads from a follower and sees nothing. Why?
      - type: technical
        text: When would you choose multi-leader, and what conflict shows up first?
      - type: measurement
        text: Which metric tells you how much data you would lose right now?
    strong_moves:
      - Async followers lag, so a crash can lose writes the user was told succeeded.
      - Make one follower confirm each order write; keep the others async for reads.
      - Watch replication lag, and send a user's reads to the leader just after they write.
    asked_in: Technical deep dive · SDE-2 / SDE-3
  - text: You run leaders in Mumbai and Singapore. Both accept an edit to the same address. Which one wins?
    free: false
self_check:
  - Can you say what synchronous and asynchronous replication each cost?
  - Can you explain replication lag to a product manager?
reviewed: false
---
