---
id: pull-cdn
title: Pull CDN
section: cdn
why_here: Most sites want the CDN to fetch content on its own.
summary: A pull CDN fetches a file from your origin the first time someone asks for it, then serves the cached copy until it expires. Setup is easy and only popular files take space. The first user in each region pays the slow fetch, and a cache miss storm can hit your origin hard.
key_tradeoff: Easy setup versus cold-start misses.
cloud: cdn
questions:
  - text: A sale starts at midnight with new banner images. Using a pull CDN, what happens to your origin in the first minute?
    weak_answer: The CDN caches it, so the origin is fine.
    red_note: cached by whom, first?
    follow_ups:
      - type: failure
        text: Thousands of edge servers miss at once. How many requests reach the origin?
      - type: technical
        text: How do you warm the cache before midnight?
      - type: tradeoff
        text: Long TTL for fewer misses, or short TTL for faster fixes?
      - type: measurement
        text: What would you watch on the origin during the first five minutes?
    strong_moves:
      - "Each edge fetches on its first miss, so a new file means a burst of origin requests."
      - Collapse duplicate misses with an origin shield or request coalescing at the CDN.
      - Pre-warm popular files and give the origin enough headroom for the cold start.
    asked_in: Technical deep dive · SDE-2 · often after “how would you handle a flash sale”
  - text: You fixed a wrong image, but users keep seeing the old one for hours. What do you do?
    free: false
self_check:
  - Can you explain who pays the cost of the first request in a pull CDN?
  - Can you describe what an origin shield does?
reviewed: false
---
