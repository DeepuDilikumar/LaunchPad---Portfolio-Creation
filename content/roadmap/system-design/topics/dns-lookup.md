---
id: dns-lookup
title: How a lookup works
section: dns
why_here: Users type a name; something has to turn it into an address.
summary: Your device asks a resolver, usually your ISP's or a public one. If it hasn't cached the answer, the resolver asks a root server, then the server for .in or .com, then the domain's authoritative server, and caches the result. Most lookups never leave the cache, which is why DNS is fast and why changes spread slowly.
cloud: dns
reviewed: false
---
