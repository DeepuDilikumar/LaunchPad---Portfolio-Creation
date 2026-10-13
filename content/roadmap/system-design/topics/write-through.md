---
id: write-through
title: Write-through
section: caching
why_here: Some data must be in the cache the moment it's written.
summary: With write-through, every write goes to the cache and the database together, so the cache is never stale for that data. Writes get slower, and the cache fills with data that may never be read. It suits data that's read soon and often after it's written.
key_tradeoff: Always-fresh cache versus slower writes.
cloud: cache
reviewed: false
---
