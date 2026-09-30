import { NextResponse } from "next/server"

import { exportAccount } from "@/lib/account/delete"
import { isResponse, userOrUnauthorized } from "@/lib/auth/api"

export async function GET() {
  const user = await userOrUnauthorized()
  if (isResponse(user)) return user
  const data = await exportAccount(user.id)
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "content-type": "application/json",
      "content-disposition": 'attachment; filename="launchpad-my-data.json"',
      "cache-control": "no-store",
    },
  })
}
