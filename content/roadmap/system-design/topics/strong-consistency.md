---
id: strong-consistency
title: Strong consistency
section: availability-vs-consistency
why_here: Some reads must always see the latest write.
summary: With strong consistency every read sees the most recent committed write, as if there were one copy. It needs coordination, such as a single leader or a consensus protocol, so writes are slower and the system may refuse requests during a network split. Use it for balances, inventory and anything with money.
key_tradeoff: Correctness first, at the cost of latency and availability during failures.
reviewed: false
---
