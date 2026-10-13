---
id: weak-consistency
title: Weak consistency
section: availability-vs-consistency
why_here: Some data is fine to lose or see late.
summary: With weak consistency a read after a write may or may not see it, and nobody promises when. That suits live video, game positions and metrics where the next update replaces the last. It is the cheapest and fastest option, and wrong for anything users will check later, like money or messages.
reviewed: false
---
