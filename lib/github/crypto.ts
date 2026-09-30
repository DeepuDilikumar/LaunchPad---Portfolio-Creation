import "server-only"

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto"

/** GitHub access tokens are stored encrypted (AES-256-GCM). The key never leaves the server. */
function key() {
  const secret = process.env.GITHUB_TOKEN_ENC_KEY
  if (!secret) throw new Error("GITHUB_TOKEN_ENC_KEY is not set")
  return createHash("sha256").update(secret).digest()
}

export function encryptToken(token: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key(), iv)
  const data = Buffer.concat([cipher.update(token, "utf8"), cipher.final()])
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString("base64url")).join(".")
}

export function decryptToken(payload: string): string {
  const [iv, tag, data] = payload.split(".").map((p) => Buffer.from(p, "base64url"))
  const decipher = createDecipheriv("aes-256-gcm", key(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8")
}
