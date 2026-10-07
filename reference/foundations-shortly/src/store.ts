import { randomBytes } from "node:crypto";

const ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function code(length = 6) {
  const bytes = randomBytes(length);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export function createStore() {
  const links = new Map<string, string>();
  return {
    create(url: string): string {
      const parsed = new URL(url);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        throw new Error("Only http and https URLs can be shortened");
      }
      let c = code();
      while (links.has(c)) c = code();
      links.set(c, parsed.toString());
      return c;
    },
    resolve(c: string): string | undefined {
      return links.get(c);
    },
  };
}
