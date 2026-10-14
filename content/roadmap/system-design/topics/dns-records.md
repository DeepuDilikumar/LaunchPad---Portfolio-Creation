---
id: dns-records
title: "Record types: A, CNAME"
section: dns
why_here: DNS answers come in a few record types, and each one does a different job.
summary: An A record maps a name to an IPv4 address, AAAA to IPv6. CNAME points one name at another name. MX tells mail servers where to deliver, and NS says which servers are authoritative for a domain. In designs you mostly use A and CNAME records, often pointing at a load balancer or CDN.
cloud: dns
questions:
  - text: You put your site behind a CDN. Do you point www at it with an A record or a CNAME, and why?
    weak_answer: An A record, that's the standard.
    red_note: pointing at which IP?
    follow_ups:
      - type: technical
        text: Why can't you put a CNAME on the bare domain?
      - type: failure
        text: The CDN changes its IPs. What breaks if you hard-coded A records?
      - type: tradeoff
        text: An A record saves one lookup. Is that worth tying yourself to fixed IPs?
      - type: ownership
        text: Who owns DNS changes, and how are they reviewed before going live?
    strong_moves:
      - CNAME www to the CDN's hostname, so the provider can change IPs without you.
      - The apex can't hold a CNAME, so use your DNS provider's ALIAS or flattening feature.
      - Review record changes like code; one typo can take the whole site down.
    asked_in: Technical deep dive · SDE-1 / SDE-2
  - text: Email from your domain starts landing in spam after a DNS migration. Which records do you check?
    free: false
self_check:
  - Can you say what A, AAAA, CNAME, MX and NS records each do?
  - Can you explain why the bare domain can't be a CNAME?
reviewed: false
---
