---
id: be-cons-002
guide: backend
module: consistency-across-services
title: "Checkout spans payment, inventory and shipping. Shipping fails after payment succeeds. What now?"
rounds: [system-design]
seniority: ["4-8"]
intent: "Sagas, compensations and what can't be undone."
weak_answer: "Wrap all three calls in one transaction."
why_it_fails: "There is no transaction across three services and an external gateway. Each step commits on its own."
red_note: "no transaction spans three services"
follow_ups:
  - type: technical
    question: "Describe the saga for this checkout."
    what_it_tests: "Steps with compensations and a coordinator."
    strong_points:
      - "Reserve inventory, charge payment, create shipment, each with a compensation."
      - "On failure, run compensations in reverse: cancel shipment, refund, release stock."
  - type: tradeoff
    question: "Orchestration or choreography?"
    what_it_tests: "Central visibility against loose coupling."
    strong_points:
      - "An orchestrator makes the flow visible and easy to change."
      - "Choreography avoids a central service but hides the flow across many handlers."
  - type: failure
    question: "The refund itself fails. What then?"
    what_it_tests: "Retrying compensations and escalating to humans."
    strong_points:
      - "Compensations must be retried until they succeed, so they must be idempotent."
      - "After repeated failure, raise it to an operations queue with full context."
  - type: tradeoff
    question: "Could you retry shipping instead of refunding?"
    what_it_tests: "Forward recovery when the failure is temporary."
    strong_points:
      - "If shipping is down for minutes, retrying forward is better for the customer."
      - "Set a deadline after which you compensate."
rejection_signals:
  - "Proposes a distributed transaction across services and the gateway."
  - "Forgets that compensations can fail too."
answer_framework:
  - "Model checkout as a saga with a compensation per step."
  - "Prefer retrying forward for temporary failures, with a deadline."
  - "Make compensations idempotent and escalate when they fail."
model_answer: "There's no single transaction here, so I'd run checkout as a saga. Each step commits locally and has a compensation: release the reservation, refund the payment, cancel the shipment. If shipping fails, I'd first ask whether it's temporary; if so, retry forward with backoff until a deadline, because a delayed shipment is better than a refund. Past the deadline, the orchestrator runs compensations in reverse order. Compensations are retried and idempotent, and if a refund keeps failing it lands in an operations queue with the order context so a person can finish it."
self_check:
  - "Can you list the compensation for each step?"
  - "Can you explain when to retry forward instead of compensating?"
sources:
  - "https://microservices.io/patterns/data/saga.html"
  - "https://learn.microsoft.com/en-us/azure/architecture/reference-architectures/saga/saga"
concepts: [microservices, eventual-consistency]
reviewed: false
---
