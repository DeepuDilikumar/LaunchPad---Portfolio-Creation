---
id: be-own-002
guide: backend
module: ownership-stories
title: "Tell me about a technical decision you'd make differently now."
rounds: [behavioural]
seniority: ["2-4", "4-8"]
intent: "Can they reason about a past trade-off with hindsight, without self-defence or self-blame?"
weak_answer: "I can't think of one. Our decisions were mostly right."
why_it_fails: "Every engineer has one. Not having one reads as low self-awareness or low ownership."
red_note: "everyone has one"
follow_ups:
  - type: tradeoff
    question: "What did you know at the time, and what made the decision reasonable then?"
    what_it_tests: "Separating a bad outcome from a bad decision."
    strong_points:
      - "Describes the constraints honestly: deadline, team size, unknowns."
  - type: measurement
    question: "When did you realise it was wrong, and what told you?"
    what_it_tests: "Signals and evidence, not hindsight vibes."
    strong_points:
      - "A concrete signal: a metric, an incident, a cost, a slowed feature."
  - type: ownership
    question: "What did you do about it?"
    what_it_tests: "Acting on the lesson, not just noting it."
    strong_points:
      - "Proposed and drove a migration, a fix, or a decision record."
  - type: technical
    question: "If you had to make the same call tomorrow, what would you check first?"
    what_it_tests: "A reusable rule from the experience."
    strong_points:
      - "States a specific check, for example load-testing with production data sizes before choosing a store."
rejection_signals:
  - "Has no example."
  - "Blames others for the decision."
answer_framework:
  - "The decision and why it was reasonable then."
  - "The signal that showed it was wrong."
  - "What you changed, and the rule you use now."
model_answer: "Choose a real technical call you made or strongly influenced, such as picking a datastore, splitting a service too early, or skipping a queue. Explain the constraints that made it reasonable at the time. Then name the signal that showed it was wrong: an incident, a cost graph, features slowing down. Describe what you did about it, ideally a change you drove, and finish with the rule you now apply, stated so the interviewer could use it too."
self_check:
  - "Can you name the signal that told you the decision was wrong?"
  - "Can you state your new rule in one sentence?"
sources:
  - "https://adr.github.io/"
  - "https://www.reddit.com/r/developersIndia/"
concepts: [design-round]
reviewed: false
---
