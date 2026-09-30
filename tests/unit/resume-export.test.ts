import { describe, expect, it } from "vitest"

import { buildResumeDocument, chosenText, collectBullets, type RewriteBullet } from "@/lib/resume/document"
import { escapeLatex, toLatex } from "@/lib/resume/latex"
import { ruleRewrite } from "@/lib/resume/rewrite-rules"
import { emptyProfile } from "@/lib/profile/types"

describe("rule rewrite", () => {
  it("strengthens weak openers without inventing numbers", () => {
    expect(ruleRewrite("worked on the login API.")).toBe("Built the login API, cutting response time by [X%]")
    expect(ruleRewrite("developed a chat app for clubs")).toBe("Built a chat app for clubs, used by [N users]")
    expect(ruleRewrite("Reduced page load by 40%")).toBe("Reduced page load by 40%")
  })
})

describe("resume export", () => {
  const profile = {
    ...emptyProfile(),
    fullName: "Priya Nair",
    email: "priya@example.com",
    projects: [{ id: "p1", title: "Webhook Engine", description: "", tech: ["Go", "Redis"], link: "", bullets: ["worked on retries", "added 100% test coverage"] }],
  }

  it("uses accepted, edited or original text per bullet", () => {
    const base = collectBullets(profile)
    const bullets: RewriteBullet[] = base.map((b, i) => ({
      ...b,
      suggested: `S${i}`,
      final: `F${i}`,
      status: i === 0 ? "accepted" : "rejected",
    }))
    expect(bullets.map(chosenText)).toEqual(["S0", "added 100% test coverage"])
    const doc = buildResumeDocument(profile, bullets)
    expect(doc.projects[0].bullets).toEqual(["S0", "added 100% test coverage"])
  })

  it("escapes LaTeX special characters", () => {
    expect(escapeLatex("100% & C#_x")).toBe("100\\% \\& C\\#\\_x")
    const tex = toLatex(buildResumeDocument(profile, []))
    expect(tex).toContain("\\section*{Projects}")
    expect(tex).toContain("100\\% test coverage")
    expect(tex).not.toContain("\\section*{Experience}")
  })
})
