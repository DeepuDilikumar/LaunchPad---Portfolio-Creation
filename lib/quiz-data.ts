import fs from "node:fs";
import path from "node:path";
import { quizSchema, type Quiz } from "./quiz";

export function loadQuiz(slug: string): Quiz {
  const raw = fs.readFileSync(path.join(process.cwd(), "content", "quiz", `${slug}.json`), "utf8");
  return quizSchema.parse(JSON.parse(raw));
}
