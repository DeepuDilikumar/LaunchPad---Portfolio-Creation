---
id: be-dsn-001
guide: backend
module: design-shorts
title: "Design a rate limiter for a public API. You have ten minutes."
rounds: [system-design]
seniority: ["2-4", "4-8"]
intent: "Algorithm choice, shared state across instances and client behaviour."
weak_answer: "Keep a counter per user in memory and reject after 100 requests a minute."
why_it_fails: "Each instance keeps its own counter, so limits multiply with instance count, and a fixed window allows double bursts at the boundary."
red_note: "which instance holds the count?"
follow_ups:
  - type: technical
    question: "Fixed window, sliding window or token bucket?"
    what_it_tests: "Algorithm trade-offs."
    strong_points:
      - "Fixed windows allow up to twice the limit across a boundary."
      - "Token bucket allows controlled bursts and a steady refill rate."
      - "Sliding window log is exact but memory-hungry; sliding counter approximates it cheaply."
  - type: technical
    question: "You run twenty instances. Where does the count live?"
    what_it_tests: "Shared state and atomic updates."
    strong_points:
      - "A shared store like Redis, updated atomically with a script or INCR plus expiry."
      - "Or local limits with a share of the global budget, accepting some error."
  - type: failure
    question: "Redis is down. Do you allow or block all requests?"
    what_it_tests: "Fail open against fail closed."
    strong_points:
      - "Usually fail open with a local fallback limit, so a limiter outage isn't a full outage."
      - "Fail closed for abuse-sensitive endpoints like login."
  - type: technical
    question: "What does the client see when it's limited?"
    what_it_tests: "Good API behaviour under limits."
    strong_points:
      - "HTTP 429 with a Retry-After header and rate-limit headers showing remaining quota."
rejection_signals:
  - "Keeps counters in local memory without discussing multiple instances."
  - "Never considers what happens when the limiter's store fails."
answer_framework:
  - "Pick the algorithm and say why: token bucket for bursts."
  - "Share state atomically across instances."
  - "Decide fail-open or fail-closed, and return 429 with Retry-After."
model_answer: "I'd clarify the key (API key, user or IP) and the limit, then pick a token bucket: it allows short bursts while enforcing a steady rate. With many instances, the bucket lives in Redis and is updated atomically, for example with a small Lua script that refills and takes a token in one step. Limited requests get a 429 with Retry-After and headers showing the remaining quota. If Redis is unavailable, most endpoints fail open with a conservative local limit, while login and OTP endpoints fail closed."
self_check:
  - "Can you explain the double-burst problem with fixed windows?"
  - "Can you say when to fail open and when to fail closed?"
sources:
  - "https://datatracker.ietf.org/doc/html/rfc6585"
  - "https://redis.io/docs/latest/develop/interact/programmability/eval-intro/"
concepts: [rate-limiting]
reviewed: false
---
