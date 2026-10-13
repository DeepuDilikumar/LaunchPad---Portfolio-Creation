---
id: stateless-services
title: Stateless services
section: scaling
why_here: You can only add servers freely if any server can handle any request.
summary: A stateless service keeps nothing about a user between requests on its own disk or memory. Sessions, uploads and caches move to shared stores. Then any instance can serve any request, crashed instances lose nothing, and you scale by adding copies. State still exists; you just put it somewhere built to hold it.
key_tradeoff: Each request now pays a network hop to fetch state.
questions:
  - text: You add a second app server and users start getting logged out at random. Why?
    weak_answer: Something is wrong with the second server, so restart it.
    red_note: it's the state, not the server
    follow_ups:
      - type: failure
        text: Where is the session stored right now?
      - type: tradeoff
        text: "Sticky sessions or a shared session store: which would you pick?"
      - type: measurement
        text: How would you prove the logouts stopped?
      - type: ownership
        text: What else might be stored on the server's disk or memory?
    strong_moves:
      - Sessions live in one server's memory, so the other server doesn't know the user.
      - "Move state out: a shared store like Redis, or signed tokens."
      - Then any server can serve any request, and scaling out is just adding copies.
    asked_in: HLD round · SDE-1/SDE-2
  - text: A user uploads a file to one server and downloads it from another. What breaks, and how do you fix it?
    free: false
self_check:
  - Can you list three kinds of state that hide inside app servers?
  - Can you explain why sticky sessions are a stopgap?
reviewed: false
---
