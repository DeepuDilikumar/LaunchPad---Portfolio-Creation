---
id: denormalisation
title: Denormalisation
section: databases
why_here: Joins get expensive at scale.
summary: "Denormalising stores copies of data where it's read, so a page needs one query instead of five joins. Reads get faster; writes get harder, because every copy must be updated. It's a deliberate trade: say which reads you're speeding up and how you keep the copies in sync."
key_tradeoff: Faster reads versus more complex, slower writes.
reviewed: false
---
