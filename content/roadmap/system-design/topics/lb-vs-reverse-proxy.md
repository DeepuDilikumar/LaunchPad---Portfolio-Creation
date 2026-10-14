---
id: lb-vs-reverse-proxy
title: LB vs reverse proxy
section: load-balancers
why_here: These two get mixed up, and interviewers notice.
summary: "A reverse proxy sits in front of servers and handles requests for them: TLS, compression, caching, routing. A load balancer spreads requests across several servers. One tool often does both, like NGINX or a cloud load balancer, but a reverse proxy still helps with a single server, and a load balancer only makes sense with more than one."
cloud: load-balancer
questions:
  - text: You have one server running NGINX in front of your app. Is that a load balancer, a reverse proxy, or both?
    weak_answer: They're the same thing.
    red_note: same with one server?
    follow_ups:
      - type: technical
        text: What does the proxy do for you even with a single backend?
      - type: tradeoff
        text: End TLS at the proxy or at the app?
      - type: failure
        text: The proxy itself goes down. What's your plan?
      - type: ownership
        text: Who owns the proxy config, and how do changes get reviewed?
    strong_moves:
      - "A reverse proxy acts for servers: TLS, compression, caching, routing. It works with one backend."
      - Load balancing is one job a proxy can do once there are several backends.
      - Run at least two proxies so the front door is not itself a single point of failure.
    asked_in: Screening or HLD round · SDE-1/SDE-2 · often a quick concept check
  - text: Your reverse proxy caches API responses, and a user sees someone else's account page. How?
    free: false
self_check:
  - Can you name three things a reverse proxy does besides spreading load?
  - Can you explain why a reverse proxy still helps with one server?
reviewed: false
---
