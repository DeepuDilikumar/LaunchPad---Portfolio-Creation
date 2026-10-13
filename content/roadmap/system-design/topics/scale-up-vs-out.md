---
id: scale-up-vs-out
title: Scale up vs scale out
section: scaling
why_here: When one server is full you either buy a bigger one or add more.
summary: "Scaling up means a bigger machine: simple, no code changes, but there is a ceiling and one box is one failure. Scaling out means more machines behind a load balancer: no ceiling, survives a crash, but needs stateless services and shared storage. Most real systems scale up the database and scale out the app tier."
key_tradeoff: Simplicity of one big box versus resilience and headroom of many.
reviewed: false
---
