---
id: be-obs-002
guide: backend
module: observability
title: "A request is slow somewhere across five services. How do you find where?"
rounds: [technical-deep-dive, production-experience]
seniority: ["2-4", "4-8"]
intent: "Distributed tracing, context propagation and sampling."
weak_answer: "Check the logs of each service one by one."
why_it_fails: "Five separate log searches can't show where the time went in one request without a shared request ID and timings."
red_note: "logs can't add up the time"
follow_ups:
  - type: technical
    question: "What has to travel with the request for tracing to work?"
    what_it_tests: "Trace context propagation."
    strong_points:
      - "A trace ID and parent span ID in headers, for example W3C traceparent."
      - "Every hop, including queues, must pass it on."
  - type: failure
    question: "The trace has a gap where a message went through a queue. Why?"
    what_it_tests: "Propagating context across async boundaries."
    strong_points:
      - "The trace context must be written into message headers and read by the consumer."
  - type: tradeoff
    question: "You can't keep every trace. How do you sample?"
    what_it_tests: "Head against tail sampling."
    strong_points:
      - "Head sampling is cheap but may drop the slow requests you care about."
      - "Tail sampling keeps slow and failed traces but needs a collector to buffer."
  - type: measurement
    question: "The trace shows 800 ms in one span with no child spans. What next?"
    what_it_tests: "Moving from tracing to profiling or finer spans."
    strong_points:
      - "Add finer spans or use a profiler on that code path."
      - "Check for lock waits, pool waits or GC in that window."
rejection_signals:
  - "Searches logs per service with no correlation ID."
  - "Doesn't know how context crosses a queue."
answer_framework:
  - "Use distributed tracing with propagated context."
  - "Read the trace for the widest span, then drill in."
  - "Sample so slow and failed traces are always kept."
model_answer: "I'd use distributed tracing. Each service propagates a trace ID and parent span ID in headers, so a request becomes one tree of timed spans across all five services. Opening the trace for a slow request shows which span holds the time. If it's a span with no children, I'd add finer spans or profile that path, and look for waits on locks, pools or GC. Context has to cross queues too, so producers write it into message headers. For cost, I'd use tail sampling so every slow or failed trace is kept even if most fast ones are dropped."
self_check:
  - "Can you explain what traceparent carries?"
  - "Can you explain why head sampling can miss the slow requests?"
sources:
  - "https://opentelemetry.io/docs/concepts/signals/traces/"
  - "https://www.w3.org/TR/trace-context/"
concepts: [tracing]
reviewed: false
---
