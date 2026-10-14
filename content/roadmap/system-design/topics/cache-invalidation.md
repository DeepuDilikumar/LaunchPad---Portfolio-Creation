---
id: cache-invalidation
title: Invalidation
section: caching
why_here: A cache that serves old data can be worse than no cache.
summary: "When data changes, cached copies must expire or be removed. Options are time-based expiry, deleting on write, or versioned keys. Races are the hard part: a slow reader can write an old value back after you deleted it. Versions, or a short TTL as a safety net, limit the damage."
key_tradeoff: Freshness versus complexity and load.
cloud: cache
questions:
  - text: A user changes their delivery address, but checkout still shows the old one. How do you invalidate the cached profile?
    weak_answer: Set a shorter TTL.
    red_note: shorter is still stale
    follow_ups:
      - type: technical
        text: On a write, do you update the cached value or delete the key? Why?
      - type: failure
        text: A slow reader fetched the old row, you deleted the key, then it wrote the old value back. Now what?
      - type: ownership
        text: Three services cache this profile. Who tells them it changed?
      - type: measurement
        text: How would you detect users seeing stale data in production?
    strong_moves:
      - Delete the key after the database commit, rather than updating it, so racing writers can't leave a wrong value.
      - Keep a TTL as a safety net, and use versions so an older value can't overwrite a newer one.
      - For other services, publish a change event and let each one delete its own copy.
    asked_in: Technical deep dive · SDE-2 · often after “design a cache”
  - text: You deleted the cache key after a price change, yet some users see the old price long after the TTL. Why?
    free: false
    guide_ref: be-cache-002
self_check:
  - Can you explain the race where a deleted key comes back stale?
  - Can you list every place a copy of the data might live?
reviewed: false
---
