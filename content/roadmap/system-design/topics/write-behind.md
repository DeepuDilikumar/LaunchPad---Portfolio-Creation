---
id: write-behind
title: Write-behind
section: caching
why_here: Writes are slow when the database is the bottleneck.
summary: Write-behind writes to the cache first and flushes to the database later in batches. Writes are fast and the database sees less traffic. If the cache dies before flushing, those writes are lost, so it fits counters and analytics better than orders or payments.
key_tradeoff: Fast writes versus risk of losing recent writes.
cloud: cache
questions:
  - text: Video view counts change millions of times a minute. How do you store them without the database falling over?
    weak_answer: Write to Redis and sync to the database later.
    red_note: and if redis dies?
    follow_ups:
      - type: failure
        text: The cache node crashes before a flush. How many views are lost, and does it matter?
      - type: technical
        text: How does the flush work, and what happens if it runs twice?
      - type: tradeoff
        text: Would you use write-behind for a wallet balance? Why not?
      - type: measurement
        text: Which number tells you flushes are falling behind?
    strong_moves:
      - Increment counters in the cache, and flush totals to the database in batches every few seconds.
      - "Size the loss you accept: a crash drops at most one flush window of counts."
      - Make flushes safe to repeat, and never use write-behind for money or orders.
    asked_in: HLD round · SDE-2 · often after “design a view counter”
  - text: Your flush worker crashed halfway and restarted, and some counts were added twice. Why, and how do you fix it?
    free: false
self_check:
  - Can you say which data is safe to write behind?
  - Can you explain what is lost when the cache dies?
reviewed: false
---
