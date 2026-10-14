---
id: latency-numbers
title: Latency numbers to know
section: numbers
why_here: Estimates only work if you know roughly what each step costs.
summary: Memory is about 100 nanoseconds, an SSD read about 100 microseconds, a round trip inside a data centre about half a millisecond, and India to the US about 200 milliseconds. Disk seeks and cross-region calls dominate everything else. Knowing these orders of magnitude tells you where time will go before you measure.
questions:
  - text: A checkout API makes three database calls and one call to a payment gateway in another region. Roughly how long should it take?
    weak_answer: A few milliseconds, the servers are fast.
    red_note: guess or estimate?
    follow_ups:
      - type: technical
        text: Where does most of that time go, and why?
      - type: tradeoff
        text: Cache the user profile in process memory or in Redis? What does each cost in latency?
      - type: measurement
        text: How would you check your estimate against real traffic?
      - type: failure
        text: The gateway call now takes 2 seconds. What happens to your request threads?
    strong_moves:
      - "Add it up: same-data-centre database calls about 1 ms each, the cross-region call 50 to 200 ms."
      - "The cross-region hop dominates, so attack it first: parallelise, move closer, or make it async."
      - Confirm with tracing, then set timeouts from these numbers, not guesses.
    asked_in: Technical deep dive · SDE-2 · often after a back-of-envelope estimate
  - text: A request crosses five services and is slow end to end. How do you find which hop costs the time?
    free: false
    guide_ref: be-obs-002
self_check:
  - Can you list memory, SSD, same-data-centre and cross-continent latency from memory?
  - Can you say which step dominates a request before measuring?
reviewed: false
---
