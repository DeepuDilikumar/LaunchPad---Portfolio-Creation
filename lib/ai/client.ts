import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";

let client: Anthropic | null = null;

export function anthropic() {
  client ??= new Anthropic({ apiKey: env.anthropicKey, maxRetries: 2, timeout: 60_000 });
  return client;
}

export const model = () => env.anthropicModel;
