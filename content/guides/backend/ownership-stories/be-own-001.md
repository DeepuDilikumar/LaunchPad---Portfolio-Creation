---
id: be-own-001
guide: backend
module: ownership-stories
title: "Tell me about an incident you owned."
rounds: [behavioural, production-experience]
seniority: ["2-4", "4-8"]
intent: "Can they show personal decisions, timelines and lasting fixes, not a team summary?"
weak_answer: "There was an outage, the team found the bug, and we fixed it."
why_it_fails: "No 'I', no timeline, no decision. The interviewer learns nothing about what you did."
red_note: "where are you in this story?"
follow_ups:
  - type: ownership
    question: "What was the first thing you personally did when you were paged?"
    what_it_tests: "Concrete first actions under pressure."
    strong_points:
      - "Checked impact first: who is affected and how badly."
      - "Named a clear action: rolled back, opened an incident channel, paged the owner."
  - type: tradeoff
    question: "What did you choose not to do in the moment, and why?"
    what_it_tests: "Mitigation before root cause."
    strong_points:
      - "Stopped the bleeding first, for example a rollback, before hunting for the root cause."
  - type: measurement
    question: "How many users were affected, and for how long?"
    what_it_tests: "Knowing the numbers of your own incident."
    strong_points:
      - "Gives real numbers: duration, requests or users affected, revenue impact if known."
  - type: ownership
    question: "What changed permanently because of you?"
    what_it_tests: "Lasting fixes beyond the patch."
    strong_points:
      - "An alert, a test, a runbook or a design change they drove to completion."
  - type: failure
    question: "What would you do differently?"
    what_it_tests: "Honest reflection without blame."
    strong_points:
      - "Names a real mistake of their own and what they learned."
rejection_signals:
  - "Says 'we' throughout and never 'I'."
  - "Can't give numbers for impact."
  - "Blames another team or person."
answer_framework:
  - "Context in two lines: system, impact, your role."
  - "Your decisions in order, mitigation before root cause."
  - "The lasting change you drove, and what you'd do differently."
model_answer: "Pick one real incident and tell it in order. Two lines of context: the system, the impact in numbers, and your role. Then your own actions with timestamps: you checked the error dashboard, saw checkout failures starting at the deploy, rolled back within ten minutes, and confirmed recovery. Then the root cause you found, the fix, and the permanent change you drove, such as a canary step or a new alert. Close with one thing you'd do differently. Use 'I' for your actions and 'we' only for the team's."
self_check:
  - "Can you say your incident's impact in numbers?"
  - "Can you name one permanent change you personally drove?"
sources:
  - "https://sre.google/sre-book/postmortem-culture/"
  - "https://sre.google/sre-book/managing-incidents/"
concepts: [metrics-slos]
reviewed: false
---
