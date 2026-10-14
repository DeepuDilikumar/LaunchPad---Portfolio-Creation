---
id: clarify-requirements
title: Clarify requirements first
section: start
why_here: Every later decision depends on what the system must do and how big it is.
summary: Spend the first five minutes on questions. Which features matter, who uses it, how many users, how much data, what must never go wrong. Split functional needs (what it does) from non-functional ones (speed, availability, consistency, cost). Write the numbers down; you will use them in every trade-off later.
key_tradeoff: Asking enough questions versus running out of time to design.
questions:
  - text: Design a food delivery app. The interviewer stops there. What do you ask in the first five minutes?
    weak_answer: "I start drawing services: user, restaurant, order, delivery."
    red_note: built what, for whom?
    follow_ups:
      - type: tradeoff
        text: You have 45 minutes in total. Which questions do you drop to save time?
      - type: measurement
        text: Which three numbers do you write on the board before drawing anything?
      - type: failure
        text: Halfway through, you learn orders must never be lost. What changes in your design?
      - type: ownership
        text: The interviewer says “you decide”. How do you pick a scope and defend it?
    strong_moves:
      - Pin the two or three core features, and say aloud what is out of scope.
      - "Ask for scale: daily users, peak orders per second, data growth. Write the numbers down."
      - Ask what must never go wrong, such as lost orders or double charges. That decides consistency.
    asked_in: HLD round · SDE-2 · first five minutes of any design prompt
  - text: The interviewer refuses to give numbers and says “assume what you like”. How do you size the system?
    free: false
self_check:
  - Can you split a prompt into functional and non-functional requirements in under two minutes?
  - Can you name the three numbers you ask for in every design round?
india_note: "One-line prompts like “design a food delivery app” are common in HLD rounds; the vagueness is deliberate."
reviewed: false
---
