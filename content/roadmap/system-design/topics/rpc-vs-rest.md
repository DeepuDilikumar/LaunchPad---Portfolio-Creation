---
id: rpc-vs-rest
title: RPC vs REST
section: communication
why_here: Internal services and public APIs have different needs.
summary: REST models resources over HTTP with standard methods and is easy to cache and debug. RPC frameworks like gRPC call functions on a remote service with typed contracts and efficient binary encoding. Teams often use REST for public APIs and gRPC between internal services.
key_tradeoff: Simplicity and caching versus speed and strict contracts.
questions:
  - text: Your public mobile API and your internal service-to-service calls both use REST. Would you change either to gRPC? Why?
    weak_answer: gRPC everywhere, it's faster.
    red_note: faster at what cost?
    follow_ups:
      - type: tradeoff
        text: What do you lose in debugging and caching when you move to binary gRPC?
      - type: technical
        text: How does a typed contract help when a field changes?
      - type: ownership
        text: Who owns the .proto files, and how do other teams get updates?
      - type: measurement
        text: How would you prove the switch actually saved latency?
    strong_moves:
      - Keep public APIs as REST over JSON, so browsers, caches and partners just work.
      - Use gRPC internally where call volume is high and typed contracts catch mistakes early.
      - Measure first; serialisation is rarely the slowest part of a request.
    asked_in: Technical deep dive · SDE-2 · often after “how do your services talk to each other”
  - text: You need to rename a field in your API, but old app versions are still live. How do you ship it?
    free: false
    guide_ref: be-api-001
self_check:
  - Can you name two reasons public APIs usually stay REST?
  - Can you explain how gRPC keeps old and new clients compatible?
reviewed: false
---
