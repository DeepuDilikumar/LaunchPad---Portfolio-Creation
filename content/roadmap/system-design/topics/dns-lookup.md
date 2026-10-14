---
id: dns-lookup
title: How a lookup works
section: dns
why_here: Users type a name; something has to turn it into an address.
summary: Your device asks a resolver, usually your ISP's or a public one. If it hasn't cached the answer, the resolver asks a root server, then the server for .in or .com, then the domain's authoritative server, and caches the result. Most lookups never leave the cache, which is why DNS is fast and why changes spread slowly.
cloud: dns
questions:
  - text: A user in Pune types your domain and waits 2 seconds before anything loads. Could DNS be the cause?
    weak_answer: No, DNS is cached, so it's always fast.
    red_note: cached where?
    follow_ups:
      - type: technical
        text: Walk me through the lookup when nothing is cached.
      - type: failure
        text: Your authoritative DNS provider goes down. Who notices first, and when?
      - type: measurement
        text: How would you measure DNS time for real users?
      - type: tradeoff
        text: One DNS provider or two? What does the second one cost?
    strong_moves:
      - "Cold lookup: the resolver asks root, then the TLD, then your authoritative server. Each hop is a round trip."
      - Most lookups hit a cache, so DNS hurts with cold caches, very short TTLs or a slow resolver.
      - Check DNS time in real-user timing data before blaming or clearing it.
    asked_in: Technical deep dive · SDE-2 · often after “what happens when you type a URL?”
  - text: Your DNS provider has an outage. Existing users are fine but new users can't reach you. How do you plan for this?
    free: false
self_check:
  - Can you list each server a cold DNS lookup touches?
  - Can you explain why most lookups never leave the cache?
india_note: "“What happens when you type a URL?” is a common opener in Indian interviews, and DNS is where the follow-ups start."
reviewed: false
---
