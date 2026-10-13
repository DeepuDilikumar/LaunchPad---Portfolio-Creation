---
id: where-to-cache
title: Where to cache
section: caching
why_here: Caches exist at every layer; each has a different cost.
summary: You can cache in the browser, the CDN, the load balancer, the app's memory, a shared cache like Redis, and the database's own buffer. Closer to the user is faster but harder to invalidate. Know every layer that might hold a copy, because stale data usually comes from the one you forgot.
cloud: cache
reviewed: false
---
