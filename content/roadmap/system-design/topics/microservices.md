---
id: microservices
title: Microservices
section: application-layer
why_here: One big app is hard for many teams to change safely.
summary: Microservices split an app into small services that deploy independently, each owning its data. Teams move faster and failures stay contained. The cost is network calls instead of function calls, distributed transactions, harder debugging and more to operate. Split along business boundaries, and only when one codebase is genuinely slowing teams down.
key_tradeoff: Team independence versus operational and network complexity.
questions:
  - text: Your monolith handles orders, payments and inventory for an e-commerce site. Would you split it into microservices? How?
    weak_answer: Yes, one service per table.
    red_note: split by what, though?
    follow_ups:
      - type: tradeoff
        text: What do you lose when an order and a payment are no longer in one transaction?
      - type: failure
        text: Inventory service is down. Can a customer still place an order?
      - type: ownership
        text: Who owns the order data once it's split?
      - type: measurement
        text: What would tell you the split actually helped the teams?
    strong_moves:
      - Ask what's slowing teams down first; a monolith with clean modules may be enough.
      - Split along business boundaries, with each service owning its own data.
      - Plan for network failure between services with timeouts, retries and async events.
    asked_in: Technical deep dive · SDE-2/SDE-3 · often after “tell me about your current architecture”
  - text: An order was saved, but the event telling inventory never arrived. How did that happen, and how do you prevent it?
    free: false
    guide_ref: be-cons-001
self_check:
  - Can you say when you would not split a monolith?
  - Can you explain why a shared database defeats the point of microservices?
india_note: "Many candidates say their company “moved to microservices”, so expect follow-ups on why, and what got harder."
reviewed: false
---
