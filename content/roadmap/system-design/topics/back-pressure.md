---
id: back-pressure
title: Back pressure
section: async
why_here: If work arrives faster than it's processed, queues grow until something breaks.
summary: 'Back pressure means pushing back on producers when consumers can''t keep up: bounded queues, rejecting with a "try later" response, or slowing intake. Without it, queues grow without limit, latency explodes and memory runs out. A clear 503 is kinder than a timeout.'
key_tradeoff: Rejecting some work now versus failing everything later.
reviewed: false
---
