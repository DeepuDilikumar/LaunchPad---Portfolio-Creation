"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { catalog, type ProjectSlug } from "@/content/catalog";
import { Tabs } from "@/components/ui/tabs";
import { LaptopFrame, PhoneFrame } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { DemoControl } from "@/components/demos/demo-control";
import { projectScreens } from "@/components/demos/project-screens";
import { useInViewLoop, useReduced } from "@/lib/hooks/use-in-view-loop";

// Order on the landing page: Foundations first, then the six projects.
const order: ProjectSlug[] = ["foundations", "pulse", "ledger", "reel", "dispatch", "scribe", "atlas"];
const items = order.map((s) => catalog.find((p) => p.slug === s)!);

export function ProjectSwitcher() {
  const [active, setActive] = useState<ProjectSlug>("pulse");
  const [interacted, setInteracted] = useState(false);
  const [paused, setPaused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInViewLoop(ref, 0.5);
  const reduced = useReduced();

  // Auto-advance every 6s until the user interacts.
  useEffect(() => {
    if (interacted || paused || !visible || reduced) return;
    const id = window.setInterval(() => {
      setActive((cur) => order[(order.indexOf(cur) + 1) % order.length]!);
    }, 6000);
    return () => window.clearInterval(id);
  }, [interacted, paused, visible, reduced]);

  const project = items.find((p) => p.slug === active)!;
  const Screen = projectScreens[active];
  const idBase = "switcher";

  return (
    <div ref={ref}>
      <div className="flex items-start justify-center gap-2">
        <Tabs
          idBase={idBase}
          label="Projects"
          variant="pill"
          value={active}
          onChange={(v) => {
            setInteracted(true);
            setActive(v);
          }}
          items={items.map((p) => ({ value: p.slug, label: p.tabLabel, dot: p.accent }))}
        />
      </div>
      {!interacted && !reduced ? (
        <div className="mt-3 flex justify-center">
          <DemoControl paused={paused} onToggle={() => setPaused((p) => !p)} label="project rotation" />
        </div>
      ) : null}

      <div
        role="tabpanel"
        id={`${idBase}-panel-${active}`}
        aria-labelledby={`${idBase}-tab-${active}`}
        className="mt-10 md:mt-14"
      >
        <div className="flex min-h-[560px] items-center justify-center md:min-h-[640px]">
          <AnimatePresence mode="wait" initial={false}>
            <m.div
              key={active}
              initial={{ opacity: 0, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.985 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
            >
              {project.frame === "phone" ? (
                <PhoneFrame label={`${project.name} app preview`}>
                  <Screen />
                </PhoneFrame>
              ) : (
                <LaptopFrame label={`${project.name} app preview`}>
                  <Screen />
                </LaptopFrame>
              )}
            </m.div>
          </AnimatePresence>
        </div>
        <p className="mx-auto mt-10 max-w-[620px] text-center t-body text-text-2" aria-live={interacted ? "polite" : "off"}>
          <span className="text-text-1 font-medium">{project.caption[0]}</span> {project.caption[1]}
        </p>
        <div className="mt-6 flex justify-center">
          <LinkButton href={`/projects/${project.slug}`} variant="secondary">
            View the syllabus
          </LinkButton>
        </div>
      </div>
    </div>
  );
}
