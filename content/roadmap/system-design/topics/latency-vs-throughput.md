---
id: latency-vs-throughput
title: Latency vs throughput
section: numbers
why_here: Before you can make something faster, you need to know which kind of fast matters.
summary: "Latency is how long one request takes. Throughput is how many requests finish per second. They are related but not the same: batching raises throughput and often hurts latency; adding servers raises throughput without making one request faster. Say which one the product cares about before you optimise anything."
key_tradeoff: Batching for throughput costs latency for each item.
questions:
  - text: Your UPI notification service sends 5,000 messages per second, but each takes 3 seconds to arrive. Is that a problem?
    weak_answer: Throughput is high, so it's fine.
    red_note: fine for whom?
    follow_ups:
      - type: technical
        text: You batch 500 messages per send. How long does the first message in a batch wait?
      - type: tradeoff
        text: "Bigger batches or more workers: which do you pick, and why?"
      - type: measurement
        text: Which two numbers go on the dashboard?
      - type: failure
        text: Traffic doubles on a sale day. Which number breaks first?
    strong_moves:
      - Say which one the user feels. A payment alert needs low latency; a nightly report needs throughput.
      - Batching raises throughput but makes each item wait, so cap batch size and wait time.
      - Track p99 latency and messages per second separately; latency climbs fast as throughput nears capacity.
    asked_in: Technical deep dive · SDE-2
  - text: The queue grows overnight even though consumers look busy. What do you check?
    free: false
    guide_ref: be-queue-001
self_check:
  - Can you give an example where higher throughput made latency worse?
  - Can you explain why latency rises sharply as a server nears full utilisation?
reviewed: false
---
