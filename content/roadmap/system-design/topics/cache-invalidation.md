---
id: cache-invalidation
title: Invalidation
section: caching
why_here: A cache that serves old data can be worse than no cache.
summary: "When data changes, cached copies must expire or be removed. Options are time-based expiry, deleting on write, or versioned keys. Races are the hard part: a slow reader can write an old value back after you deleted it. Versions, or a short TTL as a safety net, limit the damage."
key_tradeoff: Freshness versus complexity and load.
cloud: cache
reviewed: false
---
