---
id: event-driven-jobs
title: Event-driven jobs
section: async
why_here: Some work should happen because something else happened.
summary: Event-driven jobs run when an event is published, like "order placed" triggering emails, inventory updates and analytics. Producers don't need to know who listens, which keeps services loosely coupled. Tracing a single order through many listeners gets harder, so log the event ID everywhere.
cloud: pubsub
questions:
  - text: When an order is placed, you must send an SMS, update inventory and notify the restaurant. How do you wire it up?
    weak_answer: The order service calls all three services.
    red_note: one slow call blocks checkout
    follow_ups:
      - type: technical
        text: How does a new listener get added without changing the order service?
      - type: failure
        text: The order is saved but the publish fails. What now?
      - type: tradeoff
        text: Put the full order in the event, or just the order ID?
      - type: ownership
        text: Who owns the event's schema when five teams consume it?
    strong_moves:
      - Save the order, then publish one “order placed” event that each consumer subscribes to on its own.
      - Write the event to an outbox table in the same transaction, so it's published only if the order commits.
      - Consumers dedupe on the event ID, because delivery is at least once.
    asked_in: HLD round · SDE-2 · often after “design food delivery”
  - text: The order was saved, but the event never reached the inventory service. How did that happen?
    free: false
    guide_ref: be-cons-001
self_check:
  - Can you explain why publishing after a database commit can lose events?
  - Can you trace one order through every listener using its event ID?
reviewed: false
---
