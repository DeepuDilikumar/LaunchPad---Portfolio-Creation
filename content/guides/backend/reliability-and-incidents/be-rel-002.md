---
id: be-rel-002
guide: backend
module: reliability-and-incidents
title: "Your retries made the outage worse. Why?"
rounds: [technical-deep-dive, production-experience]
seniority: ["2-4", "4-8"]
intent: "Retry amplification, backoff with jitter and retry budgets."
weak_answer: "We retried three times, which is standard."
why_it_fails: "Three retries at each of three layers is up to 64 calls for one user request, all landing on a service that's already struggling."
red_note: "3 retries × 3 layers"
follow_ups:
  - type: technical
    question: "How do retries multiply across layers?"
    what_it_tests: "Retry amplification maths."
    strong_points:
      - "Each layer multiplies attempts: with 4 attempts per layer across 3 layers, one request can become 64 calls."
      - "Retry at one layer only, usually the one closest to the user or the caller with context."
  - type: technical
    question: "What does jitter add to exponential backoff?"
    what_it_tests: "Avoiding synchronised retry waves."
    strong_points:
      - "Without jitter, clients that failed together retry together."
      - "Random jitter spreads retries out so the service can recover."
  - type: tradeoff
    question: "Which errors should never be retried?"
    what_it_tests: "Retryable against permanent errors, and idempotency."
    strong_points:
      - "Don't retry validation errors or most 4xx."
      - "Don't retry non-idempotent calls unless they carry an idempotency key."
      - "Honour Retry-After on 429 and 503."
  - type: measurement
    question: "How would a retry budget work?"
    what_it_tests: "Capping retries as a fraction of traffic."
    strong_points:
      - "Allow retries only up to a set share of requests, for example 10%."
      - "When the budget is spent, fail fast instead of retrying."
rejection_signals:
  - "Retries at every layer with no backoff."
  - "Retries non-idempotent calls without keys."
answer_framework:
  - "Retries multiply across layers and pile onto a struggling service."
  - "Retry at one layer, with exponential backoff and jitter."
  - "Only retry safe errors, and cap retries with a budget."
model_answer: "Retries are extra load at the worst moment. If the gateway, the service and the client library each retry three times, one user request can turn into dozens of calls on a dependency that's already overloaded, which keeps it from recovering. I'd retry at one layer only, with exponential backoff and jitter so clients don't retry in waves, and only for errors that are temporary and calls that are idempotent. I'd also add a retry budget, so retries can never exceed a small share of normal traffic, and respect Retry-After headers."
self_check:
  - "Can you compute the call count for 3 layers with 3 retries each?"
  - "Can you name an error you'd never retry?"
sources:
  - "https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/"
  - "https://sre.google/sre-book/handling-overload/"
concepts: [back-pressure, idempotency]
reviewed: false
---
