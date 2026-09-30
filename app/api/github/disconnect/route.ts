import { NextResponse } from "next/server"

import { isResponse, isSameOrigin, jsonError, userOrUnauthorized } from "@/lib/auth/api"
import { deleteGithubConnection, revokeGithubGrant } from "@/lib/github/client"

/** Revokes our access on GitHub and forgets the token. Their repo and commits stay theirs. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "forbidden", "Request blocked.")
  const user = await userOrUnauthorized()
  if (isResponse(user)) return user
  await revokeGithubGrant(user.id)
  await deleteGithubConnection(user.id)
  return NextResponse.json({ ok: true })
}
