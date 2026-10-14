---
slug: idempotency-interview-questions
title: "Idempotency interview questions: the double-charge question and its follow-ups"
description: '"A customer was charged twice" is one of the most common payment interview questions. Here are the follow-ups and what a strong answer covers.'
keywords:
  [
    "idempotency interview questions",
    "payment system interview questions",
    "idempotency key interview",
  ]
published: "2026-10-13"
updated: "2026-10-13"
guide: backend
module: payments-and-idempotency
primary: "A customer was charged twice for one order. Walk me through why."
follow_ups:
  - type: failure
    question: "The gateway charged the card but your service never got the response. What does your service do next?"
    what_it_tests: "Treating a timeout as an unknown outcome, and checking status before retrying."
  - type: tradeoff
    question: "The same idempotency key arrives with a different amount. What should the server do?"
    what_it_tests: "Binding the key to a hash of the request, and rejecting a mismatch."
  - type: measurement
    question: "How would you prove duplicate charges have stopped?"
    what_it_tests: "Reconciling gateway settlements against orders and alerting on duplicates."
outline:
  - "A timeout means the outcome is unknown, not that the call failed."
  - "Every charge carries an idempotency key created once per order attempt."
  - "Store the key with a hash of the request; replay the stored result for a match, reject a mismatch."
  - "Reconcile daily so any duplicate that slips through is found and refunded."
---

Payment questions are a favourite in backend interviews because they combine networking, databases and money. The first answer usually blames retries. The follow-ups test whether you understand why a retry was unsafe in the first place.

## The idea underneath every follow-up

A request that times out may have succeeded. Everything else follows from that: you need a way to retry safely (idempotency keys), a way to detect misuse of the key (request hashing), and a way to catch whatever still slips through (reconciliation).

## How to practise this

Explain the idempotency key table out loud: its columns, its unique constraint, and what happens when two requests with the same key arrive at the same moment.
