---
id: read-replicas
title: Read replicas
section: databases
why_here: Most apps read far more than they write.
summary: "Read replicas copy the primary database and serve read queries, taking load off the primary. Replication is usually asynchronous, so a replica can lag: a user may not see their own update. Route reads that must be fresh, like right after a write, to the primary."
key_tradeoff: More read capacity versus replica lag.
cloud: sql
questions:
  - text: Your database CPU is at 90%, almost all from reads. What do you do?
    weak_answer: Upgrade to a bigger database.
    red_note: that buys months, not a design
    follow_ups:
      - type: failure
        text: A user updates their address and the next page shows the old one. Why?
      - type: tradeoff
        text: "Read replicas or a cache in front: which first?"
      - type: measurement
        text: Which number tells you a replica is falling behind?
      - type: ownership
        text: How does the app decide which reads go to the primary?
    strong_moves:
      - Add read replicas and route read-only queries to them.
      - Replication is async, so reads right after a write go to the primary.
      - Watch replica lag, and add a cache for the hottest reads.
    asked_in: HLD round · SDE-1/SDE-2
  - text: Two users booked the last seat at the same time. How did that happen?
    free: false
    guide_ref: be-db-001
self_check:
  - Can you explain replica lag and one way to hide it from users?
reviewed: false
---
