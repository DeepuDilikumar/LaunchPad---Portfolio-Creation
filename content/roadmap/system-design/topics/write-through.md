---
id: write-through
title: Write-through
section: caching
why_here: Some data must be in the cache the moment it's written.
summary: With write-through, every write goes to the cache and the database together, so the cache is never stale for that data. Writes get slower, and the cache fills with data that may never be read. It suits data that's read soon and often after it's written.
key_tradeoff: Always-fresh cache versus slower writes.
cloud: cache
questions:
  - text: A user's loyalty points show on every screen right after each order. Would you use write-through, and what does it cost?
    weak_answer: Yes, write to the cache and the database together, so it's always fresh.
    red_note: together how?
    follow_ups:
      - type: failure
        text: The database write succeeds but the cache write fails. What do users see?
      - type: technical
        text: In which order do you write, and what if two writes race?
      - type: tradeoff
        text: Write-through, or cache-aside with a delete on write?
      - type: measurement
        text: How much does write latency go up, and how would you check?
    strong_moves:
      - Write the database first, since it's the source of truth, then set the cache.
      - If the cache write fails, delete the key or let a short TTL repair it.
      - Use it only for data read soon after it's written, or the cache fills with cold keys.
    asked_in: Technical deep dive · SDE-2 · often after “cache-aside or write-through?”
  - text: Your write-through cache is full of keys nobody reads, and memory is running out. How did that happen?
    free: false
self_check:
  - Can you explain what happens when one of the two writes fails?
  - Can you say when write-through beats cache-aside?
reviewed: false
---
