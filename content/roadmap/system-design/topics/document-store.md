---
id: document-store
title: Document stores
section: databases
why_here: Some data is naturally a nested object.
summary: Document stores keep JSON-like documents and can query fields inside them. They suit records that are read together, like a product with its attributes. Joins are weak or missing, so you usually duplicate data to keep reads to one document.
cloud: nosql
questions:
  - text: A marketplace sells phones, shirts and sofas, each with different attributes. Would you store products in a document store?
    weak_answer: Yes, MongoDB, because it's schemaless.
    red_note: schemaless isn't a reason
    follow_ups:
      - type: technical
        text: How do you filter by brand and price range across all categories?
      - type: tradeoff
        text: "Postgres with a JSONB column, or a document store: which, and why?"
      - type: failure
        text: Every new review is pushed into the product document. What breaks after a year?
      - type: ownership
        text: With no fixed schema, who stops a bad field from being written?
    strong_moves:
      - "Start from the read: a product page loads one product with all its attributes, which fits one document."
      - Index the fields you filter on, and keep unbounded lists like reviews in their own collection.
      - "Validate the shape in code or with schema rules: schemaless only moves the schema into the app."
    asked_in: HLD round · SDE-2 · often after “design a product catalogue”
  - text: An order and its payment live in two separate documents and must change together. How do you keep them consistent?
    free: false
self_check:
  - Can you say when to embed data and when to reference it?
  - Can you explain what a document store does badly?
reviewed: false
---
