---
id: rate-limiting
title: Rate limiting
section: security
why_here: One user, bug or bot can take the whole service down.
summary: Rate limiting caps how many requests a key (user, API key, IP) can make in a time window. A token bucket allows short bursts at a steady average rate. With many servers the counter lives in a shared store. Return 429 with a Retry-After header.
key_tradeoff: Protecting the service versus blocking legitimate spikes.
cloud: rate-limiting
questions:
  - text: Design a rate limiter for a public API. You have ten minutes.
    weak_answer: Keep a counter per user in memory and reject after 100 a minute.
    red_note: which server holds the count?
    follow_ups:
      - type: tradeoff
        text: Fixed window, sliding window or token bucket?
      - type: failure
        text: The store holding the counters goes down. Allow or block everything?
      - type: measurement
        text: What does the client see when it's limited?
      - type: ownership
        text: Who decides the limits for each customer tier?
    strong_moves:
      - Clarify the key (user, API key, IP) and the limit.
      - Token bucket in a shared store, updated atomically.
      - Return 429 with Retry-After; fail open for most endpoints, closed for login and OTP.
    asked_in: HLD/LLD round · SDE-2 · a very common short design
  - text: Design the "resend OTP" button so it can't be abused.
    free: false
    guide_ref: be-dsn-002
self_check:
  - Can you explain the double-burst problem with fixed windows?
  - Can you say when to fail open and when to fail closed?
reviewed: false
---
