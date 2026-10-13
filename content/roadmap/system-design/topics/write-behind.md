---
id: write-behind
title: Write-behind
section: caching
why_here: Writes are slow when the database is the bottleneck.
summary: Write-behind writes to the cache first and flushes to the database later in batches. Writes are fast and the database sees less traffic. If the cache dies before flushing, those writes are lost, so it fits counters and analytics better than orders or payments.
key_tradeoff: Fast writes versus risk of losing recent writes.
cloud: cache
reviewed: false
---
