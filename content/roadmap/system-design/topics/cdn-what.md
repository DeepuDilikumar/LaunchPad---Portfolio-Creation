---
id: cdn-what
title: What belongs on a CDN
section: cdn
why_here: Not everything should be served from far-away servers.
summary: A CDN keeps copies of content on servers close to users. Static files like images, scripts, fonts and videos are the obvious fit. Public pages that change rarely also work with short cache times. Personal or fast-changing data usually doesn't, unless you cache it per user at the edge with care.
key_tradeoff: Freshness versus distance.
cloud: cdn
questions:
  - text: Your food delivery app serves menus, dish photos and order status. Which of these would you put on a CDN, and why?
    weak_answer: Put everything on the CDN so it's fast.
    red_note: even order status?
    follow_ups:
      - type: technical
        text: A restaurant changes a dish price. How long until users see it?
      - type: failure
        text: A personalised page gets cached and shown to the wrong user. How did that happen?
      - type: tradeoff
        text: Cache the menu for 10 seconds or 10 minutes?
      - type: measurement
        text: Which number tells you the CDN is actually taking load off the origin?
    strong_moves:
      - Sort content by how often it changes and whether it differs per user.
      - Photos and scripts get long cache times with versioned file names; menus get short ones.
      - Keep per-user data like order status off the shared cache, or mark it private.
    asked_in: HLD round · SDE-2 · often after “design a food delivery app”
  - text: After a deploy, some users get the new HTML with old JavaScript from the CDN and the page breaks. Why?
    free: false
self_check:
  - Can you name three things that should never sit in a shared CDN cache?
  - Can you explain why versioned file names make long cache times safe?
india_note: "Comes up in e-commerce and food delivery HLD rounds when the interviewer asks how images load fast on slow mobile networks."
reviewed: false
---
