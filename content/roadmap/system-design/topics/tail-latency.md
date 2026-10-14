---
id: tail-latency
title: p99 and tail latency
section: numbers
why_here: Averages hide the slow requests users actually feel.
summary: Sort all response times; p99 is the time that 99% of requests beat. A page that makes 50 backend calls hits the slowest 1% on most loads, so tails matter more than averages. Tails come from garbage collection, lock waits, cold caches, big payloads and noisy neighbours. Measure per endpoint and per version.
key_tradeoff: Cutting the tail (hedged requests, timeouts) costs extra load.
questions:
  - text: Average latency is 80 ms but users say the app feels slow. What do you look at?
    weak_answer: The average is fine, so it's probably their network.
    red_note: averages hide the tail
    follow_ups:
      - type: measurement
        text: Which percentile would you put on the dashboard, and why?
      - type: failure
        text: A page makes 40 backend calls. Why does p99 matter more than p50 here?
      - type: tradeoff
        text: Hedged requests cut the tail. What do they cost you?
      - type: ownership
        text: How would you stop the next deploy from making the tail worse?
    strong_moves:
      - Look at p95/p99 per endpoint, not the average.
      - A page with many calls hits the slow tail on most loads, so tails are what users feel.
      - Find the cause (GC, locks, big payloads, cold cache), then guard deploys on p99.
    asked_in: Technical deep dive · SDE-2
  - text: p99 doubled after a deploy but the average looks fine. Where do you look?
    free: false
    guide_ref: be-perf-001
self_check:
  - Can you explain why p99 matters more on a page with many backend calls?
  - Can you name three causes of tail latency?
reviewed: false
---
