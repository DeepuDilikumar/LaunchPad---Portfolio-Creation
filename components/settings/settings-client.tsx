"use client"

import { Download, LogOut, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, type ReactNode } from "react"

import { GitHubIcon } from "@/components/icons/brand"
import { ThemeSegmented } from "@/components/theme/theme-segmented"
import { Button } from "@/components/ui/button"
import { inputClass } from "@/components/ui/field"
import { ResponsiveSheet } from "@/components/ui/responsive-sheet"
import { toast } from "@/components/ui/toaster"
import { clearDraft } from "@/lib/draft/draft-store"
import { cn } from "@/lib/utils"

const COMMON_ZONES = ["Asia/Kolkata", "Asia/Dubai", "Asia/Singapore", "Europe/London", "America/New_York", "America/Los_Angeles"]

function Card({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="font-medium">{title}</h2>
      {description ? <p className="mt-0.5 text-sm text-muted-foreground">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  )
}

async function put(body: Record<string, unknown>) {
  const r = await fetch("/api/settings", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
  if (!r.ok) throw new Error()
}

export function SettingsClient({
  email,
  isDemo,
  timezone: initialTz,
  reminderTime: initialTime,
  reminderEmail: initialOn,
  emailConfigured,
  github,
}: {
  email: string | null
  isDemo: boolean
  timezone: string
  reminderTime: string
  reminderEmail: boolean
  emailConfigured: boolean
  github: { login: string } | null
}) {
  const router = useRouter()
  const [tz, setTz] = useState(initialTz)
  const [time, setTime] = useState(initialTime)
  const [on, setOn] = useState(initialOn)
  const [gh, setGh] = useState(github)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const zones = COMMON_ZONES.includes(tz) ? COMMON_ZONES : [tz, ...COMMON_ZONES]

  async function save(body: Record<string, unknown>) {
    try {
      await put(body)
      toast("Saved")
    } catch {
      toast("Couldn't save that. Please try again.")
    }
  }

  async function disconnect() {
    setDisconnecting(true)
    try {
      const r = await fetch("/api/github/disconnect", { method: "POST" })
      if (!r.ok) throw new Error()
      setGh(null)
      toast("GitHub disconnected. Your repo and commits are still yours.")
    } catch {
      toast("Couldn't disconnect. Please try again.")
    } finally {
      setDisconnecting(false)
    }
  }

  async function deleteEverything() {
    setDeleting(true)
    try {
      const r = await fetch("/api/account/delete", { method: "POST" })
      const data = await r.json().catch(() => null)
      if (!r.ok) throw new Error(data?.error?.message ?? "Deletion didn't finish. Please try again.")
      clearDraft()
      router.replace("/?deleted=1")
      router.refresh()
    } catch (e) {
      setDeleting(false)
      toast(e instanceof Error ? e.message : "Deletion didn't finish.")
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card title="Appearance">
        <ThemeSegmented />
      </Card>

      <Card
        title="Daily reminder"
        description={
          isDemo
            ? "Demo account: reminder emails aren't sent, but you can try the settings."
            : emailConfigured
              ? "One short email on program days you haven't done yet. Never more than one a day."
              : "Email reminders aren't switched on for this server yet."
        }
      >
        <div className="flex flex-col gap-4">
          <label className="flex min-h-11 items-center justify-between gap-4">
            <span className="text-sm">Email me{email ? ` at ${email}` : ""}</span>
            <input
              type="checkbox"
              role="switch"
              checked={on}
              onChange={(e) => {
                setOn(e.target.checked)
                void save({ reminder_email: e.target.checked })
              }}
              className="size-5 accent-primary"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Time
              <input
                type="time"
                value={time}
                step={3600}
                disabled={!on}
                onChange={(e) => setTime(e.target.value)}
                onBlur={() => void save({ reminder_time: time })}
                className={inputClass}
              />
            </label>
            <label className="flex min-w-0 flex-col gap-1.5 text-sm font-medium">
              Timezone
              <select
                value={tz}
                onChange={(e) => {
                  setTz(e.target.value)
                  void save({ timezone: e.target.value })
                }}
                className={cn(inputClass, "pr-2")}
              >
                {zones.map((z) => (
                  <option key={z} value={z}>
                    {z.replace("_", " ")}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </Card>

      <Card title="GitHub" description="Used to create your project repo and check your daily commits.">
        {gh ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-sm">
              <GitHubIcon className="size-4" />
              Connected as <span className="font-medium">{gh.login}</span>
            </span>
            <Button variant="secondary" loading={disconnecting} onClick={() => void disconnect()}>
              Disconnect
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Not connected. You&apos;ll be asked when you start the program.</p>
        )}
      </Card>

      <Card title="Your data" description="Your resume is stored privately. Only you can see it.">
        <div className="flex flex-col gap-2 sm:flex-row">
          <a
            href="/api/account/export"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border px-5 text-sm font-medium hover:bg-muted"
          >
            <Download className="size-4" aria-hidden />
            Download my data
          </a>
          <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
            <Trash2 aria-hidden />
            Delete account and data
          </Button>
        </div>
      </Card>

      <form action="/auth/signout" method="post">
        <Button type="submit" variant="ghost" className="w-full sm:w-auto">
          <LogOut aria-hidden />
          Sign out
        </Button>
      </form>

      <ResponsiveSheet
        open={confirmOpen}
        onOpenChange={(o) => !deleting && setConfirmOpen(o)}
        title="Delete everything?"
        description="This can't be undone."
      >
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-muted-foreground">
          <li>Your resume files, profile, portfolio (the public link stops working), report and program progress are deleted now.</li>
          <li>We revoke our GitHub access. Your GitHub repo and commits stay yours.</li>
          <li>Payment receipts are kept for accounting, with your name removed.</li>
        </ul>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={deleting}>
            Keep my account
          </Button>
          <Button variant="destructive-solid" loading={deleting} onClick={() => void deleteEverything()}>
            Delete everything
          </Button>
        </div>
      </ResponsiveSheet>
    </div>
  )
}
