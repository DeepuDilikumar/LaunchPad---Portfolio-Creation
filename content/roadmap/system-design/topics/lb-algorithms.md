---
id: lb-algorithms
title: Balancing algorithms
section: load-balancers
why_here: Spreading requests evenly is harder than it sounds.
summary: Round robin takes turns. Least connections sends work to the least busy server, which helps when requests vary in cost. Weighted versions favour bigger machines. Hashing on a key, like the user ID, keeps a user on the same server, at the cost of uneven load when one key is hot.
key_tradeoff: Even spread versus stickiness for caches or sessions.
cloud: load-balancer
reviewed: false
---
