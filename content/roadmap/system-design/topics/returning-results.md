---
id: returning-results
title: Returning results
section: async
why_here: If work happens later, the user still needs the answer.
summary: "Background work needs a way back to the user: polling a status endpoint, a webhook, a push notification or a WebSocket message. Return a job ID right away, store the result, and let the client ask or be told. Say what the user sees while they wait."
questions:
  - text: Generating a GST invoice PDF takes about 40 seconds. How does the user get it?
    weak_answer: Increase the request timeout.
    red_note: the user is still staring
    follow_ups:
      - type: technical
        text: "Polling, webhook or WebSocket: which one here, and why?"
      - type: failure
        text: The job finishes but the user has closed the app. What happens?
      - type: tradeoff
        text: How often should the client poll, and what does that cost?
      - type: measurement
        text: How would you know jobs are stuck in “pending”?
    strong_moves:
      - Return 202 with a job ID straight away, and keep the job's status in a table.
      - The client polls a status endpoint with back-off, or gets a push when the job is done.
      - Store the result with an expiry, and show the user a clear “preparing” state meanwhile.
    asked_in: Technical deep dive · SDE-2
  - text: A user taps “download report” three times and three jobs start. How do you stop duplicate jobs?
    free: false
self_check:
  - Can you sketch the request, job ID and status flow end to end?
  - Can you say when polling beats a WebSocket?
reviewed: false
---
