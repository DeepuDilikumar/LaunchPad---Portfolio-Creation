---
id: service-discovery
title: Service discovery
section: application-layer
why_here: Services move and scale; others need to find them.
summary: Instances come and go, so hard-coded addresses break. Service discovery keeps a live registry of healthy instances. Clients look a service up by name, through DNS, a registry like Consul, or the platform itself (Kubernetes services). Health checks keep dead instances out of the list.
cloud: service-discovery
questions:
  - text: Your payment service scales from 3 to 20 instances during a sale. How does the order service find them?
    weak_answer: Hard-code the IPs in config.
    red_note: and when they change?
    follow_ups:
      - type: technical
        text: DNS-based discovery or a registry like Consul? What's the difference?
      - type: failure
        text: An instance dies but stays in the registry. What do callers see?
      - type: tradeoff
        text: Client-side lookup or a load balancer in between?
      - type: measurement
        text: How would you detect callers using a stale list of instances?
    strong_moves:
      - Instances register by service name, and callers look up the name, not an address.
      - Health checks or expiring leases remove dead instances from the list quickly.
      - Callers still need timeouts and retries, because the list is always slightly stale.
    asked_in: Technical deep dive · SDE-2 · often after “walk me through your microservices setup”
  - text: The registry itself goes down for five minutes. What keeps working, and what breaks?
    free: false
self_check:
  - Can you explain how a caller finds a healthy instance by name?
  - Can you say why DNS caching can send traffic to dead instances?
reviewed: false
---
