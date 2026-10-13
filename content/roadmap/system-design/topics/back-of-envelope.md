---
id: back-of-envelope
title: Back-of-envelope maths
section: numbers
why_here: You need rough numbers to know if one machine is enough or you need fifty.
summary: "Turn users into requests per second, requests into bytes, bytes into storage per year. Round hard: a day is about 100,000 seconds; 1 million requests a day is about 12 per second. Ten minutes of honest arithmetic tells you whether caching, sharding or a queue is even needed."
key_tradeoff: "Precision versus speed: be within 10×, not exact."
flow:
  nodes:
    - label: Users
    - label: Requests/sec
    - label: Bytes/day
      bad: true
  note: round hard, stay within 10×
questions:
  - text: We expect 10 million daily users on a photo app. Roughly how much storage do we need per year?
    weak_answer: A lot. We'll use S3, it scales.
    red_note: that's a service, not a number
    follow_ups:
      - type: measurement
        text: How many photos does one user upload a day, and how big is one?
      - type: tradeoff
        text: Do we keep originals, thumbnails or both? What does that do to the number?
      - type: failure
        text: Your estimate is 10× too low. Which part of the design breaks first?
      - type: ownership
        text: Which assumption would you check with the product team first?
    strong_moves:
      - "Write the assumptions down: 10M users × 2 photos × 2 MB ≈ 40 TB a day."
      - "Multiply out: about 15 PB a year, before replicas and thumbnails."
      - "Say what it changes: object storage plus a CDN, and lifecycle rules for old photos."
    asked_in: HLD round · SDE-2 · the first ten minutes of almost any design
  - text: How many servers do we need for 50,000 requests per second at peak?
    free: false
self_check:
  - Can you turn daily users into requests per second in your head?
  - Do you know roughly how many seconds are in a day?
india_note: Interviewers at Indian product companies often skip this step themselves, then reward you for doing it unprompted.
reviewed: false
---
