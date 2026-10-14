---
id: cache-stampede
title: Stampedes
section: caching
why_here: When a hot key expires, everyone misses at once.
summary: A popular entry expires and thousands of requests miss together, all hitting the database. Stop it by letting one request rebuild the value while others wait or get the old value, by adding random jitter to expiry times, or by refreshing hot keys early.
key_tradeoff: Serving slightly stale data versus making users wait.
cloud: cache
questions:
  - text: A popular cache key expires and database load spikes for about a minute. What's happening?
    weak_answer: The database needs a bigger instance.
    red_note: it's the misses, not the DB
    follow_ups:
      - type: failure
        text: Two app servers rebuild the same key at once. Does that matter?
      - type: tradeoff
        text: Serve the stale value while refreshing, or make users wait?
      - type: measurement
        text: Which metrics show it's a stampede?
      - type: ownership
        text: How would you stop thousands of keys expiring together after a deploy?
    strong_moves:
      - "Name it: many requests miss the same hot key at the same moment."
      - Let one request rebuild it; others wait briefly or get the old value.
      - Add jitter to TTLs and refresh hot keys early.
    asked_in: Technical deep dive · SDE-2
  - text: Your cache cluster restarts and every key is gone. How do you bring traffic back without killing the database?
    free: false
    guide_ref: be-cache-001
self_check:
  - Can you explain coalescing in one sentence?
  - Can you say why jitter helps?
reviewed: false
---
