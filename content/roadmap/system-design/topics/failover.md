---
id: failover
title: Fail-over
section: availability-patterns
why_here: A server will die; something must take over.
summary: Active–passive keeps a standby that takes over when the active node stops sending heartbeats. Active–active runs several nodes that all serve traffic, so losing one just reduces capacity. Fail-over adds hardware and complexity, and a bad health check can fail over when nothing was wrong. Test it; untested fail-over usually fails.
key_tradeoff: Standby cost and false fail-overs versus downtime.
reviewed: false
---
