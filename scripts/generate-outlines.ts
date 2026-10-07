/**
 * Write an outline MDX file for every catalog module that has no file yet, or whose
 * file is still an outline. Never touches published modules.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { catalog, moduleFileName, type CatalogModule, type CatalogProject } from "../content/catalog";

const root = path.join(process.cwd(), "content", "projects");
let written = 0;

function minutesFor(m: CatalogModule) {
  if (m.order === 0) return 45;
  if (m.order === 5) return 120;
  if (m.order === 10) return 60;
  return 75;
}

function outline(p: CatalogProject, m: CatalogModule) {
  const yaml = [
    "---",
    `title: ${JSON.stringify(m.title)}`,
    `slug: ${m.slug}`,
    `project: ${p.slug}`,
    `order: ${m.order}`,
    `minutes: ${minutesFor(m)}`,
    `summary: ${JSON.stringify(m.summary)}`,
    "objectives:",
    ...m.objectives.map((o) => `  - ${JSON.stringify(o)}`),
    `status: outline`,
    `free: ${m.free}`,
    "---",
  ].join("\n");
  return `${yaml}

<Explain id="intro">
${m.summary}

This module is being written and tested end to end. It's releasing soon.
</Explain>

{/*
Cell skeleton (Part B fills this in; keep ids stable once published):

1. <Explain id="why">           Why this matters in a real system
2. <Diagram id="shape">         The structure you're about to build
3. <Prompt id="plan" mode="plan">   Plan with the agent
4. <Expect id="plan-output" kind="terminal">  What a good plan looks like (captured from a real run)
5. <Pitfall id="pitfall-1">     If the agent goes off track, with a recovery prompt
6. <Prompt id="build" mode="build"> Build it, tests first
7. <Checkpoint id="checkpoint-1" required>  The command that proves it works
8. <Decision id="decision-1">   What the agent proposed, what you kept, rejected or changed
9. <Interview id="interview-1"> A question an interviewer would ask about this
10. <Interview id="interview-2">
11. <Quiz id="check-1">
*/}
`;
}

for (const p of catalog) {
  const dir = path.join(root, p.slug);
  mkdirSync(dir, { recursive: true });
  for (const m of p.modules) {
    const file = path.join(dir, moduleFileName(m));
    if (existsSync(file)) {
      const head = readFileSync(file, "utf8").slice(0, 600);
      if (!/status:\s*outline/.test(head)) continue;
    }
    writeFileSync(file, outline(p, m));
    written++;
  }
}
console.log(`wrote ${written} outline files`);
