---
id: health-checks
title: Health checks
section: load-balancers
why_here: A balancer that sends traffic to a broken server makes things worse.
summary: The balancer regularly calls an endpoint on each server and stops sending traffic when it fails. A good health check tests what the server needs to do its job, but not so much that one slow dependency marks every server unhealthy at once. Separate "alive" from "ready to take traffic".
key_tradeoff: Deep checks catch more but can fail everything together.
cloud: load-balancer
questions:
  - text: "Your API servers sit behind a load balancer. What should the health check endpoint actually test?"
    weak_answer: Return 200 OK if the server is up.
    red_note: up isn't ready
    follow_ups:
      - type: failure
        text: The database gets slow and every health check fails. What does the balancer do?
      - type: technical
        text: How is a liveness check different from a readiness check?
      - type: tradeoff
        text: How many failures before you pull a server? How many passes to bring it back?
      - type: ownership
        text: Who decides what a healthy server means for this service?
    strong_moves:
      - Check what this server alone needs to serve requests, like its config and local resources.
      - Keep shared dependencies out of the check, or one slow database removes every server.
      - "Split liveness from readiness: restart a stuck process, but just stop routing to a busy one."
    asked_in: Technical deep dive · SDE-2 · often after “how does your load balancer know a server is down”
  - text: The database slowed for a minute and the balancer marked all your servers unhealthy at once. Walk me through it.
    free: false
self_check:
  - Can you explain why a deep health check can cause a full outage?
  - Can you say what readiness means during a deploy?
reviewed: false
---
