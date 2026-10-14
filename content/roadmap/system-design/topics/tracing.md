---
id: tracing
title: Tracing
section: monitoring
why_here: A slow request crosses five services; which one is slow?
summary: Distributed tracing follows one request across services as a tree of timed spans, linked by a trace ID passed in headers. It shows where time actually goes. Sample to control cost, but keep slow and failed traces.
cloud: tracing
questions:
  - text: You're adding distributed tracing to a dozen services. What must each service do, and what does it cost?
    weak_answer: Install the tracing agent everywhere.
    red_note: and across the queue?
    follow_ups:
      - type: technical
        text: How does the trace ID cross a message queue between two services?
      - type: tradeoff
        text: Trace every request, or sample?
      - type: failure
        text: Sampling dropped the slow requests you needed. How do you fix that?
      - type: measurement
        text: The trace shows gaps between spans. What could be hiding in them?
    strong_moves:
      - Pass the trace ID in request headers and message metadata, and record a timed span per hop.
      - Read a trace as a tree, and look for the longest span on the critical path.
      - Sample normal traffic, but keep every slow or failed trace with tail-based sampling.
    asked_in: Technical deep dive · SDE-2 · often after “p99 went up”
  - text: One request is slow, and it passes through five services. How do you find which one is slow?
    free: false
    guide_ref: be-obs-002
self_check:
  - Can you explain how a trace ID is propagated between services?
  - Can you say why head-based sampling can miss the traces you need?
reviewed: false
---
