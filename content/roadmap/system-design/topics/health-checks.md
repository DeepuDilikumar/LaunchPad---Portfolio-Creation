---
id: health-checks
title: Health checks
section: load-balancers
why_here: A balancer that sends traffic to a broken server makes things worse.
summary: The balancer regularly calls an endpoint on each server and stops sending traffic when it fails. A good health check tests what the server needs to do its job, but not so much that one slow dependency marks every server unhealthy at once. Separate "alive" from "ready to take traffic".
key_tradeoff: Deep checks catch more but can fail everything together.
cloud: load-balancer
reviewed: false
---
