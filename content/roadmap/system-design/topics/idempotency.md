---
id: idempotency
title: Idempotency
section: communication
why_here: Networks retry, and retries can do the same thing twice.
summary: An operation is idempotent if doing it twice has the same effect as doing it once. Clients send an idempotency key with each request; the server stores the key with the result and replays the result for a repeat. It's what makes retries safe for payments, orders and messages.
key_tradeoff: Storage and a lookup per request versus duplicate side effects.
questions:
  - text: A mobile client retries a "place order" call after a timeout and the user gets two orders. Fix it.
    weak_answer: Disable retries on the client.
    red_note: then real failures never recover
    follow_ups:
      - type: failure
        text: The first request is still running when the retry arrives. What happens?
      - type: tradeoff
        text: Where does the idempotency key live, and for how long?
      - type: measurement
        text: How would you prove duplicates stopped?
      - type: ownership
        text: "Who generates the key: client or server?"
    strong_moves:
      - "Treat a timeout as unknown: the first call may have worked."
      - The client sends one key per attempt; the server stores key + result in one transaction.
      - Same key returns the stored result; same key with a different body is rejected.
    asked_in: HLD round · SDE-2 · payments and orders
  - text: A customer was charged twice for one order. Walk me through why.
    free: false
    guide_ref: be-pay-001
self_check:
  - Can you say which HTTP methods are meant to be idempotent?
  - Can you describe the idempotency key table?
india_note: "Fintech and e-commerce interviews in India lean on this heavily: UPI retries and double charges are familiar stories."
reviewed: false
---
