---
id: push-cdn
title: Push CDN
section: cdn
why_here: Some content is big and known in advance.
summary: With a push CDN you upload content to the CDN yourself when it changes. Nothing waits on a first miss, which suits large files and rarely changing assets like video. You manage uploads, expiry and storage, and you pay for space whether or not anyone downloads the file.
key_tradeoff: Control and no cold misses versus storage cost and upload work.
cloud: cdn
questions:
  - text: You run a video learning platform with 2 GB lecture files. Pull or push CDN, and how do new videos get there?
    weak_answer: Push, because it's faster.
    red_note: faster for whom?
    follow_ups:
      - type: ownership
        text: Who uploads to the CDN, and what happens if that job fails halfway?
      - type: tradeoff
        text: You pay for storage on files nobody watches. When is that worth it?
      - type: failure
        text: A lecture is re-recorded. How do you stop users getting the old file?
      - type: measurement
        text: How would you know every video in the catalogue is actually on the CDN?
    strong_moves:
      - Large, known-in-advance files suit push because no viewer waits on a slow first fetch.
      - Make the upload part of publishing, and only mark a video live once it's on the CDN.
      - Use a new path for each version so old copies never get mixed with new ones.
    asked_in: HLD round · SDE-2 · often inside “design a video streaming platform”
  - text: Your publishing job pushed half of a new course to the CDN, then crashed. Users are already clicking. What now?
    free: false
self_check:
  - Can you say when push beats pull, and when it wastes money?
  - Can you describe how you'd replace a file that's already been pushed?
reviewed: false
---
