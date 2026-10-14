---
id: wide-column
title: Wide-column stores
section: databases
why_here: Huge write volumes need a store built to spread them.
summary: Wide-column stores like Cassandra or Bigtable group data by a partition key and sort rows within it. They take enormous write volumes and scale across many machines. Queries must follow the key design closely; ad hoc queries are expensive or impossible.
cloud: wide-column
questions:
  - text: A messaging app stores billions of chat messages a day. How would you model them in Cassandra?
    weak_answer: A messages table with message_id as the primary key.
    red_note: how do you read a chat?
    follow_ups:
      - type: technical
        text: What is your partition key, and what is the clustering column?
      - type: failure
        text: One group chat gets millions of messages. What happens to that partition?
      - type: tradeoff
        text: Product now wants keyword search across all messages. Do you add it to this store?
      - type: measurement
        text: Which metric warns you that a partition is getting too large?
    strong_moves:
      - "Design from the read, latest messages of a chat: partition by chat id, sort by time descending."
      - Bucket busy chats by day or week so no partition grows without limit.
      - Serve other queries, like search, from a separate store fed by the same writes.
    asked_in: HLD round · SDE-2/SDE-3 · often after “design a chat app”
  - text: One node in your Cassandra cluster sits at 90% CPU while the others are idle. What's wrong?
    free: false
self_check:
  - Can you design a partition key from a read query?
  - Can you explain why ad hoc queries are hard in a wide-column store?
reviewed: false
---
