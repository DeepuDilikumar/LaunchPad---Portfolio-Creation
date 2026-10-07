import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { mock } from "@/lib/env";
import { AppHeader } from "@/components/app/app-header";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Settings", robots: { index: false } };

export default async function SettingsPage() {
  const user = await requireUser("/settings");
  const p = user.profile;
  return (
    <>
      <AppHeader user={user} />
      <main id="main" className="container-bp max-w-[640px] pb-24 pt-10 md:pt-14">
        <h1 className="t-h2 text-text-1">Settings</h1>
        <SettingsForm
          initial={{
            name: p.name,
            handle: p.handle,
            headline: p.headline,
            githubUsername: p.githubUsername ?? "",
            preferredTool: (p.preferredTool as "claude" | "codex" | "cursor") ?? "claude",
            isPublic: p.isPublic,
            marketingEmails: p.marketingEmails,
          }}
          email={user.email ?? ""}
          githubFromOAuth={!mock.auth && !!p.githubUsername}
        />
      </main>
    </>
  );
}
