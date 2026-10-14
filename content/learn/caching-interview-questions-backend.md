---
slug: caching-interview-questions-backend
title: "Caching interview questions for backend developers: beyond 'use Redis'"
description: "A cache stampede question, the three follow-ups interviewers ask, and an outline of a strong answer."
keywords:
  [
    "caching interview questions",
    "redis interview questions for experienced",
    "cache stampede interview question",
  ]
published: "2026-10-13"
updated: "2026-10-13"
guide: backend
module: caching
primary: "A popular cache key expires and database load spikes for about a minute. What's happening?"
follow_ups:
  - type: technical
    question: "How do you make only one request rebuild the value?"
    what_it_tests: "Request coalescing in-process, and a short lock across instances."
  - type: tradeoff
    question: "Serve stale data while you refresh, or make users wait?"
    what_it_tests: "Weighing freshness against latency for this particular data."
  - type: technical
    question: "Many keys were written at once and all expire together. How do you fix that?"
    what_it_tests: "Adding jitter to expiry times and refreshing hot keys early."
outline:
  - "Name it: a cache stampede, where many requests miss the same key at once."
  - "Confirm it by lining up the hit-ratio drop with the database spike."
  - "Let one request rebuild; others wait briefly or get the stale value."
  - "Spread expiry with jitter and refresh the hottest keys before they expire."
---

"Use Redis" is where caching answers start, not where they end. Interviewers ask about the moments a cache makes things worse: when a hot key expires, when stale data sticks around, or when the cache itself goes down.

## Why this question works so well

It sounds like a database problem, so many candidates reach for a bigger instance. The follow-ups check whether you can see that the database is fine at normal load and the problem is the pattern of misses.

## How to practise this

Pick the hottest key in a system you've worked on. What happens when it expires at peak traffic? Answer each follow-up for that key specifically.
