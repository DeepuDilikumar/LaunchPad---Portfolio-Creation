---
id: api-gateway
title: API gateway
section: application-layer
why_here: Clients shouldn't need to know about every internal service.
summary: An API gateway is one front door for many services. It routes requests, checks authentication, applies rate limits, and can combine several calls into one response for mobile clients. It is also one more hop and a shared dependency, so keep business logic out of it.
key_tradeoff: One place for cross-cutting rules versus one more thing that can fail.
cloud: api-gateway
questions:
  - text: Your mobile app calls eight backend services. Would you add an API gateway, and what would you put in it?
    weak_answer: Yes, the gateway handles everything.
    red_note: everything? really?
    follow_ups:
      - type: failure
        text: The gateway slows down. Which features break?
      - type: tradeoff
        text: Should the gateway combine responses for the home screen, or should a service do it?
      - type: ownership
        text: Five teams want gateway changes. Who owns its config?
      - type: measurement
        text: How do you measure the latency the gateway itself adds?
    strong_moves:
      - "Put cross-cutting rules in it: routing, auth checks, rate limits, request IDs."
      - Keep business logic out, so the gateway stays thin and rarely needs changes.
      - Run it as a redundant, scaled tier and watch its own latency and errors.
    asked_in: HLD round · SDE-2 · often after “design the backend for a mobile app”
  - text: How would you design the rate limiter inside your gateway so one client can't flood your services?
    free: false
    guide_ref: be-dsn-001
self_check:
  - Can you list what belongs in a gateway and what doesn't?
  - Can you explain why a gateway needs its own redundancy?
reviewed: false
---
