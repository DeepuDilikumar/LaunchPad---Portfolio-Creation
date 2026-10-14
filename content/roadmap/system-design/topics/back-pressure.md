---
id: back-pressure
title: Back pressure
section: async
why_here: If work arrives faster than it's processed, queues grow until something breaks.
summary: 'Back pressure means pushing back on producers when consumers can''t keep up: bounded queues, rejecting with a "try later" response, or slowing intake. Without it, queues grow without limit, latency explodes and memory runs out. A clear 503 is kinder than a timeout.'
key_tradeoff: Rejecting some work now versus failing everything later.
questions:
  - text: During a flash sale, orders arrive faster than the payment workers can process them. What do you do?
    weak_answer: Add more workers.
    red_note: and when that's not enough?
    follow_ups:
      - type: technical
        text: How big should the queue be, and what happens when it's full?
      - type: failure
        text: Clients retry every rejected request immediately. What now?
      - type: tradeoff
        text: Reject some new orders, or slow down every order?
      - type: measurement
        text: Which number tells you consumers are falling behind?
    strong_moves:
      - Bound every queue and buffer, so overload shows up as a signal, not as memory running out.
      - When full, reject early with a 429 or 503 and a Retry-After, before doing expensive work.
      - Watch queue depth and the age of the oldest item, and scale or shed load on those.
    asked_in: HLD round · SDE-2 · often after “design a flash sale”
  - text: A slow payment provider made your whole API stop responding. How do you stop that happening again?
    free: false
    guide_ref: be-rel-001
self_check:
  - Can you explain why an unbounded queue is dangerous?
  - Can you name three ways to push back on a producer?
reviewed: false
---
