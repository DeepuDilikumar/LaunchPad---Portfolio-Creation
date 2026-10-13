---
slug: system-design-interview-questions-5-years-experience
title: "System design interview questions for 5 years of experience: what changes"
description: "At around 5 years, design rounds shift from drawing boxes to defending trade-offs. One question, three follow-ups, and a strong-answer outline."
keywords:
  [
    "system design interview questions for 5 years experience",
    "system design interview mid level",
    "rate limiter system design interview",
  ]
published: "2026-10-13"
updated: "2026-10-13"
guide: backend
module: design-shorts
primary: "Design a rate limiter for a public API. You have ten minutes."
follow_ups:
  - type: technical
    question: "You run twenty instances. Where does the count live?"
    what_it_tests: "Shared state across instances and atomic updates, for example a small script in Redis."
  - type: failure
    question: "The store holding your counters goes down. Do you allow or block every request?"
    what_it_tests: "Choosing fail-open or fail-closed per endpoint, and saying why."
  - type: technical
    question: "What does a limited client actually see?"
    what_it_tests: "HTTP 429, a Retry-After header, and headers showing the remaining quota."
outline:
  - "Clarify the key (API key, user or IP) and the limit before drawing anything."
  - "Pick an algorithm and say why: a token bucket allows short bursts at a steady rate."
  - "Keep the bucket in a shared store and update it atomically."
  - "Decide fail-open or fail-closed per endpoint, and return 429 with Retry-After."
---

With around five years of experience, the design round changes. Interviewers expect you to have run systems in production, so they spend less time on the diagram and more on the decisions: why this algorithm, where the state lives, and what happens when a piece fails.

## What the follow-ups are really checking

Each follow-up below checks one decision. A diagram with a box labelled "rate limiter" passes the first minute; the follow-ups find out whether you've thought about many instances, failure, and the client's experience.

## How to practise this

Time yourself: two minutes to clarify, five to design, three for failure modes. Then answer the follow-ups out loud without notes.
