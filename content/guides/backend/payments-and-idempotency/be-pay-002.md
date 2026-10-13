---
id: be-pay-002
guide: backend
module: payments-and-idempotency
title: "The gateway's webhook arrived before your API got the payment response. What breaks?"
rounds: [technical-deep-dive]
seniority: ["2-4", "4-8"]
intent: "Do they model payment as a state machine that accepts events in any order?"
weak_answer: "The webhook should always come after the API response, so that can't happen."
why_it_fails: "Webhooks and API responses travel separate paths. Ordering is never guaranteed, and webhooks can repeat or arrive hours late."
red_note: "networks don't promise order"
flow:
  nodes:
    - { label: "Gateway" }
    - { label: "Webhook handler", bad: true }
    - { label: "Orders DB" }
  note: "webhook first, response second"
follow_ups:
  - type: failure
    question: "The webhook says 'captured' but your order row still says 'created'. What does the handler do?"
    what_it_tests: "Accepting events for states the code has not reached yet."
    strong_points:
      - "Allow forward transitions from any earlier state: created to captured is valid."
      - "Never move backwards: a late 'authorized' after 'captured' is ignored."
      - "Use a conditional update so two writers cannot both win."
  - type: technical
    question: "The same webhook arrives three times. How do you make sure the order ships once?"
    what_it_tests: "Event-level dedupe and side effects that run once."
    strong_points:
      - "Store the event ID with a unique constraint and skip repeats."
      - "Trigger side effects from the state transition, not from the event."
      - "Verify the webhook signature before trusting any of it."
  - type: tradeoff
    question: "Do you trust the webhook payload, or call the gateway API to fetch the payment?"
    what_it_tests: "Weighing an extra call against acting on a stale or forged payload."
    strong_points:
      - "Verify the signature either way."
      - "Fetching the payment gives the current state and protects against replays of old events."
      - "The cost is latency and a dependency on the gateway API during incidents."
  - type: measurement
    question: "How would you notice orders stuck in 'created' even though the customer paid?"
    what_it_tests: "Reconciliation as a safety net for missed webhooks."
    strong_points:
      - "A scheduled job that queries the gateway for payments on orders older than N minutes still in 'created'."
      - "An alert on the count of stuck orders, not on individual ones."
rejection_signals:
  - "Assumes webhooks arrive once and in order."
  - "Lets a late event move an order backwards."
  - "Skips signature verification because the URL is secret."
answer_framework:
  - "Model the payment as a state machine that only moves forward."
  - "Dedupe events by ID and run side effects on transitions."
  - "Back it with a reconciliation job for anything that never arrives."
model_answer: "Nothing should break if the order is a state machine. Both the API response and the webhook are just signals that try to move the order forward. Whichever arrives first applies a conditional update, for example 'set status to captured where status is created or authorized', and the second becomes a no-op. I'd store webhook event IDs with a unique constraint so repeats are ignored, and trigger shipping or emails from the transition into 'captured', which can only happen once. Finally, a reconciliation job checks the gateway for any order stuck in 'created' after fifteen minutes, because some webhooks never arrive."
self_check:
  - "Can you write the conditional update that moves an order forward?"
  - "Can you explain why side effects hang off transitions, not events?"
sources:
  - "https://razorpay.com/docs/webhooks/"
  - "https://docs.stripe.com/webhooks"
reviewed: false
---
