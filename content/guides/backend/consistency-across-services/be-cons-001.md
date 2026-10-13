---
id: be-cons-001
guide: backend
module: consistency-across-services
title: "The order was saved, but the 'order placed' event never reached inventory. How?"
rounds: [technical-deep-dive, system-design]
seniority: ["4-8"]
intent: "Do they spot the dual write and know the transactional outbox?"
weak_answer: "Kafka must have lost the message."
why_it_fails: "The usual cause is the service writing to the database and publishing separately, and crashing between the two."
red_note: "two writes, no transaction"
flow:
  nodes:
    - { label: "Orders DB" }
    - { label: "publish()", bad: true }
    - { label: "Inventory" }
  note: "crash between the two writes"
follow_ups:
  - type: failure
    question: "Where exactly can the service crash to cause this?"
    what_it_tests: "Seeing the dual write gap."
    strong_points:
      - "After the database commit and before the publish succeeds."
      - "Or the publish succeeds and the commit fails, so inventory sees an order that doesn't exist."
  - type: technical
    question: "How does an outbox table fix it?"
    what_it_tests: "Writing the event in the same transaction as the state change."
    strong_points:
      - "Insert the event into an outbox table in the same transaction as the order."
      - "A relay reads the outbox and publishes, marking rows as sent."
      - "Or use change data capture on the outbox table."
  - type: tradeoff
    question: "The relay can publish an event twice. Is that acceptable?"
    what_it_tests: "Pairing the outbox with idempotent consumers."
    strong_points:
      - "Yes, it's at-least-once; consumers dedupe on the event ID."
  - type: measurement
    question: "How would you detect events stuck in the outbox?"
    what_it_tests: "Monitoring outbox lag."
    strong_points:
      - "Alert on the age of the oldest unsent outbox row."
rejection_signals:
  - "Blames the broker without checking the write path."
  - "Suggests a distributed transaction as the first answer."
answer_framework:
  - "Name the dual write: database and broker without one transaction."
  - "Write the event to an outbox in the same transaction."
  - "Relay at least once, and make consumers idempotent."
model_answer: "The likely cause is a dual write. The service commits the order and then publishes the event as a separate step; if it crashes or the publish fails in between, the order exists but the event never does. I'd fix it with a transactional outbox: the order and an outbox row are written in one database transaction, and a relay publishes outbox rows to the broker and marks them sent. The relay may publish twice, so consumers dedupe on the event ID. I'd alert on the age of the oldest unsent row so a stuck relay is caught quickly."
self_check:
  - "Can you describe the crash window in one sentence?"
  - "Can you explain why consumers still need dedupe with an outbox?"
sources:
  - "https://microservices.io/patterns/data/transactional-outbox.html"
  - "https://debezium.io/documentation/reference/stable/transformations/outbox-event-router.html"
concepts: [event-driven-jobs, message-queues, eventual-consistency]
reviewed: false
---
