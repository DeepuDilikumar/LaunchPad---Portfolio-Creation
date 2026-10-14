---
id: strong-consistency
title: Strong consistency
section: availability-vs-consistency
why_here: Some reads must always see the latest write.
summary: With strong consistency every read sees the most recent committed write, as if there were one copy. It needs coordination, such as a single leader or a consensus protocol, so writes are slower and the system may refuse requests during a network split. Use it for balances, inventory and anything with money.
key_tradeoff: Correctness first, at the cost of latency and availability during failures.
questions:
  - text: Your wallet app reads balances from a replica. A user pays, refreshes, and sees the old balance. Do you fix it?
    weak_answer: Use a strongly consistent database.
    red_note: which reads? at what cost?
    follow_ups:
      - type: technical
        text: Which reads must go to the leader, and which can stay on replicas?
      - type: tradeoff
        text: Strong reads everywhere add latency. What do you accept, and where?
      - type: failure
        text: The network splits between leader and replicas. What should the wallet do?
      - type: measurement
        text: How would you measure how stale your replicas are?
    strong_moves:
      - "Find the reads that must be current: the balance checked before a payment, not old transaction history."
      - Send those reads to the leader, and give the paying user read-your-writes.
      - During a split, refuse the payment rather than allow an overspend, and say so aloud.
    asked_in: HLD round · SDE-2 · often in payments or wallet designs
  - text: Two users booked the last seat on the same train. How did that happen, and how do you stop it?
    free: false
    guide_ref: be-db-001
self_check:
  - Can you explain what “every read sees the latest write” costs during a network split?
  - Can you list which data in a shopping app needs strong consistency?
reviewed: false
---
