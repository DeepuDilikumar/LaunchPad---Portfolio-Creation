---
id: dns-ttl
title: TTLs and DNS caching
section: dns
why_here: DNS answers are cached everywhere, so changes don't land instantly.
summary: Every DNS answer carries a TTL that says how long it may be cached. Long TTLs mean fewer lookups and faster pages; short TTLs mean you can move traffic quickly during a migration or an outage. Lower the TTL days before a planned change, not during the incident.
key_tradeoff: Fast lookups versus fast changes.
cloud: dns
questions:
  - text: You move traffic to a new load balancer tonight. Your DNS TTL is 24 hours. What do you do?
    weak_answer: Change the record; it updates in a few minutes.
    red_note: 24 hours, actually
    follow_ups:
      - type: technical
        text: When should you have lowered the TTL, and to what?
      - type: failure
        text: Some resolvers ignore your TTL. How long do you keep the old load balancer running?
      - type: tradeoff
        text: Why not keep a 60-second TTL all the time?
      - type: measurement
        text: How do you know the old endpoint has stopped getting traffic?
    strong_moves:
      - Lower the TTL at least one old TTL before the move, so long-cached answers expire first.
      - Keep the old endpoint serving until its traffic falls to near zero; some caches ignore TTLs.
      - Raise the TTL again afterwards, since short TTLs mean more lookups and slower first loads.
    asked_in: Technical deep dive · SDE-2 · often in migration or outage questions
  - text: A region went down and you switched DNS to the backup, but users kept hitting the dead region for an hour. Why?
    free: false
self_check:
  - Can you explain why DNS changes are not instant?
  - Can you plan a TTL timeline for a migration?
reviewed: false
---
