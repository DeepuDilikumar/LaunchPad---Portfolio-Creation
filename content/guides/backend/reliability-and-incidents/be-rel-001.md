---
id: be-rel-001
guide: backend
module: reliability-and-incidents
title: "One slow downstream service took your whole API down. Walk me through how."
rounds: [technical-deep-dive, production-experience]
seniority: ["2-4", "4-8"]
intent: "Resource exhaustion, timeouts, bulkheads and circuit breakers."
weak_answer: "The downstream service was down, so we were down."
why_it_fails: "Slow is worse than down. Slow calls hold threads and connections until nothing is left for healthy endpoints."
red_note: "slow is worse than down"
flow:
  nodes:
    - { label: "Your API" }
    - { label: "thread pool", bad: true }
    - { label: "Slow service" }
  note: "every thread waiting"
follow_ups:
  - type: technical
    question: "Why did endpoints that never call that service fail too?"
    what_it_tests: "Shared pools and resource exhaustion."
    strong_points:
      - "All endpoints shared one thread or connection pool."
      - "Slow calls filled the pool, so unrelated requests queued and timed out."
  - type: technical
    question: "What timeout would you set, and how do you pick it?"
    what_it_tests: "Timeouts from latency data and the caller's budget."
    strong_points:
      - "Base it on the dependency's p99 plus headroom, within the caller's own deadline."
      - "Propagate deadlines so downstream work stops when the caller has given up."
  - type: tradeoff
    question: "Circuit breaker: what does it give you, and what does it cost?"
    what_it_tests: "Failing fast against rejecting requests that might succeed."
    strong_points:
      - "It stops sending calls to a failing dependency and frees resources."
      - "Needs a fallback, and badly tuned thresholds flap."
  - type: ownership
    question: "What did you change after the incident?"
    what_it_tests: "Concrete follow-up actions."
    strong_points:
      - "Separate pools per dependency (bulkheads), timeouts on every call, and a fallback for the non-critical feature."
rejection_signals:
  - "No timeouts mentioned."
  - "Treats slow and down as the same failure."
answer_framework:
  - "Slow calls exhausted a shared pool."
  - "Timeouts on every call, sized from data."
  - "Isolate with bulkheads, fail fast with a breaker, degrade gracefully."
model_answer: "The dependency didn't fail, it got slow. Each call to it held a thread and a connection for its full duration, and because every endpoint shared the same pool, the pool filled with waiting calls. Healthy endpoints then queued behind them and timed out, so the whole API looked down. I'd fix it in layers: a timeout on every outbound call based on the dependency's p99, separate pools per dependency so one can't starve the rest, a circuit breaker to fail fast once errors pass a threshold, and a fallback so the page renders without the non-critical feature."
self_check:
  - "Can you explain why slow is worse than down?"
  - "Can you say how you'd choose a timeout value?"
sources:
  - "https://sre.google/sre-book/addressing-cascading-failures/"
  - "https://martinfowler.com/bliki/CircuitBreaker.html"
concepts: [health-checks, microservices]
reviewed: false
---
