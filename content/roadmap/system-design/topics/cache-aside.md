---
id: cache-aside
title: Cache-aside
section: caching
why_here: Reads hit the database for the same data again and again.
summary: "The app checks the cache first. On a miss it reads the database and writes the result into the cache with an expiry. Only data that's actually requested gets cached, and a cache crash just means slower reads. The cost: the first read after expiry is slow, and a write can leave a stale copy behind."
key_tradeoff: Fresh data versus fewer database reads; the TTL is where you choose.
cloud: cache
flow:
  nodes:
    - label: App
    - label: Cache
    - label: Database
      bad: true
  note: miss → read DB → fill cache
questions:
  - text: The product page reads the price from the database on every request. Where do you add a cache, and what goes wrong first?
    weak_answer: Put Redis in front of the DB.
    red_note: where? until when?
    follow_ups:
      - type: failure
        text: The cache node dies at peak. What hits the database?
      - type: tradeoff
        text: Cache-aside or write-through for prices?
      - type: ownership
        text: Who invalidates the entry when the price changes?
      - type: measurement
        text: Which number tells you the cache is working?
    strong_moves:
      - Cache what's read far more than written, and say the hit ratio you expect.
      - Pick a TTL from how stale a price may be, and delete the key on write.
      - "Plan for the cache dying: coalesce misses and protect the database."
    asked_in: HLD round · SDE-2 · often after “design a product page”
  - text: You updated a price, but some users see the old one far longer than the cache TTL. How?
    free: false
    guide_ref: be-cache-002
self_check:
  - Can you draw the cache-aside read path from memory?
  - Can you explain what happens on a write?
  - Can you name the race that writes a stale value back?
india_note: "Asked in nearly every HLD round that has a read-heavy page: product pages, feeds, profiles."
reviewed: false
---
