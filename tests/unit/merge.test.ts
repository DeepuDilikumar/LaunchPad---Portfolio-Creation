import { describe, expect, it } from "vitest"

import { applyUserEdit, isValidSlug, mergeAutofill, slugify } from "@/lib/draft/merge"
import { emptyProfile } from "@/lib/profile/types"

describe("mergeAutofill", () => {
  it("fills empty fields and records the source", () => {
    const { profile, fieldSources, changed } = mergeAutofill(
      emptyProfile(),
      {},
      { fullName: "Priya Nair", targetRole: "fullstack" },
      "resume"
    )
    expect(profile.fullName).toBe("Priya Nair")
    expect(profile.targetRole).toBe("fullstack")
    expect(fieldSources).toEqual({ fullName: "resume", targetRole: "resume" })
    expect(changed).toEqual(["fullName", "targetRole"])
  })

  it("never overwrites a field the student edited", () => {
    const start = mergeAutofill(emptyProfile(), {}, { targetRole: "fullstack" }, "resume")
    const edited = applyUserEdit(start.profile, start.fieldSources, "targetRole", "backend")
    const refined = mergeAutofill(edited.profile, edited.fieldSources, { targetRole: "frontend", fullName: "Priya N." }, "llm")
    expect(refined.profile.targetRole).toBe("backend")
    expect(refined.fieldSources.targetRole).toBe("user")
    expect(refined.profile.fullName).toBe("Priya N.")
  })

  it("does not erase values with empty incoming data", () => {
    const start = mergeAutofill(emptyProfile(), {}, { email: "a@b.co" }, "resume")
    const next = mergeAutofill(start.profile, start.fieldSources, { email: "" }, "llm")
    expect(next.profile.email).toBe("a@b.co")
  })

  it("merges skills without duplicates on refinement", () => {
    const skills = { languages: ["Java"], frameworks: [], databases: [], tools: [] }
    const start = mergeAutofill(emptyProfile(), {}, { skills }, "resume")
    const next = mergeAutofill(start.profile, start.fieldSources, { skills: { ...skills, languages: ["Java", "Python"] } }, "llm")
    expect(next.profile.skills.languages).toEqual(["Java", "Python"])
  })
})

describe("slugs", () => {
  it("builds clean slugs from names", () => {
    expect(slugify("Priya Nair")).toBe("priya-nair")
    expect(slugify("  Ánanya R. Rao!! ")).toBe("ananya-r-rao")
    expect(slugify("A")).toBe("")
  })
  it("validates slugs", () => {
    expect(isValidSlug("priya-nair")).toBe(true)
    expect(isValidSlug("-bad")).toBe(false)
    expect(isValidSlug("admin")).toBe(false)
    expect(isValidSlug("a--b")).toBe(false)
  })
})
