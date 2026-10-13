---
id: event-driven-jobs
title: Event-driven jobs
section: async
why_here: Some work should happen because something else happened.
summary: Event-driven jobs run when an event is published, like "order placed" triggering emails, inventory updates and analytics. Producers don't need to know who listens, which keeps services loosely coupled. Tracing a single order through many listeners gets harder, so log the event ID everywhere.
cloud: pubsub
reviewed: false
---
