import type { Metadata } from "next";
import { Button, LinkButton } from "@/components/ui/button";
import { AccentAvatar, Pill, StatusChip } from "@/components/ui/pill";
import { AppWindow, Card, LaptopFrame, PhoneFrame } from "@/components/ui/card";
import { Caret } from "@/components/ui/caret";
import { ProgressRing } from "@/components/ui/progress-ring";
import { accents } from "@/lib/accents";
import { StyleguideInteractive } from "./interactive";

export const metadata: Metadata = { title: "Styleguide", robots: { index: false } };

const swatches = [
  ["--bg", "#000000"],
  ["--surface-1", "#121212"],
  ["--surface-2", "#1C1C1C"],
  ["--surface-3", "#262626"],
  ["--text-1", "#F5F5F5"],
  ["--text-2", "#9B9B9B"],
  ["--text-3", "#5F5F5F"],
  ["--invert-bg", "#FFFFFF"],
];

export default function Styleguide() {
  return (
    <main id="main" className="container-bp py-16 space-y-20">
      <header className="text-center space-y-4">
        <p className="t-small text-text-2">Styleguide</p>
        <h1 className="t-hero">
          Build what big tech runs
          <span className="ml-3 inline-block align-[-0.08em]">
            <Caret size={52} track intro />
          </span>
        </h1>
        <p className="t-body text-text-2 mx-auto max-w-[560px]">
          Tokens, type and primitives. Every screen in the product is built from these.
        </p>
      </header>

      <section aria-labelledby="sg-type" className="space-y-6">
        <h2 id="sg-type" className="t-h2 text-center">Type</h2>
        <Card className="space-y-4">
          <p className="t-hero">Hero 64/68</p>
          <p className="t-h2">Section 40/46</p>
          <p className="t-h3">Card title 18/24</p>
          <p className="t-body text-text-2">Body 16/26. Calm, precise, a senior engineer pairing with you.</p>
          <p className="t-small text-text-2">Small 13/18 for captions</p>
          <p className="t-badge">Badge 12/16</p>
          <p className="font-mono text-[13px] text-text-1">pnpm test → ✓ 6 passed</p>
        </Card>
      </section>

      <section aria-labelledby="sg-color" className="space-y-6">
        <h2 id="sg-color" className="t-h2 text-center">Color</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {swatches.map(([name, hex]) => (
            <div key={name} className="rounded-[16px] border border-line bg-surface-1 p-3">
              <div className="h-14 rounded-[10px] border border-line" style={{ background: hex }} />
              <p className="mt-2 t-small text-text-1">{name}</p>
              <p className="t-small text-text-2">{hex}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {Object.entries(accents).map(([k, v]) => (
            <span key={k} className="inline-flex items-center gap-2 t-small text-text-2">
              <AccentAvatar color={v} label={k} size={24} /> {k}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusChip status="working">Working</StatusChip>
          <StatusChip status="passed">Passed</StatusChip>
          <StatusChip status="failed">Failed</StatusChip>
          <StatusChip status="idle">Not started</StatusChip>
        </div>
      </section>

      <section aria-labelledby="sg-buttons" className="space-y-6">
        <h2 id="sg-buttons" className="t-h2 text-center">Buttons and pills</h2>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button>Start free</Button>
          <Button variant="secondary">See the projects</Button>
          <Button variant="ghost">Ghost</Button>
          <Button size="sm">Small</Button>
          <Button disabled>Disabled</Button>
          <LinkButton href="/projects" variant="secondary">
            Link button
          </LinkButton>
          <Pill href="/projects/pulse">New: build a real-time messenger ↗</Pill>
          <ProgressRing value={0.66} color={accents.pulse} size={24} label="66% complete" />
        </div>
      </section>

      <StyleguideInteractive />

      <section aria-labelledby="sg-frames" className="space-y-6">
        <h2 id="sg-frames" className="t-h2 text-center">Frames</h2>
        <AppWindow title="Pulse · Module 3 · Delivery receipts">
          <div className="p-6 t-body text-text-2">App window body</div>
        </AppWindow>
        <div className="grid gap-10 md:grid-cols-2 items-center">
          <PhoneFrame>
            <div className="flex h-full items-center justify-center t-small text-text-2">Phone</div>
          </PhoneFrame>
          <LaptopFrame>
            <div className="flex h-full items-center justify-center t-small text-text-2">Laptop</div>
          </LaptopFrame>
        </div>
      </section>

      <section aria-labelledby="sg-caret" className="space-y-6">
        <h2 id="sg-caret" className="t-h2 text-center">Caret</h2>
        <Card className="relative h-[280px] overflow-hidden">
          <h3 className="t-h2 max-w-[420px]">Learn like you&apos;re already on the team</h3>
          <div className="absolute -bottom-24 right-10">
            <Caret size={300} track />
          </div>
        </Card>
        <div className="flex items-end justify-center gap-8">
          <Caret size={24} />
          <Caret size={40} />
          <Caret size={64} track />
        </div>
      </section>
    </main>
  );
}
