---
id: weak-consistency
title: Weak consistency
section: availability-vs-consistency
why_here: Some data is fine to lose or see late.
summary: With weak consistency a read after a write may or may not see it, and nobody promises when. That suits live video, game positions and metrics where the next update replaces the last. It is the cheapest and fastest option, and wrong for anything users will check later, like money or messages.
questions:
  - text: A live cricket score feed serves millions of viewers. Does every viewer need the exact latest score?
    weak_answer: Yes, use strong consistency so everyone is correct.
    red_note: for a score ticker?
    follow_ups:
      - type: tradeoff
        text: What do you gain by letting some viewers lag a few seconds?
      - type: failure
        text: One score update is lost. What does the viewer see, and does it matter?
      - type: technical
        text: Which parts of the same app still need stronger guarantees?
      - type: measurement
        text: How do you check viewers aren't lagging too far behind?
    strong_moves:
      - "Ask what a stale read costs: here the next update replaces it within seconds."
      - Use cheap fan-out like pub/sub or a CDN, and accept late or lost updates.
      - Keep stronger guarantees for what users check later, such as payments or contest entries.
    asked_in: HLD round · SDE-2 · often in live-feed or streaming designs
  - text: Your analytics counters lose a few events during every deploy. Is that a bug, and who decides?
    free: false
self_check:
  - Can you name three kinds of data where weak consistency is fine?
  - Can you say why it is wrong for chat messages?
india_note: "Live cricket scores and live streams are a natural Indian example for this, and interviewers often reach for them."
reviewed: false
---
