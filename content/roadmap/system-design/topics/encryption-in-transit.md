---
id: encryption-in-transit
title: Encryption in transit
section: security
why_here: Data crossing networks can be read or changed on the way.
summary: TLS encrypts traffic between clients and servers, and increasingly between internal services too (mutual TLS). Terminate TLS at the edge for speed, but decide whether internal hops need encryption as well. Keys and certificates belong in a managed secret store, never in code.
cloud: secrets
reviewed: false
---
