---
id: key-value
title: Key-value stores
section: databases
why_here: Many lookups are just "give me the value for this key".
summary: A key-value store maps a key to an opaque value, with very fast reads and writes. It suits sessions, carts, feature flags and caches. You can't query by anything except the key, so design your keys around the questions you'll ask.
cloud: nosql
questions:
  - text: You store user sessions for a food delivery app. Why a key-value store, and how do you design the key?
    weak_answer: Redis, because it's fast.
    red_note: fast at what?
    follow_ups:
      - type: failure
        text: The Redis node restarts. Is every user logged out?
      - type: technical
        text: Support wants all sessions of one user. How do you find them when you can only look up by key?
      - type: tradeoff
        text: Keep the session in Redis, or in a signed token?
      - type: measurement
        text: Which numbers tell you the store is running out of room?
    strong_moves:
      - "Every request reads a session by one id, so a key lookup fits: key it as session:<id>."
      - Set a TTL equal to the session lifetime, and keep a second key listing each user's session ids.
      - "Decide what a restart costs: turn on persistence or replication, or accept a re-login."
    asked_in: HLD round · SDE-1/SDE-2
  - text: A user taps “log out of all devices”, but your sessions are JWTs stored nowhere. How do you make it work?
    free: false
    guide_ref: be-sec-002
self_check:
  - Can you design keys for two different lookups on the same data?
  - Can you explain what happens to your data when the store restarts?
reviewed: false
---
