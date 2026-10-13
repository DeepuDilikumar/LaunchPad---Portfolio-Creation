---
id: be-pay-001
guide: backend
module: payments-and-idempotency
title: "A customer was charged twice for one order. Walk me through why."
rounds: [technical-deep-dive]
seniority: ["2-4", "4-8"]
intent: "Can they tell a lost response apart from a failed call, and make retries safe with idempotency keys?"
weak_answer: "The client retried after a timeout, so I'd cap the retries."
why_it_fails: "Capping retries hides the symptom. A single retry can still double-charge if the first call succeeded and only the response was lost."
red_note: "treats the symptom, not the cause"
margin_note: "timed out after 30 s… or did it?"
flow:
  nodes:
    - { label: "Client" }
    - { label: "Orders API" }
    - { label: "Payment gateway", bad: true }
  note: "timed out after 30 s… or did it?"
follow_ups:
  - type: failure
    question: "The gateway charged the card, but your service never saw the response. What does your service do next?"
    what_it_tests: "Treating a timeout as an unknown outcome instead of a failure."
    strong_points:
      - "A timeout means the outcome is unknown, not that the call failed."
      - "Query the gateway for the payment status by your order reference before retrying."
      - "Retry only with the same idempotency key."
  - type: tradeoff
    question: "Say you add an idempotency key. The same key arrives again with a different amount. What should the server do?"
    what_it_tests: "Whether the key is bound to the request, not just stored."
    strong_points:
      - "Store a hash of the request body with the key."
      - "Same key, different body: reject with a clear error (for example 409 or 422)."
      - "Same key, same body: return the stored result and charge nothing."
  - type: technical
    question: "Where does the idempotency key live, and for how long?"
    what_it_tests: "Storage choice, atomic insert, and expiry tied to the retry window."
    strong_points:
      - "A table with a unique constraint on the key, written in the same transaction as the payment attempt."
      - "Keep keys at least as long as clients may retry, often 24 hours or more."
      - "Handle the in-flight case: a second request while the first is still running gets a 409 or waits."
  - type: ownership
    question: "Which part of the fix did you build yourself?"
    what_it_tests: "Whether they can separate their own work from the team's."
    strong_points:
      - "Names a concrete piece: the key table, the gateway status check, or the reconciliation job."
      - "Says what they decided and what they would change."
  - type: measurement
    question: "How would you prove duplicate charges stopped?"
    what_it_tests: "Turning a fix into a metric and a reconciliation check."
    strong_points:
      - "A daily reconciliation of gateway settlements against orders, alerting on more than one capture per order."
      - "Count idempotent replays and key conflicts as metrics."
rejection_signals:
  - "Assumes a timeout means the payment failed."
  - "Generates a new idempotency key on every retry."
  - "Returns the stored response without comparing the request."
answer_framework:
  - "Treat a timeout as unknown, not failed. The charge may have gone through."
  - "Send an idempotency key with every charge, created once per order attempt."
  - "Store the key with a hash of the request, and replay the stored result instead of charging again."
model_answer: "The most likely cause is a retry after a lost response. Our service called the gateway, the gateway charged the card, and the response timed out on the way back. We treated the timeout as a failure and retried, so the card was charged again. The fix has three parts. First, a timeout is an unknown outcome: check the payment status with the gateway before doing anything else. Second, every charge carries an idempotency key created once per order attempt, so the gateway and our own API dedupe repeats. Third, we store the key with a hash of the request; a repeat with the same body returns the stored result, and a repeat with a different body is rejected. Then I'd add a daily reconciliation so any duplicate that slips through is caught and refunded the same day."
self_check:
  - "Can you explain why a timeout is not a failure in one sentence?"
  - "Can you say what happens when the same key arrives with a different body?"
  - "Can you name the metric that proves the fix worked?"
sources:
  - "https://docs.stripe.com/api/idempotent_requests"
  - "https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/"
reviewed: false
---
