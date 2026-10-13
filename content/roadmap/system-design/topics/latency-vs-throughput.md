---
id: latency-vs-throughput
title: Latency vs throughput
section: numbers
why_here: Before you can make something faster, you need to know which kind of fast matters.
summary: "Latency is how long one request takes. Throughput is how many requests finish per second. They are related but not the same: batching raises throughput and often hurts latency; adding servers raises throughput without making one request faster. Say which one the product cares about before you optimise anything."
key_tradeoff: Batching for throughput costs latency for each item.
reviewed: false
---
