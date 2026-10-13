---
id: refresh-ahead
title: Refresh-ahead
section: caching
why_here: Popular keys shouldn't make anyone wait when they expire.
summary: Refresh-ahead reloads hot entries shortly before they expire, so users rarely hit a miss. It works when you can predict what will be read again. Guess wrong and you spend database load refreshing data nobody wanted.
key_tradeoff: Fewer slow misses versus wasted refreshes.
cloud: cache
reviewed: false
---
