---
id: scheduled-jobs
title: Scheduled jobs
section: async
why_here: Some work runs on a clock, not on a request.
summary: "Scheduled jobs run at fixed times: nightly reports, cleanup, reconciliation. Make them idempotent and safe to run twice, and make sure two instances can't run the same job at once. Alert when a job fails or simply doesn't run."
cloud: background-jobs
questions:
  - text: A nightly job settles merchant payouts. You run three app servers. How do you stop it running three times?
    weak_answer: Run the cron on only one server.
    red_note: and when that server dies?
    follow_ups:
      - type: failure
        text: The job crashes halfway through the payouts. What happens on the rerun?
      - type: technical
        text: How does a lock know its holder has died?
      - type: measurement
        text: How would you notice that the job simply didn't run?
      - type: ownership
        text: Who gets paged when settlement is late?
    strong_moves:
      - Trigger it from one scheduler, and take a lock with an expiry so only one instance runs.
      - Make each payout idempotent with a key per merchant and date, so reruns are safe.
      - Record each run's start and finish, and alert when a run is missing, not only when it fails.
    asked_in: Technical deep dive · SDE-2 · often after “design payment settlement”
  - text: The nightly job now takes nine hours and overlaps the next run. What do you change?
    free: false
self_check:
  - Can you explain how to make a scheduled job safe to run twice?
  - Can you describe how you'd detect a job that never started?
india_note: "Common in fintech and payments interviews, where nightly settlement and reconciliation jobs are everyday work."
reviewed: false
---
