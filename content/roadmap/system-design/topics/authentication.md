---
id: authentication
title: Authentication
section: security
why_here: Before deciding what someone may do, you need to know who they are.
summary: "Authentication proves identity: passwords, one-time codes, OAuth sign-in, tokens. After login the client carries a session cookie or a signed token. Authorisation is the separate check of what that identity may access, and should happen on every object, not just at login."
cloud: auth
questions:
  - text: Design OTP login for a mobile app. What does the app hold after login, and how is it checked?
    weak_answer: Return a JWT and store it on the phone.
    red_note: for how long? revoked how?
    follow_ups:
      - type: technical
        text: How does the server check the token on every request?
      - type: failure
        text: A user's phone is stolen. How do you cut off that session?
      - type: tradeoff
        text: Short-lived tokens with refresh, or a server-side session?
      - type: measurement
        text: What would tell you someone is brute-forcing OTPs?
    strong_moves:
      - Verify the OTP with an expiry and attempt limits, then issue a short-lived access token and a refresh token.
      - Keep refresh tokens server-side, so one device can be logged out by deleting its token.
      - Check authorisation on every object the token touches, not only at login.
    asked_in: HLD round · SDE-2 · often after “design login for an app”
  - text: A user taps “log out of all devices”, but you use JWTs. How do you make that work?
    free: false
    guide_ref: be-sec-002
self_check:
  - Can you explain the difference between authentication and authorisation?
  - Can you describe how a refresh token flow works?
  - Can you say how you'd revoke a token before it expires?
india_note: "OTP login is the default in many Indian consumer apps, so expect OTP expiry, resend limits and SIM swap to come up."
reviewed: false
---
