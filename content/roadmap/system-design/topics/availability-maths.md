---
id: availability-maths
title: Availability maths
section: availability-patterns
why_here: '"Highly available" means nothing until you put a number on it.'
summary: 99.9% availability allows about 8 hours 46 minutes of downtime a year; 99.99% allows about 52 minutes. Components in sequence multiply their availability, so a chain gets weaker. Components in parallel combine as 1 − (1 − a)², so redundancy gets stronger. Use this to say why you added a replica.
questions:
  - text: Your API, cache and database each have 99.9% availability. What is the availability of a request that needs all three?
    weak_answer: 99.9%, since each part is 99.9%.
    red_note: a chain multiplies
    follow_ups:
      - type: technical
        text: You add a second database in parallel. What does the database layer's availability become?
      - type: tradeoff
        text: Going from 99.9% to 99.99% costs what, in money and complexity?
      - type: measurement
        text: Do you measure availability with uptime pings or with successful requests?
      - type: failure
        text: Both database copies sit behind one network switch. Does your parallel maths still hold?
    strong_moves:
      - "In series, multiply: 0.999 cubed is about 99.7%, roughly 26 hours down a year."
      - "In parallel, use 1 − (1 − a)²: two 99.9% copies give about 99.9999%, if failures are independent."
      - Shared dependencies break that independence, so name them before claiming the number.
    asked_in: HLD round · SDE-2 · often after “how available is your design?”
  - text: A slow downstream service took your whole API down, though it never fully failed. How?
    free: false
    guide_ref: be-rel-001
self_check:
  - Can you turn 99.9% and 99.99% into downtime per year?
  - Can you compute availability for parts in series and in parallel?
reviewed: false
---
