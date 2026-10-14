---
id: scale-up-vs-out
title: Scale up vs scale out
section: scaling
why_here: When one server is full you either buy a bigger one or add more.
summary: "Scaling up means a bigger machine: simple, no code changes, but there is a ceiling and one box is one failure. Scaling out means more machines behind a load balancer: no ceiling, survives a crash, but needs stateless services and shared storage. Most real systems scale up the database and scale out the app tier."
key_tradeoff: Simplicity of one big box versus resilience and headroom of many.
questions:
  - text: Your single Postgres server is at 85% CPU a week before a big sale. Bigger box or more boxes?
    weak_answer: Scale out, horizontal is always better.
    red_note: always? even the db?
    follow_ups:
      - type: tradeoff
        text: Scaling up buys time with no code change. When is that the right call?
      - type: technical
        text: What must be true of your app servers before you can simply add more?
      - type: failure
        text: The one big database box dies during the sale. What happens?
      - type: measurement
        text: How do you know how much headroom the bigger box really gives you?
    strong_moves:
      - A week out, scale up the database and add read replicas; sharding is too risky to rush.
      - Scale out the app tier freely, since stateless servers behind a load balancer are cheap to add.
      - Name the ceiling and the single point of failure, and keep a tested standby.
    asked_in: HLD round · SDE-2 · often in “design for a sale day”
  - text: Your app servers keep user sessions in memory. What breaks when you add a second server?
    free: false
self_check:
  - Can you say why app servers scale out easily but databases don't?
  - Can you name two limits of scaling up?
india_note: "Sale-day traffic, such as a festive sale or a big ticket release, is a common framing for scaling questions in Indian HLD rounds."
reviewed: false
---
