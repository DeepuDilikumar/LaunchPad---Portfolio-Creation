import "server-only"

import { isEmailConfigured } from "@/lib/env"

/** Sends one email through Resend's REST API. Returns false when email isn't set up or the send fails. */
export async function sendEmail(to: string, subject: string, text: string): Promise<boolean> {
  if (!isEmailConfigured()) return false
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ from: process.env.REMINDER_FROM_EMAIL, to, subject, text }),
    })
    return r.ok
  } catch {
    return false
  }
}
