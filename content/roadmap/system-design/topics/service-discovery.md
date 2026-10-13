---
id: service-discovery
title: Service discovery
section: application-layer
why_here: Services move and scale; others need to find them.
summary: Instances come and go, so hard-coded addresses break. Service discovery keeps a live registry of healthy instances. Clients look a service up by name, through DNS, a registry like Consul, or the platform itself (Kubernetes services). Health checks keep dead instances out of the list.
cloud: service-discovery
reviewed: false
---
