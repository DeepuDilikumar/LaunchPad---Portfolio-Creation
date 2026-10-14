---
id: graph-db
title: Graph databases
section: databases
why_here: When the relationships are the data.
summary: Graph databases store nodes and the edges between them, so questions like "friends of friends" or "how is this account linked to that one" are fast. They suit social graphs, recommendations and fraud detection, and are rarely the main store for everything else.
cloud: graph
questions:
  - text: For a UPI fraud check, you must find accounts linked through shared devices or phone numbers. Which database would you use?
    weak_answer: A graph database, because it's about relationships.
    red_note: how many hops? how fast?
    follow_ups:
      - type: technical
        text: How would you write a three-hop query in SQL, and when does it get slow?
      - type: tradeoff
        text: Graph database as the main store, or a copy fed from the main database?
      - type: failure
        text: One merchant account links to a million users. What happens to your traversal?
      - type: measurement
        text: What latency must this check meet inside a payment flow?
    strong_moves:
      - "State the query: how many hops, from which starting node, and the latency budget inside a payment."
      - Keep payments in the main store, and feed the links into a graph store through events.
      - Cap hops and fan-out, and treat huge nodes like popular merchants separately.
    asked_in: Technical deep dive · SDE-2/SDE-3 · often after “design fraud detection”
  - text: Your “people you may know” query is fast for most users but times out for a few. Why?
    free: false
self_check:
  - Can you explain why multi-hop queries get slow with joins?
  - Can you name a case where a graph database is the wrong choice?
reviewed: false
---
