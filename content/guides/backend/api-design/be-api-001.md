---
id: be-api-001
guide: backend
module: api-design
title: "Your API needs a breaking change, but old app versions stay live for months. How do you ship it?"
rounds: [technical-deep-dive, system-design]
seniority: ["2-4", "4-8"]
intent: "Versioning, additive change and measured deprecation."
weak_answer: "Release v2 and ask everyone to update the app."
why_it_fails: "Mobile users don't update on your schedule. Breaking old clients breaks paying users."
red_note: "you can't force an app update"
follow_ups:
  - type: technical
    question: "Can you avoid the breaking change entirely?"
    what_it_tests: "Additive changes and tolerant readers."
    strong_points:
      - "Add new fields instead of renaming; keep old fields until no client reads them."
      - "Accept both the old and new request shapes for a while."
  - type: tradeoff
    question: "Version in the URL, a header, or not at all?"
    what_it_tests: "Weighing routing simplicity against API sprawl."
    strong_points:
      - "URL versions are easy to route and cache but invite whole-API forks."
      - "Per-field evolution with deprecation avoids forks but needs discipline."
  - type: measurement
    question: "How do you know when it's safe to delete the old behaviour?"
    what_it_tests: "Usage telemetry by client version."
    strong_points:
      - "Log the client version and the endpoints or fields each version uses."
      - "Remove only when traffic from old versions is near zero, and announce dates."
  - type: failure
    question: "A forced-update screen ships, but some users are on versions that can't show it. What then?"
    what_it_tests: "Planning for clients that can't be reached."
    strong_points:
      - "Keep a minimal compatible path for very old versions, or a clear error the old app already renders."
      - "Plan a minimum-version check into every future release."
rejection_signals:
  - "Breaks old clients without measuring who still uses them."
  - "Forks the whole API for one field."
answer_framework:
  - "Prefer additive change so nothing breaks."
  - "When it must break, run old and new side by side."
  - "Measure usage per client version and delete only at zero."
model_answer: "First I'd try to make it additive: add the new field or endpoint, keep the old one working, and let new app versions use the new shape. If it truly must break, I'd run both behaviours side by side, selected by a version header or path, and log which client versions use which. Old behaviour is removed only when its traffic is near zero, with dates announced. I'd also make sure the app has a minimum-version check, so the next breaking change can show an upgrade prompt instead of failing silently."
self_check:
  - "Can you name two ways to evolve an API without breaking it?"
  - "Can you say which metric unlocks deleting old behaviour?"
sources:
  - "https://cloud.google.com/apis/design/compatibility"
  - "https://www.rfc-editor.org/rfc/rfc9110"
concepts: [rpc-vs-rest, http]
reviewed: false
---
