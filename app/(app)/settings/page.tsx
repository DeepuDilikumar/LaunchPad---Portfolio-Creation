import type { Metadata } from "next"

import { SettingsClient } from "@/components/settings/settings-client"
import { requireUser } from "@/lib/auth/session"
import { DEFAULT_TIMEZONE, getProfile } from "@/lib/data/profiles"
import { isEmailConfigured } from "@/lib/env"
import { getGithubConnection } from "@/lib/github/client"

export const metadata: Metadata = { title: "Settings", robots: { index: false } }

export default async function SettingsPage() {
  const user = await requireUser("/settings")
  const [profile, github] = await Promise.all([getProfile(user.id), getGithubConnection(user.id)])
  return (
    <div className="mx-auto max-w-2xl px-4 pt-6 sm:px-6 md:pt-10">
      <h1 className="text-h1 font-normal">Settings and privacy</h1>
      <p className="mt-1 text-muted-foreground">{user.isDemo ? "Demo account. Data stays on this computer." : user.email}</p>
      <div className="mt-6">
        <SettingsClient
          email={profile?.email ?? user.email}
          isDemo={user.isDemo}
          timezone={profile?.timezone ?? DEFAULT_TIMEZONE}
          reminderTime={profile?.reminder_time ?? "08:00"}
          reminderEmail={profile?.reminder_email ?? true}
          emailConfigured={isEmailConfigured()}
          github={github ? { login: github.login } : null}
        />
      </div>
    </div>
  )
}
