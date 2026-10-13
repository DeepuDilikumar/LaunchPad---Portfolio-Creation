---
id: wide-column
title: Wide-column stores
section: databases
why_here: Huge write volumes need a store built to spread them.
summary: Wide-column stores like Cassandra or Bigtable group data by a partition key and sort rows within it. They take enormous write volumes and scale across many machines. Queries must follow the key design closely; ad hoc queries are expensive or impossible.
cloud: wide-column
reviewed: false
---
