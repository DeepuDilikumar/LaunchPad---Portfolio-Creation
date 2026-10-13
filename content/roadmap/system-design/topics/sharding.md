---
id: sharding
title: Sharding
section: databases
why_here: One database server can't hold or handle everything.
summary: "Sharding splits data across several databases by a key, like user ID. Each shard holds part of the data and takes part of the load. Choosing the key is the whole game: a bad key creates hot shards, and queries across shards get slow and complex."
key_tradeoff: Near-unlimited scale versus cross-shard queries and rebalancing pain.
cloud: sharding
flow:
  nodes:
    - label: user_id
    - label: hash % N
    - label: Shard 3
      bad: true
  note: one celebrity → one hot shard
questions:
  - text: Your orders table has outgrown one database. How would you shard it?
    weak_answer: Split it by order ID across 4 servers.
    red_note: then how do you list a user's orders?
    follow_ups:
      - type: tradeoff
        text: Shard by user ID or by order ID? What does each make slow?
      - type: failure
        text: One seller gets 30% of all orders. What happens to their shard?
      - type: measurement
        text: How do you know when to add shards?
      - type: ownership
        text: How would you move data to new shards without downtime?
    strong_moves:
      - "Pick the key from the main query: listing a user's orders means shard by user ID."
      - Watch for hot keys; use consistent hashing so adding a shard moves little data.
      - Plan cross-shard queries, like seller reports, through a separate read store.
    asked_in: HLD round · SDE-2/SDE-3
  - text: Explain consistent hashing and what virtual nodes add.
    free: false
self_check:
  - Can you explain why the shard key decides everything?
  - Can you describe a hot shard and one fix?
reviewed: false
---
