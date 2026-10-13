---
id: be-obs-001
guide: backend
module: observability
title: "Users report errors, but every dashboard is green. Where do you look?"
rounds: [production-experience]
seniority: ["2-4", "4-8"]
intent: "Do they know the gaps between what's measured and what users experience?"
weak_answer: "If the dashboards are green, it's probably the user's network."
why_it_fails: "Green dashboards only prove the things you measure are fine. Users may be failing somewhere you don't measure."
red_note: "green only covers what you measure"
follow_ups:
  - type: technical
    question: "What might your server-side metrics never see?"
    what_it_tests: "Failures before requests reach your servers, and failures hidden in successes."
    strong_points:
      - "DNS, TLS, CDN or load balancer errors never reach your app metrics."
      - "Client-side errors and 200 responses with error bodies."
  - type: failure
    question: "The errors are real, but only 0.5% of requests. Why didn't alerts fire?"
    what_it_tests: "Averages across all traffic hide errors concentrated in one segment."
    strong_points:
      - "Spread across all traffic it's under the threshold, but it may be 100% of one endpoint, region or app version."
  - type: technical
    question: "How would you find the affected users' requests?"
    what_it_tests: "Using request IDs, logs and traces from a user report."
    strong_points:
      - "Get a request ID or timestamp from the user and search logs and traces."
      - "Break error rates down by app version, region and endpoint."
  - type: measurement
    question: "What would you add so this is caught next time?"
    what_it_tests: "User-centred SLIs and synthetic checks."
    strong_points:
      - "SLIs measured at the edge or on the client, per critical user journey."
      - "Synthetic checks from outside your network."
rejection_signals:
  - "Dismisses user reports because dashboards are green."
  - "Only looks at overall error rate."
answer_framework:
  - "Trust the users; the dashboards have a blind spot."
  - "Find one failing request and slice by version, region and endpoint."
  - "Measure from the user's side next time."
model_answer: "I'd trust the reports and assume my dashboards have a blind spot. First I'd get a concrete failing case, a request ID, timestamp or screenshot, and trace it. Then I'd slice errors by app version, region, endpoint and customer, because a small overall rate is often one segment failing completely. I'd also check layers my app metrics can't see: DNS, CDN, load balancer and client-side errors, and 200 responses carrying error bodies. Afterwards, I'd add SLIs measured at the edge for key user journeys and synthetic checks from outside our network."
self_check:
  - "Can you list three failures that never show up in app metrics?"
  - "Can you explain why a 0.5% error rate can hide a full outage?"
sources:
  - "https://sre.google/sre-book/service-level-objectives/"
  - "https://sre.google/sre-book/monitoring-distributed-systems/"
reviewed: false
---
