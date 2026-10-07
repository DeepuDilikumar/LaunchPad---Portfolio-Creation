"use client";

import { useState } from "react";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/inputs";
import { SegmentedToggle } from "@/components/ui/segmented";
import { TabPanel, Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";

export function StyleguideInteractive() {
  const [seg, setSeg] = useState<"one" | "all">("one");
  const [tab, setTab] = useState<"claude" | "codex">("claude");
  const [pill, setPill] = useState<"a" | "b" | "c">("a");
  const [open, setOpen] = useState(false);
  const toast = useToast();

  return (
    <section aria-labelledby="sg-inter" className="space-y-6">
      <h2 id="sg-inter" className="t-h2 text-center">Controls</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-5">
          <h3 className="t-h3">Segmented toggle</h3>
          <SegmentedToggle
            label="Plan size"
            value={seg}
            onChange={setSeg}
            options={[
              { value: "one", label: "One project" },
              { value: "all", label: "All six" },
            ]}
          />
          <h3 className="t-h3">Tabs</h3>
          <Tabs
            idBase="sg-tabs"
            label="Tool"
            value={tab}
            onChange={setTab}
            items={[
              { value: "claude", label: "Claude Code" },
              { value: "codex", label: "Codex" },
            ]}
          />
          <TabPanel idBase="sg-tabs" value={tab} className="t-small text-text-2">
            {tab === "claude" ? "Claude Code prompt" : "Codex prompt"}
          </TabPanel>
          <Tabs
            label="Projects"
            variant="pill"
            value={pill}
            onChange={setPill}
            items={[
              { value: "a", label: "Messenger", dot: "#3CCFB4" },
              { value: "b", label: "Payments", dot: "#E7C04A" },
              { value: "c", label: "Short video", dot: "#EF5A4C" },
            ]}
          />
        </Card>
        <Card className="space-y-5">
          <h3 className="t-h3">Inputs, dialog, toast</h3>
          <Field label="Email" htmlFor="sg-email" hint="We'll send a sign-in link.">
            <Input id="sg-email" type="email" placeholder="you@example.com" />
          </Field>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setOpen(true)}>Open dialog</Button>
            <Button variant="secondary" onClick={() => toast("Published", "passed")}>
              Show toast
            </Button>
            <CopyButton text="pnpm test" />
          </div>
          <Dialog open={open} onClose={() => setOpen(false)} title="Save your progress" description="Sign in to keep your checkpoints and decisions.">
            <Button className="w-full" onClick={() => setOpen(false)}>
              Continue
            </Button>
          </Dialog>
        </Card>
      </div>
      <Accordion
        items={[
          { q: "Do I need to know how to code?", a: "You should be comfortable reading code." },
          { q: "Claude Code or Codex?", a: "Either. Every prompt has both versions." },
        ]}
      />
    </section>
  );
}
