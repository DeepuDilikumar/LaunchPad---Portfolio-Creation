---
id: dns-ttl
title: TTLs and DNS caching
section: dns
why_here: DNS answers are cached everywhere, so changes don't land instantly.
summary: Every DNS answer carries a TTL that says how long it may be cached. Long TTLs mean fewer lookups and faster pages; short TTLs mean you can move traffic quickly during a migration or an outage. Lower the TTL days before a planned change, not during the incident.
key_tradeoff: Fast lookups versus fast changes.
cloud: dns
reviewed: false
---
