---
id: eventual-consistency
title: Eventual consistency
section: availability-vs-consistency
why_here: Copies on different machines take time to catch up.
summary: Eventually consistent systems accept a write on one copy and spread it to the others in the background. Reads may be stale for a short window, but all copies converge if writes stop. DNS, email and most replicated NoSQL stores work this way. Design the UI and the follow-up logic for that window.
key_tradeoff: Higher availability and speed in exchange for a stale-read window.
questions:
  - text: A user updates their profile picture, refreshes, and sees the old one. Is that a bug?
    weak_answer: Yes, the database must be broken.
    red_note: it's the replica lag
    follow_ups:
      - type: failure
        text: Where could the old picture still be coming from?
      - type: tradeoff
        text: How would you give users read-your-own-writes without making every read strong?
      - type: measurement
        text: How long is the stale window, and how do you measure it?
      - type: ownership
        text: What would you tell the product team about this behaviour?
    strong_moves:
      - "Name it: the write went to the leader, the read hit a replica or cache that hasn't caught up."
      - "Fix the user's own view: route their reads to the leader briefly, or version the value."
      - Accept the short window for everyone else, and measure replica lag.
    asked_in: HLD round · SDE-2
  - text: Two users edit the same document on different replicas at the same time. Who wins?
    free: false
self_check:
  - Can you explain read-your-own-writes?
  - Can you say where stale reads come from in a system with replicas and caches?
reviewed: false
---
