---
id: api-gateway
title: API gateway
section: application-layer
why_here: Clients shouldn't need to know about every internal service.
summary: An API gateway is one front door for many services. It routes requests, checks authentication, applies rate limits, and can combine several calls into one response for mobile clients. It is also one more hop and a shared dependency, so keep business logic out of it.
key_tradeoff: One place for cross-cutting rules versus one more thing that can fail.
cloud: api-gateway
reviewed: false
---
