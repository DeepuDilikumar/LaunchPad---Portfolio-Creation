---
id: pull-cdn
title: Pull CDN
section: cdn
why_here: Most sites want the CDN to fetch content on its own.
summary: A pull CDN fetches a file from your origin the first time someone asks for it, then serves the cached copy until it expires. Setup is easy and only popular files take space. The first user in each region pays the slow fetch, and a cache miss storm can hit your origin hard.
key_tradeoff: Easy setup versus cold-start misses.
cloud: cdn
reviewed: false
---
