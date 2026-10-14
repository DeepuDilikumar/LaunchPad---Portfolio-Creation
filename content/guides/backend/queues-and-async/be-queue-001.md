---
id: be-queue-001
guide: backend
module: queues-and-async
title: "The queue keeps growing overnight. Consumers look healthy. What's happening?"
rounds: [technical-deep-dive, production-experience]
seniority: ["2-4", "4-8"]
intent: "Throughput maths, back-pressure and poison messages."
weak_answer: "Add more consumers."
why_it_fails: "More consumers only help if consumers are the bottleneck. A poison message, a slow dependency or a partition limit makes extra consumers useless."
red_note: "what if one message blocks a partition?"
flow:
  nodes:
    - { label: "Producers" }
    - { label: "Queue", bad: true }
    - { label: "Consumers ×6" }
  note: "lag: 2M messages by 6 a.m."
follow_ups:
  - type: failure
    question: "One message fails forever. What happens to the ones behind it?"
    what_it_tests: "Head-of-line blocking in ordered queues and partitions."
    strong_points:
      - "In an ordered partition, a message that keeps failing blocks everything behind it."
      - "Bound the retries, then move it aside to a dead-letter queue."
  - type: tradeoff
    question: "Retry in place, or send it to a dead-letter queue?"
    what_it_tests: "Ordering guarantees against progress."
    strong_points:
      - "Retrying in place keeps order but stalls the partition."
      - "A dead-letter queue keeps things moving but breaks order for that key."
      - "Pick based on whether later messages for the same key depend on this one."
  - type: technical
    question: "You have 6 partitions and add 4 more consumers. What happens?"
    what_it_tests: "How partitions cap consumer parallelism."
    strong_points:
      - "In a Kafka consumer group, each partition goes to at most one consumer."
      - "With 6 partitions, consumers 7 to 10 sit idle."
  - type: measurement
    question: "How do you get alerted before morning?"
    what_it_tests: "Alerting on lag growth and time-to-drain, not just queue size."
    strong_points:
      - "Alert on consumer lag growing for N minutes, or on the age of the oldest message."
      - "Track arrival rate against processing rate."
  - type: ownership
    question: "Who replays the dead letters, and when?"
    what_it_tests: "Treating the dead-letter queue as owned work, not a bin."
    strong_points:
      - "An owner, a dashboard and a replay tool that is safe to run twice."
      - "Consumers must be idempotent so a replay does no harm."
rejection_signals:
  - "Scales consumers without checking partitions or the failure rate."
  - "Retries forever with no dead-letter queue."
  - "Alerts only on queue size."
answer_framework:
  - "Compare the arrival rate with the processing rate before adding anything."
  - "Look for a poison message holding a partition hostage."
  - "Bounded retries, a dead-letter queue, and a safe way to replay."
model_answer: "Healthy consumers with a growing queue means either work is arriving faster than it is processed, or processing is stuck. I'd start with two rates: messages in per second and messages completed per second, per partition. If one partition's lag grows while others are flat, a single message is probably failing and being retried forever, blocking everything behind it. The fix is bounded retries with backoff and a dead-letter queue, plus idempotent consumers so replays are safe. If every partition is behind, the bottleneck is processing time or a slow dependency, and adding consumers only helps up to the partition count. I'd alert on the age of the oldest message, which tells you how stale the system is."
self_check:
  - "Can you explain why consumers beyond the partition count sit idle?"
  - "Can you say when a dead-letter queue is the wrong choice?"
sources:
  - "https://kafka.apache.org/documentation/"
  - "https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html"
concepts: [message-queues, back-pressure]
reviewed: false
---
