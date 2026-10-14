---
id: cap-pacelc
title: CAP and PACELC
section: availability-vs-consistency
why_here: Once data lives on several machines, a network split forces a choice.
summary: "When the network splits, a system can either keep answering (and maybe return stale data) or refuse until the copies agree. That is CAP: during a partition, pick availability or consistency. PACELC adds the everyday case: even without a partition, you trade latency for consistency. Say which side each part of your design takes."
key_tradeoff: Answering now with old data versus waiting for the right answer.
flow:
  nodes:
    - label: Node A
    - label: network split
      bad: true
    - label: Node B
  note: answer now, or answer right?
questions:
  - text: Your service runs in two regions and the link between them goes down. What should a read in each region return?
    weak_answer: CAP says pick two, so I'd pick consistency and availability.
    red_note: you can't skip P
    follow_ups:
      - type: tradeoff
        text: For a shopping cart, would you keep serving or refuse? For a bank balance?
      - type: failure
        text: Both regions took writes during the split. How do you merge them?
      - type: measurement
        text: How do you know a partition is happening right now?
      - type: ownership
        text: Who decides which side of CAP each feature takes?
    strong_moves:
      - Partitions will happen, so the real choice is availability or consistency during one.
      - "Choose per feature: a cart can be stale, a balance can't."
      - "PACELC: even without a partition you trade latency for consistency, so say that too."
    asked_in: HLD round · SDE-2 · often after you add a second region
  - text: Explain how a leader election avoids two leaders after a network split.
    free: false
self_check:
  - Can you explain CAP without saying "pick two"?
  - Can you give one feature that should be AP and one that should be CP?
reviewed: false
---
