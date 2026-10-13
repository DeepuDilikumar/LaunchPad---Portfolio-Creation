---
id: lb-vs-reverse-proxy
title: LB vs reverse proxy
section: load-balancers
why_here: These two get mixed up, and interviewers notice.
summary: "A reverse proxy sits in front of servers and handles requests for them: TLS, compression, caching, routing. A load balancer spreads requests across several servers. One tool often does both, like NGINX or a cloud load balancer, but a reverse proxy still helps with a single server, and a load balancer only makes sense with more than one."
cloud: load-balancer
reviewed: false
---
