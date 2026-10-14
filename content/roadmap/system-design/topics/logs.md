---
id: logs
title: Logs
section: monitoring
why_here: When something breaks, you need the story of what happened.
summary: Logs record individual events with context. Structured logs (JSON with fields) can be searched and aggregated. Include a request ID in every line so one user's journey can be followed across services. Never log secrets or full card numbers.
cloud: monitoring
questions:
  - text: A customer says their UPI payment failed around 3 p.m. How do you find out what happened from the logs?
    weak_answer: Grep the server logs for errors.
    red_note: on which of forty pods?
    follow_ups:
      - type: technical
        text: Which fields does every log line need?
      - type: failure
        text: Log shipping falls behind during the incident. What do you do?
      - type: tradeoff
        text: Log every request at info level, or sample?
      - type: ownership
        text: Someone logged full card numbers. Who finds it, and what happens next?
    strong_moves:
      - Write structured JSON logs with a request ID, user ID and payment ID on every line.
      - Ship them to a central store, so you search one place instead of each server.
      - Set retention and sampling by level, and mask secrets and card data at the source.
    asked_in: Technical deep dive · SDE-2
  - text: Your logging bill tripled this month. How do you cut it without losing what you need in an incident?
    free: false
self_check:
  - Can you list the fields a useful log line carries?
  - Can you follow one request across services using its ID?
reviewed: false
---
