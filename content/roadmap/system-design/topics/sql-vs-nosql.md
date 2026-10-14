---
id: sql-vs-nosql
title: SQL vs NoSQL
section: databases
why_here: Picking a database is picking how you'll query and grow.
summary: 'Relational databases give joins, transactions and a flexible query language over a fixed schema. NoSQL stores give simpler models that scale out easily, with fewer guarantees. Choose from the access patterns: how you read, how you write, what must be consistent. "NoSQL because it scales" is the classic weak answer.'
key_tradeoff: Query flexibility and transactions versus easy horizontal scale.
cloud: sql
questions:
  - text: You're designing ticket booking for a cricket match. SQL or NoSQL for the bookings, and why?
    weak_answer: NoSQL, because it scales better.
    red_note: scales what, exactly?
    follow_ups:
      - type: technical
        text: Which queries does the booking flow run, and which of them need a transaction?
      - type: failure
        text: Your store is eventually consistent. What can a user see right after booking?
      - type: tradeoff
        text: Seat availability is read far more than it's written. Does that change your choice?
      - type: measurement
        text: At what write rate would one Postgres primary stop coping, and how would you check?
    strong_moves:
      - "List the access patterns first: seats by event, booking writes, and a user's booking history."
      - Bookings need a transaction on a seat, so a relational database fits, and one primary handles a lot.
      - Scale reads with caching and replicas, and move out only the parts that outgrow it.
    asked_in: HLD round · SDE-1/SDE-2 · often after “design a ticket booking system”
  - text: Two users booked the last seat at the same time. How did that happen?
    free: false
    guide_ref: be-db-001
self_check:
  - Can you choose a database from access patterns instead of brand names?
  - Can you name what you give up with each choice?
india_note: "Comes up early in most HLD rounds; interviewers want the reason, not the product name."
reviewed: false
---
