---
id: horizontal-scaling
title: Horizontal scaling
section: load-balancers
why_here: A load balancer is what makes adding servers useful.
summary: Horizontal scaling means more identical servers sharing the load. It only works if the servers are stateless and the data layer can keep up. The load balancer spreads traffic, removes unhealthy servers and lets you deploy one machine at a time. Autoscaling adds and removes servers based on load.
cloud: load-balancer
questions:
  - text: Your ticket booking API runs on one large server and peaks during big releases. How would you scale it out?
    weak_answer: Add more servers behind a load balancer.
    red_note: and the sessions?
    follow_ups:
      - type: technical
        text: Where do user sessions live once there are ten servers?
      - type: failure
        text: You add ten servers and it's still slow. What's the bottleneck now?
      - type: tradeoff
        text: Autoscale on CPU or on request count?
      - type: measurement
        text: How do you know adding servers actually helped?
    strong_moves:
      - First make servers stateless by moving sessions and files to shared stores.
      - "Check the data layer: more app servers mean more database connections and queries."
      - Autoscale on a signal that leads load, and pre-scale before known peaks.
    asked_in: HLD round · SDE-2 · often inside “design a ticket booking system”
  - text: Autoscaling added 40 servers in two minutes and the database ran out of connections. What went wrong?
    free: false
self_check:
  - Can you list what must move out of a server before you can add a second one?
  - Can you explain why autoscaling can be too slow for a sudden spike?
india_note: "Expect it with any “big sale” or “movie release” scenario, where traffic jumps many times in minutes."
reviewed: false
---
