---
id: encryption-in-transit
title: Encryption in transit
section: security
why_here: Data crossing networks can be read or changed on the way.
summary: TLS encrypts traffic between clients and servers, and increasingly between internal services too (mutual TLS). Terminate TLS at the edge for speed, but decide whether internal hops need encryption as well. Keys and certificates belong in a managed secret store, never in code.
cloud: secrets
questions:
  - text: TLS ends at your load balancer. Should traffic between your internal services be encrypted too?
    weak_answer: It's inside our VPC, so it's safe.
    red_note: safe from whom?
    follow_ups:
      - type: technical
        text: How does one service prove its identity to another with mutual TLS?
      - type: failure
        text: A certificate expires at 2 a.m. What breaks, and how would you have known?
      - type: tradeoff
        text: What does encrypting every internal hop cost you?
      - type: ownership
        text: Who rotates the certificates, and how often?
    strong_moves:
      - Name the threat first, such as a compromised host reading plain traffic inside the network.
      - Use mutual TLS between services, often through a service mesh, so both sides prove identity.
      - Automate certificate issue and rotation, and alert well before anything expires.
    asked_in: Technical deep dive · SDE-2/SDE-3
  - text: A partner says your webhook calls could be faked. How do you prove a request really came from you?
    free: false
self_check:
  - Can you explain what TLS protects against, and what it doesn't?
  - Can you describe what mutual TLS adds over normal TLS?
reviewed: false
---
