---
id: message-queues
title: Message queues
section: async
why_here: Work that takes time shouldn't hold up the user's request.
summary: A message queue stores work items until a consumer is ready to process them. The producer replies to the user straight away; consumers work through the queue at their own pace and can be scaled separately. Most queues deliver at least once, so consumers must handle duplicates.
key_tradeoff: Fast responses and smoothing spikes versus eventual completion and duplicates.
cloud: queue
flow:
  nodes:
    - label: API
    - label: Queue
    - label: Workers
      bad: true
  note: reply now, work later
questions:
  - text: Sending the order confirmation email makes checkout slow. How would you fix it?
    weak_answer: Use a faster email provider.
    red_note: the user shouldn't wait at all
    follow_ups:
      - type: failure
        text: The worker sends the email, then crashes before acknowledging. What happens?
      - type: tradeoff
        text: Acknowledge before or after sending?
      - type: measurement
        text: How would you know emails are falling behind?
      - type: ownership
        text: Who handles messages that fail forever?
    strong_moves:
      - "Take the email off the request path: enqueue a job and return."
      - Workers send it with retries; the queue delivers at least once, so dedupe on an ID.
      - Alert on the age of the oldest message and keep a dead-letter queue.
    asked_in: HLD round · SDE-1/SDE-2
  - text: The queue keeps growing overnight while consumers look healthy. What's happening?
    free: false
    guide_ref: be-queue-001
self_check:
  - Can you explain at-least-once delivery?
  - Can you say why consumers must be idempotent?
reviewed: false
---
