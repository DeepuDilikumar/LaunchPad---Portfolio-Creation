---
id: performance-vs-scalability
title: Performance vs scalability
section: scaling
why_here: Fast for one user is not the same as fast for a million.
summary: "A performance problem means the system is slow even for a single user. A scalability problem means it is fast for one user but slows down as load grows. The fixes differ: profiling and better algorithms for the first, more machines and less shared state for the second. Name which one you have."
questions:
  - text: Search is slow for every user, even at 2 a.m. The team wants to add more servers. Do you agree?
    weak_answer: Yes, scale horizontally behind a load balancer.
    red_note: slow at 2 a.m. too?
    follow_ups:
      - type: measurement
        text: How do you prove it's a performance problem and not a load problem?
      - type: technical
        text: The query does a full table scan. What do more servers change?
      - type: tradeoff
        text: When is buying more servers cheaper than fixing the code?
      - type: failure
        text: After the fix, search is fast but slows down at the 9 p.m. peak. What now?
    strong_moves:
      - Slow with one user is a performance problem; slow only under load is a scalability problem.
      - Profile one request first and look for full scans, N+1 queries or a slow external call.
      - Add machines only once a single request is fast and load is what hurts.
    asked_in: Technical deep dive · SDE-2
  - text: An endpoint got slower over a few weeks with no deploy. How do you find out why?
    free: false
    guide_ref: be-perf-002
self_check:
  - Can you tell a performance problem from a scalability problem with one test?
  - Can you name a typical fix for each?
reviewed: false
---
