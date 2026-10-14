---
id: where-to-cache
title: Where to cache
section: caching
why_here: Caches exist at every layer; each has a different cost.
summary: You can cache in the browser, the CDN, the load balancer, the app's memory, a shared cache like Redis, and the database's own buffer. Closer to the user is faster but harder to invalidate. Know every layer that might hold a copy, because stale data usually comes from the one you forgot.
cloud: cache
questions:
  - text: A restaurant menu page is slow for users across India. Where would you cache it, and what breaks when the menu changes?
    weak_answer: Put it in Redis.
    red_note: only one layer?
    follow_ups:
      - type: technical
        text: Which layers could hold a copy of this menu between the database and the phone?
      - type: failure
        text: A restaurant marks a dish sold out, but the app shows it for ten more minutes. Which layer?
      - type: tradeoff
        text: In-process memory or a shared Redis for the menu?
      - type: ownership
        text: Who purges the CDN when a menu changes?
    strong_moves:
      - "List every layer from the phone back: app, CDN, gateway, server memory, Redis, database."
      - Cache the static parts near the user, and keep fast-changing fields like availability short-lived or uncached.
      - "For each layer, say how a change reaches it: TTL, purge or event."
    asked_in: HLD round · SDE-2 · often after “design a food delivery app”
  - text: You fixed a wrong price in the database, but some users see the old one for hours. Where is it coming from?
    free: false
    guide_ref: be-cache-002
self_check:
  - Can you list the cache layers in a typical request?
  - Can you say how each layer gets invalidated?
reviewed: false
---
