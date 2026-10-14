---
id: federation
title: Federation
section: databases
why_here: Sometimes the simplest split is by feature.
summary: Federation, or functional partitioning, gives each part of the product its own database, like users, orders and products. Each database is smaller and gets less traffic. Joins across them move into the application, which costs code and consistency.
cloud: sql
questions:
  - text: One Postgres holds users, orders and the catalogue, and it's near its limits. Would you split it by feature?
    weak_answer: Yes, one database per microservice.
    red_note: and the joins?
    follow_ups:
      - type: technical
        text: The order page needs the user's name and product titles. Where does that join happen now?
      - type: failure
        text: The order is written in one database but the wallet debit fails in another. What state are you in?
      - type: tradeoff
        text: "Federation or sharding: which do you reach for first, and why?"
      - type: measurement
        text: How do you find which feature's tables cause most of the load?
    strong_moves:
      - Measure load per group of tables, and split off the feature that is heavy and rarely joined with the rest.
      - Move cross-feature joins into the app, or keep a read copy of the few fields you need.
      - Cross-database writes lose the shared transaction, so use a saga or outbox where both must succeed.
    asked_in: HLD round · SDE-2/SDE-3 · often after “the database is the bottleneck”
  - text: Checkout now spans the payments and orders databases. Payment went through, but shipping failed. What do you do?
    free: false
    guide_ref: be-cons-002
self_check:
  - Can you explain what you lose when two tables move to different databases?
  - Can you compare federation with sharding?
reviewed: false
---
