---
id: be-queue-002
guide: backend
module: queues-and-async
title: "A consumer processed the same message twice and sent two emails. Why, and how do you stop it?"
rounds: [technical-deep-dive]
seniority: ["2-4", "4-8"]
intent: "Do they understand at-least-once delivery and idempotent consumers?"
weak_answer: "Switch the queue to exactly-once delivery."
why_it_fails: "End-to-end exactly-once side effects do not come from the broker. Emails and HTTP calls leave the broker's control, so the consumer has to dedupe."
red_note: "the email isn't in the broker"
follow_ups:
  - type: technical
    question: "When exactly can a message be delivered twice?"
    what_it_tests: "The gap between doing the work and acknowledging it."
    strong_points:
      - "The consumer did the work but crashed or timed out before acknowledging."
      - "A visibility timeout expired while processing was still running."
      - "A rebalance moved the partition before the offset was committed."
  - type: tradeoff
    question: "Acknowledge before processing, or after?"
    what_it_tests: "At-most-once against at-least-once."
    strong_points:
      - "Before: no duplicates, but a crash loses the message."
      - "After: nothing is lost, but duplicates happen, so dedupe."
  - type: technical
    question: "Where do you record that a message was already handled?"
    what_it_tests: "Dedupe storage that is atomic with the side effect."
    strong_points:
      - "A processed-messages table with a unique key, written in the same transaction as the business change."
      - "For external calls, pass an idempotency key to the provider."
  - type: failure
    question: "Your dedupe table insert succeeds, then the email provider call fails. What now?"
    what_it_tests: "Ordering of record and side effect, and retries after partial failure."
    strong_points:
      - "Record intent and status: pending, then sent."
      - "Retry pending sends with the provider's idempotency key so a retry cannot double-send."
rejection_signals:
  - "Believes broker settings alone give exactly-once side effects."
  - "Dedupes in memory on a single consumer instance."
answer_framework:
  - "Queues deliver at least once; duplicates are normal."
  - "Make the consumer idempotent with a stored message key."
  - "Pass idempotency keys to external providers too."
model_answer: "Most queues deliver at least once. The consumer sent the email, then crashed or ran past its visibility timeout before acknowledging, so the message was delivered again. Exactly-once settings on the broker do not cover an email leaving the system, so the consumer has to be idempotent. I'd give each message a stable key, record it in a table with a unique constraint, and record the send status. If the key already shows 'sent', the consumer acknowledges and moves on. For the provider call, I'd pass the same key as an idempotency key so even a retry after a partial failure sends one email."
self_check:
  - "Can you list two ways a message gets delivered twice?"
  - "Can you explain why dedupe in memory fails with several consumers?"
sources:
  - "https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html"
  - "https://microservices.io/patterns/communication-style/idempotent-consumer.html"
concepts: [message-queues, idempotency]
reviewed: false
---
