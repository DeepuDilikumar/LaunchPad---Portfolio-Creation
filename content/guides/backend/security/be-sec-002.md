---
id: be-sec-002
guide: backend
module: security
title: "After a password change, the user must be logged out everywhere. You use JWTs. How?"
rounds: [technical-deep-dive]
seniority: ["2-4", "4-8"]
intent: "The revocation problem with stateless tokens."
weak_answer: "Delete the token on the client."
why_it_fails: "Deleting one copy doesn't revoke the others. A stolen token stays valid until it expires."
red_note: "other devices still hold it"
follow_ups:
  - type: technical
    question: "How do you revoke a token that's valid until it expires?"
    what_it_tests: "Short-lived access tokens, refresh tokens and token versions."
    strong_points:
      - "Short-lived access tokens, a few minutes, with refresh tokens stored server-side."
      - "Revoke refresh tokens on password change."
      - "Or a token version on the user, checked on each request."
  - type: tradeoff
    question: "Checking a denylist on every request makes JWTs stateful again. Is that fine?"
    what_it_tests: "Being honest about the trade."
    strong_points:
      - "Yes for sensitive actions; a fast cache lookup is cheap."
      - "The alternative is accepting a revocation delay equal to the access token's lifetime."
  - type: failure
    question: "An attacker stole a refresh token. How do you notice?"
    what_it_tests: "Refresh token rotation and reuse detection."
    strong_points:
      - "Rotate refresh tokens on every use."
      - "If an already-used refresh token appears again, revoke the whole token family."
  - type: technical
    question: "Where should the browser keep these tokens?"
    what_it_tests: "XSS and CSRF trade-offs in storage."
    strong_points:
      - "HttpOnly, Secure, SameSite cookies keep tokens away from page scripts."
      - "Cookies need CSRF protection for state-changing requests."
rejection_signals:
  - "Thinks deleting the client copy revokes a JWT."
  - "Uses long-lived access tokens with no server-side state."
answer_framework:
  - "JWTs can't be revoked on their own; plan for it."
  - "Short access tokens, server-side refresh tokens, revoke on password change."
  - "Rotate refresh tokens and detect reuse."
model_answer: "A JWT stays valid until it expires, so logout everywhere needs some server-side state. I'd keep access tokens short-lived, around five to fifteen minutes, and store refresh tokens server-side. On a password change, revoke all of the user's refresh tokens and bump a token version on the user record; for sensitive endpoints, check that version on each request so even live access tokens stop working immediately. Refresh tokens rotate on every use, and if an old one is replayed, we revoke the whole family because it was probably stolen."
self_check:
  - "Can you explain why JWTs are hard to revoke?"
  - "Can you describe refresh token reuse detection?"
sources:
  - "https://datatracker.ietf.org/doc/html/rfc6749"
  - "https://datatracker.ietf.org/doc/html/rfc7519"
reviewed: false
---
