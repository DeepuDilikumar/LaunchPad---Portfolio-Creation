---
id: lb-algorithms
title: Balancing algorithms
section: load-balancers
why_here: Spreading requests evenly is harder than it sounds.
summary: Round robin takes turns. Least connections sends work to the least busy server, which helps when requests vary in cost. Weighted versions favour bigger machines. Hashing on a key, like the user ID, keeps a user on the same server, at the cost of uneven load when one key is hot.
key_tradeoff: Even spread versus stickiness for caches or sessions.
cloud: load-balancer
questions:
  - text: Some API calls take 5 ms and some take 2 seconds. Which load balancing algorithm would you choose, and why?
    weak_answer: Round robin, it spreads load evenly.
    red_note: even count, uneven work
    follow_ups:
      - type: technical
        text: How does least connections behave when one server is slow but not dead?
      - type: tradeoff
        text: Hashing on user ID helps your cache. What does it cost you?
      - type: failure
        text: One user ID gets very hot. What happens to the server that owns it?
      - type: measurement
        text: Which metric shows the load is truly balanced?
    strong_moves:
      - "Round robin balances request count, not work, so mixed request costs pile up on some servers."
      - Least connections sends new work to whoever has the least in flight.
      - Use hashing only when stickiness pays, like local caches, and plan for hot keys.
    asked_in: Technical deep dive · SDE-2 · often after “design a load balancer”
  - text: You switched to consistent hashing by user ID, and one server now runs at 90% CPU while the others idle. Why?
    free: false
self_check:
  - Can you explain why round robin fails with uneven requests?
  - Can you say what happens to a hash-based mapping when a server is added?
reviewed: false
---
