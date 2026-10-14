---
id: design-round
title: How a design round runs
section: start
why_here: You have 45–60 minutes and a vague prompt. Knowing the shape of the round stops you from drawing too early.
summary: "A design round is a conversation, not a drawing test. You agree what to build, estimate the size, sketch the simplest thing that works, then the interviewer pushes on one part at a time. Most of the score comes from that pushing: how you reason when something breaks, gets slow, or costs too much."
key_tradeoff: "Breadth first versus depth early: cover the whole system before diving, but leave time for the follow-ups."
questions:
  - text: You have 45 minutes to design a ticket booking system. How do you split the time?
    weak_answer: Draw the full architecture, then explain each box.
    red_note: no time for follow-ups
    follow_ups:
      - type: ownership
        text: Twenty minutes in, the interviewer asks about one box only. Do you finish your diagram first?
      - type: tradeoff
        text: Go deep on seat locking now, or cover the whole flow first?
      - type: failure
        text: You realise your first design can't handle the peak. What do you say?
      - type: measurement
        text: How do you know you're spending too long on one part?
    strong_moves:
      - "Say a time plan upfront: about 5 minutes requirements, 5 estimates, 15 simple design, the rest deep dives."
      - Draw the simplest design that works end to end before adding caches or queues.
      - When pushed on one part, follow the interviewer and reason from your numbers.
    asked_in: HLD round · SDE-2 / SDE-3
  - text: The interviewer keeps asking “what if this fails?” before your design is done. How do you handle it?
    free: false
self_check:
  - Can you state your time plan in one sentence at the start of a round?
  - Can you sketch a working end-to-end design in 15 minutes?
reviewed: false
---
