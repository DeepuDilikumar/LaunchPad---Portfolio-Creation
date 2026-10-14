---
id: be-dsn-002
guide: backend
module: design-shorts
title: "Design the 'resend OTP' button so it can't be abused."
rounds: [system-design]
seniority: ["2-4", "4-8"]
intent: "Abuse limits on several keys, SMS cost and OTP security."
weak_answer: "Disable the button for 30 seconds on the frontend."
why_it_fails: "Attackers call the API directly. The frontend timer protects nothing, and every SMS costs money."
red_note: "attackers skip the button"
follow_ups:
  - type: technical
    question: "Which keys do you rate-limit on?"
    what_it_tests: "Layered limits against distributed abuse."
    strong_points:
      - "Per phone number, per IP or device, and a global limit per destination country."
      - "A cooldown between sends and a daily cap per number."
  - type: failure
    question: "An attacker uses your endpoint to send SMS to thousands of numbers. How do you stop it?"
    what_it_tests: "SMS pumping and cost controls."
    strong_points:
      - "Global spend alerts and per-prefix limits."
      - "CAPTCHA or proof-of-work after a threshold."
  - type: technical
    question: "How do you store and check the OTP itself?"
    what_it_tests: "Hashing, expiry and attempt limits."
    strong_points:
      - "Store a hash with an expiry of a few minutes."
      - "Limit verification attempts per OTP, then invalidate it."
      - "A resend invalidates the previous code."
  - type: measurement
    question: "What would you monitor?"
    what_it_tests: "Cost and abuse signals."
    strong_points:
      - "Sends per minute, verification success rate and spend per country or prefix."
      - "A falling success rate with rising sends signals abuse."
rejection_signals:
  - "Relies on a frontend timer."
  - "Stores OTPs in plain text without attempt limits."
answer_framework:
  - "Enforce limits server-side on number, IP or device, and globally."
  - "Hash OTPs with expiry and attempt limits."
  - "Watch cost and success rate to catch abuse."
model_answer: "The button is only UX; the protection lives on the server. I'd apply layered limits: a cooldown and a daily cap per phone number, limits per IP and device, and global caps per country or prefix to stop SMS pumping. After a threshold, require a CAPTCHA. OTPs are stored hashed with a short expiry, a resend invalidates the previous code, and each code allows only a few verification attempts. I'd monitor sends per minute, spend by prefix and verification success rate, because many sends with few verifications is the clearest sign of abuse."
self_check:
  - "Can you name three keys to rate-limit on?"
  - "Can you explain SMS pumping?"
sources:
  - "https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html"
  - "https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks"
concepts: [rate-limiting, authentication]
reviewed: false
---
