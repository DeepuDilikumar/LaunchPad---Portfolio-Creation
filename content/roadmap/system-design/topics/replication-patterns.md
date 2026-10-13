---
id: replication-patterns
title: Replication
section: availability-patterns
why_here: Keeping copies of data means losing a machine doesn't lose data.
summary: In leader–follower replication one node takes writes and copies them to followers that serve reads. Multi-leader lets several nodes take writes, which helps across regions but creates conflicts to resolve. Copies can be synchronous (safe, slower) or asynchronous (fast, may lose the last few writes in a crash).
key_tradeoff: Synchronous safety versus asynchronous speed.
reviewed: false
---
