---
id: failover
title: Fail-over
section: availability-patterns
why_here: A server will die; something must take over.
summary: Active–passive keeps a standby that takes over when the active node stops sending heartbeats. Active–active runs several nodes that all serve traffic, so losing one just reduces capacity. Fail-over adds hardware and complexity, and a bad health check can fail over when nothing was wrong. Test it; untested fail-over usually fails.
key_tradeoff: Standby cost and false fail-overs versus downtime.
questions:
  - text: Your primary database dies at 8 p.m. during a sale. Walk me through the next 60 seconds.
    weak_answer: The replica takes over automatically.
    red_note: who decides? what's lost?
    follow_ups:
      - type: technical
        text: How does the system decide the primary is really dead?
      - type: failure
        text: The old primary comes back and still thinks it is the leader. What happens?
      - type: tradeoff
        text: An async replica fails over fast but may lose writes. Is that acceptable for orders?
      - type: ownership
        text: When did your team last test this fail-over, and how?
    strong_moves:
      - Detect with heartbeats and a timeout; too short causes false fail-overs, too long means downtime.
      - Promote one replica, fence the old primary, and repoint clients through DNS or a proxy.
      - "Say what's lost: with async replication, the last few writes. Reconcile them afterwards."
    asked_in: Technical deep dive · SDE-2 · often after “what if the database goes down?”
  - text: Retries from every client turned a small outage into a big one. Why, and what would you change?
    free: false
    guide_ref: be-rel-002
self_check:
  - Can you explain split brain and how fencing prevents it?
  - Can you compare active–passive and active–active in two sentences?
reviewed: false
---
