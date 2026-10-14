---
id: metrics-slos
title: Metrics and SLOs
section: monitoring
why_here: You can't fix what you can't see.
summary: 'Metrics are numbers over time: request rate, errors, latency, saturation. An SLO is a target for a user-facing metric, like "99.9% of checkouts succeed in under 500 ms". Alert on SLOs burning, not on every CPU spike.'
cloud: monitoring
questions:
  - text: You own the checkout service. What would you alert on, and when should someone be woken up?
    weak_answer: Alert when CPU goes above 80%.
    red_note: users don't feel cpu
    follow_ups:
      - type: technical
        text: How would you write the checkout SLO precisely?
      - type: measurement
        text: Why use p99 latency rather than the average?
      - type: tradeoff
        text: A tight SLO with more pages, or a loose one with unhappy users?
      - type: ownership
        text: The error budget is spent. Who decides to pause releases?
    strong_moves:
      - Measure what users feel, which is request rate, errors and latency percentiles for checkout.
      - Set an SLO, such as 99.9% of checkouts succeeding under 500 ms over 30 days.
      - Page on fast error-budget burn; leave CPU and disk on dashboards, not pagers.
    asked_in: Technical deep dive · SDE-2/SDE-3
  - text: Users report errors, but every dashboard is green. Where do you look?
    free: false
    guide_ref: be-obs-001
self_check:
  - Can you explain the difference between an SLI, an SLO and an error budget?
  - Can you say why averages hide slow requests?
reviewed: false
---
