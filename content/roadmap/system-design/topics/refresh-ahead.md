---
id: refresh-ahead
title: Refresh-ahead
section: caching
why_here: Popular keys shouldn't make anyone wait when they expire.
summary: Refresh-ahead reloads hot entries shortly before they expire, so users rarely hit a miss. It works when you can predict what will be read again. Guess wrong and you spend database load refreshing data nobody wanted.
key_tradeoff: Fewer slow misses versus wasted refreshes.
cloud: cache
questions:
  - text: The homepage banner config is read 50,000 times a second and expires every minute. How do you avoid a burst of misses?
    weak_answer: Increase the TTL.
    red_note: then changes show late
    follow_ups:
      - type: technical
        text: When exactly do you trigger the refresh, and who does it?
      - type: failure
        text: The refresh call to the database fails. What do users get?
      - type: tradeoff
        text: Refresh-ahead, or just a lock so one request rebuilds on a miss?
      - type: measurement
        text: How do you tell which refreshes were wasted?
    strong_moves:
      - Refresh hot keys in the background when they're near expiry, say in the last 20% of the TTL.
      - Let one worker refresh each key, and keep serving the old value if the refresh fails.
      - Refresh only keys read recently, and let cold keys expire normally.
    asked_in: Technical deep dive · SDE-2 · often after “the cache keeps missing at peak”
  - text: A hot key expires during a sale and the database spikes. How do you stop it happening again?
    free: false
    guide_ref: be-cache-001
self_check:
  - Can you explain when refresh-ahead wastes work?
  - Can you compare refresh-ahead with locking on a miss?
reviewed: false
---
