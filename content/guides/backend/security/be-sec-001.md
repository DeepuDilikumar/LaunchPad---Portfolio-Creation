---
id: be-sec-001
guide: backend
module: security
title: "A user changed an ID in the URL and saw someone else's order. What went wrong?"
rounds: [technical-deep-dive]
seniority: ["2-4", "4-8"]
intent: "Object-level authorization, not just authentication."
weak_answer: "Use UUIDs instead of numbers so IDs can't be guessed."
why_it_fails: "Unguessable IDs hide the bug. The server still never checks that the order belongs to the caller."
red_note: "hiding the ID isn't a check"
follow_ups:
  - type: technical
    question: "Where should the ownership check live?"
    what_it_tests: "Enforcing authorization in the data access path."
    strong_points:
      - "In the query itself: WHERE id = ? AND user_id = ?, or a shared authorization layer."
      - "Not scattered as if-statements that a new endpoint can forget."
  - type: failure
    question: "Admins and support staff need to see any order. How do you allow that safely?"
    what_it_tests: "Role-based exceptions with audit trails."
    strong_points:
      - "Explicit roles checked server-side, never a client flag."
      - "Log every access by staff to someone else's data."
  - type: measurement
    question: "How would you find other endpoints with the same bug?"
    what_it_tests: "Systematic testing for broken object-level authorization."
    strong_points:
      - "Automated tests that call each endpoint as user A with user B's IDs."
      - "Review queries that look up by ID without a tenant or owner filter."
  - type: tradeoff
    question: "Return 403 or 404 for someone else's order?"
    what_it_tests: "Not leaking which IDs exist."
    strong_points:
      - "404 avoids confirming the order exists."
      - "403 is clearer for debugging; pick one consistently."
rejection_signals:
  - "Relies on unguessable IDs as the fix."
  - "Confuses authentication with authorization."
answer_framework:
  - "Name it: broken object-level authorization."
  - "Check ownership in the data access path for every object."
  - "Test every endpoint as the wrong user."
model_answer: "The server authenticated the user but never checked that the order belonged to them, which is broken object-level authorization. Switching to UUIDs only makes IDs harder to guess. I'd enforce ownership where the data is loaded: the query filters by both the order ID and the caller's user or tenant ID, ideally through one shared data access layer so new endpoints can't forget it. Staff access goes through explicit roles with an audit log. Then I'd add tests that call every endpoint as one user with another user's IDs, to find other places with the same gap."
self_check:
  - "Can you explain the difference between authentication and authorization?"
  - "Can you write the query that enforces ownership?"
sources:
  - "https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/"
  - "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html"
reviewed: false
---
