---
id: l4-vs-l7
title: Layer 4 vs Layer 7
section: load-balancers
why_here: The balancer must decide how much of each request it reads.
summary: "A layer 4 balancer routes by IP address and port without reading the request: very fast and protocol-agnostic. A layer 7 balancer reads HTTP, so it can route by path or header, end TLS, retry and add auth, at some extra latency and cost. Choose by what the routing decision needs to see."
key_tradeoff: Speed and simplicity versus request-aware routing.
cloud: load-balancer
flow:
  nodes:
    - label: Client
    - label: Load balancer
      bad: true
    - label: 6 servers
  note: how much does it need to read?
questions:
  - text: Your API runs on 6 servers behind a load balancer. Would you pick an L4 or an L7 balancer, and why?
    weak_answer: L7, because it's newer.
    red_note: but what does L7 cost you?
    follow_ups:
      - type: failure
        text: One server gets slow, not dead. What does the balancer do?
      - type: tradeoff
        text: "Sticky sessions: what do you gain, and what breaks?"
      - type: ownership
        text: Who owns the health check, and what does it test?
      - type: measurement
        text: Which metric shows the load is really even?
    strong_moves:
      - "Ask what the balancer needs to see: L4 sees only IP and port, so it's fast and blind to paths."
      - "L7 opens the request: route by path, end TLS, retry, at some latency cost."
      - "Choose by need: routing or auth at the edge means L7; raw TCP volume means L4."
    asked_in: HLD round · SDE-2 · often inside “design a ticket booking system”
  - text: Traffic doubles and one zone fails during a sale. Walk me through what the load balancer does.
    free: false
self_check:
  - Can you say what an L4 balancer can't see?
  - Can you name two things only an L7 balancer can do?
reviewed: false
---
