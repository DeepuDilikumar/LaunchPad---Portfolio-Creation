---
slug: kafka-interview-questions-for-experienced
title: "Kafka interview questions for experienced engineers: the follow-ups that matter"
description: "The Kafka question experienced engineers get, the three follow-ups that come next, and how a strong answer handles each one."
keywords:
  [
    "kafka interview questions for experienced",
    "kafka consumer lag interview",
    "kafka partitions interview question",
  ]
published: "2026-10-13"
updated: "2026-10-13"
guide: backend
module: queues-and-async
primary: "Consumer lag on your Kafka topic keeps growing, but the consumers look healthy. What's happening?"
follow_ups:
  - type: technical
    question: "You have 6 partitions and scale to 10 consumers. What happens?"
    what_it_tests: "Whether you know a partition goes to at most one consumer in a group, so 4 consumers sit idle."
  - type: failure
    question: "One message throws an exception every time. What happens to the messages behind it?"
    what_it_tests: "Head-of-line blocking: an ordered partition stalls behind a poison message."
  - type: tradeoff
    question: "Retry in place, or move it to a dead-letter topic?"
    what_it_tests: "Weighing ordering for that key against keeping the partition moving."
outline:
  - "Compare the arrival rate with the processing rate, per partition, before changing anything."
  - "If one partition lags while others are flat, look for a poison message or a hot key."
  - "Bound retries, send failures to a dead-letter topic, and make consumers idempotent so replays are safe."
  - "Alert on lag growth or the age of the oldest message, not on lag size alone."
---

Most Kafka interview questions for experienced engineers don't stop at "what is a partition?". The interviewer asks a production question, waits for the first answer, and then pushes on the part you skipped.

Here is one primary question and the three follow-ups that usually come after it. Try answering each one out loud before reading what it tests.

## Why the first answer isn't enough

The common first answer is "add more consumers". It's not wrong, but it assumes consumers are the bottleneck. Interviewers use the follow-ups to find out whether you know when that assumption breaks: partition limits, a single message that fails forever, or a slow downstream call.

## How to practise this

Pick a queue or topic from your own work. For each follow-up, say what would happen in that system, what you'd measure, and what you'd change. A real example beats a perfect definition.
