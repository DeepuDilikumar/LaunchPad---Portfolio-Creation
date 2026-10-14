---
id: http
title: HTTP
section: communication
why_here: Almost every service talks HTTP, and its details matter in interviews.
summary: HTTP is a request–response protocol with methods (GET, POST, PUT, DELETE), status codes and headers. GET, PUT and DELETE are meant to be idempotent; POST isn't. Know what 429, 503 and 504 mean, and what caching headers do.
questions:
  - text: A client sends POST /payments, times out and retries. Is that safe? What does HTTP say about it?
    weak_answer: Just retry, HTTP handles it.
    red_note: post isn't idempotent
    follow_ups:
      - type: technical
        text: Which HTTP methods are meant to be idempotent, and why does POST differ?
      - type: technical
        text: The client got a 504. Did the payment happen?
      - type: tradeoff
        text: Return 429 or 503 when you're overloaded? What should the client do with each?
      - type: failure
        text: The server crashed after charging but before responding. What does the retry see?
    strong_moves:
      - "A timeout means the result is unknown: the server may have done the work."
      - Make POST safe to retry with an idempotency key the server stores with the result.
      - Use status codes so clients know whether and when to retry, like 429 with Retry-After.
    asked_in: Technical deep dive · SDE-2 · often after “design a payments API”
  - text: A user was charged twice for one order after a network blip. Walk me through how it happened.
    free: false
    guide_ref: be-pay-001
self_check:
  - Can you say what 429, 503 and 504 each mean for a client?
  - Can you explain what an idempotency key protects against?
india_note: "Shows up often around UPI and wallet payments, where timeouts and retries are common on mobile networks."
reviewed: false
---
