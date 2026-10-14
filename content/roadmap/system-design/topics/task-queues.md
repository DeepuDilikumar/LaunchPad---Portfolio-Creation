---
id: task-queues
title: Task queues
section: async
why_here: "Some jobs are heavy: image resizing, PDF builds, emails."
summary: A task queue runs functions in the background with retries, scheduling and result tracking, like Celery or Sidekiq. The web request just enqueues the job and returns. Keep tasks idempotent, because retries will run some of them twice.
cloud: background-jobs
questions:
  - text: Users upload profile photos that must be resized into three sizes. How do you design the processing?
    weak_answer: Resize the image inside the upload API.
    red_note: the request hangs
    follow_ups:
      - type: failure
        text: The worker crashes after resizing but before acknowledging. What happens?
      - type: tradeoff
        text: Retry forever, or give up after a few attempts?
      - type: measurement
        text: How do you know workers are keeping up?
      - type: ownership
        text: Who looks at tasks that land in the dead-letter queue?
    strong_moves:
      - Store the original, enqueue a task with the photo ID, and return straight away.
      - Write each size to a fixed key, so a retried task simply overwrites the same files.
      - Retry with back-off, cap the attempts, and send failures to a dead-letter queue.
    asked_in: HLD round · SDE-1/SDE-2
  - text: A worker processed the same message twice, and a customer got two refunds. Why, and how do you stop it?
    free: false
    guide_ref: be-queue-002
self_check:
  - Can you explain why task retries make idempotency necessary?
  - Can you say when a task belongs in a queue rather than the request?
reviewed: false
---
