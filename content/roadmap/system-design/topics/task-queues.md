---
id: task-queues
title: Task queues
section: async
why_here: "Some jobs are heavy: image resizing, PDF builds, emails."
summary: A task queue runs functions in the background with retries, scheduling and result tracking, like Celery or Sidekiq. The web request just enqueues the job and returns. Keep tasks idempotent, because retries will run some of them twice.
cloud: background-jobs
reviewed: false
---
