import { describe, expect, it } from "vitest"

import { extractResumeProfile } from "@/lib/resume/parse-profile"

const PRIYA = `PRIYA NAIR - RESUME
Kochi, Kerala | priya.nair.dev@gmail.com | +91 98470 12345
github.com/priyanair | linkedin.com/in/priya-nair-dev

OBJECTIVE
Aspiring Full Stack developer looking for an SDE-1 role at a product company.

EDUCATION
Model Engineering College, Kochi
B.Tech in Computer Science and Engineering | 2022 - 2026 | CGPA: 8.4/10

TECHNICAL SKILLS
Languages: Java, Python, JavaScript, SQL
Frameworks: Spring Boot, React, Node.js, Express
Databases: MySQL, MongoDB, Redis
Tools: Git, Docker, Postman, AWS

PROJECTS
Weather App | React, OpenWeather API
• Built a weather dashboard showing 5-day forecasts for any city.
• Deployed on Netlify.
To-Do Manager | Node.js, Express, MongoDB
• REST API with JWT auth for managing personal tasks.
• github.com/priyanair/todo-api

EXPERIENCE
Web Development Intern at Kerala Startup Mission | Jun 2024 - Aug 2024
• Built admin screens in React for a startup dashboard used by 40 staff.

ACHIEVEMENTS
Finalist, Smart India Hackathon 2024`

const MESSY = `RAHUL KUMAR VERMA
rahulverma99@outlook.com  8123456789  Pune
Curriculum Vitae

Career Objective:
To obtain a challenging position in a reputed organisation as a backend engineer.

Academic Details
Bachelor of Engineering (Information Technology)
Pune Institute of Computer Technology    2021 – 2025    78.5%

Skills
C++, Java, Spring, MySQL, Linux, Git

Academic Projects
Library Management System
- Java Swing desktop app to issue and return books.
Online Bookstore – Spring Boot, MySQL
- Catalogue with cart and order history.
`

describe("extractResumeProfile", () => {
  it("reads a typical single-column resume", () => {
    const { profile, filled } = extractResumeProfile(PRIYA)
    expect(profile.fullName).toBe("Priya Nair")
    expect(profile.email).toBe("priya.nair.dev@gmail.com")
    expect(profile.phone).toBe("+91 98470 12345")
    expect(profile.location).toBe("Kochi")
    expect(profile.githubUsername).toBe("priyanair")
    expect(profile.linkedinUrl).toBe("https://www.linkedin.com/in/priya-nair-dev")
    expect(profile.college).toBe("Model Engineering College, Kochi")
    expect(profile.gradYear).toBe("2026")
    expect(profile.degree).toMatch(/B\.Tech/)
    expect(profile.targetRole).toBe("fullstack")
    expect(profile.skills.languages).toEqual(["Java", "Python", "JavaScript", "SQL"])
    expect(profile.skills.frameworks).toEqual(expect.arrayContaining(["Spring Boot", "React", "Node.js", "Express"]))
    expect(profile.skills.databases).toEqual(["MySQL", "MongoDB", "Redis"])
    expect(profile.skills.tools).toEqual(expect.arrayContaining(["Git", "Docker", "Postman", "AWS"]))
    expect(profile.projects.map((p) => p.title)).toEqual(["Weather App", "To-Do Manager"])
    expect(profile.projects[0].tech).toEqual(["React", "OpenWeather API"])
    expect(profile.projects[1].link).toBe("https://github.com/priyanair/todo-api")
    expect(profile.experience[0]).toMatchObject({ role: "Web Development Intern", company: "Kerala Startup Mission" })
    expect(profile.experience[0].period).toMatch(/Jun 2024/)
    expect(profile.education[0].score).toBe("8.4 CGPA")
    expect(filled.length).toBeGreaterThanOrEqual(12)
  })

  it("copes with a messy resume without clear structure", () => {
    const { profile } = extractResumeProfile(MESSY)
    expect(profile.fullName).toBe("Rahul Kumar Verma")
    expect(profile.email).toBe("rahulverma99@outlook.com")
    expect(profile.phone).toBe("+91 81234 56789")
    expect(profile.location).toBe("Pune")
    expect(profile.college).toBe("Pune Institute of Computer Technology")
    expect(profile.gradYear).toBe("2025")
    expect(profile.targetRole).toBe("backend")
    expect(profile.skills.languages).toEqual(expect.arrayContaining(["C++", "Java"]))
    expect(profile.skills.languages).not.toContain("C")
    expect(profile.projects.map((p) => p.title)).toEqual(["Library Management System", "Online Bookstore"])
    expect(profile.projects[1].tech).toEqual(["Spring Boot", "MySQL"])
    expect(profile.education[0].score).toBe("78.5%")
  })

  it("never invents values from empty input", () => {
    const { profile, filled } = extractResumeProfile("")
    expect(filled).toEqual([])
    expect(profile.fullName).toBe("")
  })

  it("strips 'Resume' and 'CV' from the name", () => {
    expect(extractResumeProfile("Ananya Rao CV\nananya@example.com").profile.fullName).toBe("Ananya Rao")
  })
})
