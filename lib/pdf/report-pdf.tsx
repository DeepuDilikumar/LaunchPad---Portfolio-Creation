import "server-only"

import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer"

import type { Report } from "@/lib/diagnostic/types"

const STATUS_LABEL = { passing: "Passing", needs_work: "Needs work", critical: "Critical", not_assessed: "Not assessed" } as const

const s = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10, lineHeight: 1.4, color: "#202124" },
  title: { fontSize: 20, fontFamily: "Helvetica-Bold" },
  sub: { color: "#5f6368", marginTop: 2 },
  overall: { marginTop: 14, padding: 12, backgroundColor: "#e8f0fe", borderRadius: 6 },
  big: { fontSize: 28, fontFamily: "Helvetica-Bold", color: "#174ea6" },
  pillar: { marginTop: 14, paddingTop: 10, borderTopWidth: 0.75, borderTopColor: "#dadce0" },
  row: { flexDirection: "row", justifyContent: "space-between" },
  h: { fontSize: 13, fontFamily: "Helvetica-Bold" },
  label: { fontFamily: "Helvetica-Bold", marginTop: 6 },
  check: { flexDirection: "row", marginTop: 2 },
  mark: { width: 14 },
  flex: { flex: 1 },
  foot: { marginTop: 18, color: "#5f6368", fontSize: 8.5 },
})

function ReportPdf({ report, name }: { report: Report; name: string }) {
  return (
    <Document title={`LaunchPad report - ${name}`} creator="LaunchPad" producer="LaunchPad">
      <Page size="A4" style={s.page}>
        <Text style={s.title}>LaunchPad profile report</Text>
        <Text style={s.sub}>
          {name} · {new Date(report.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
        </Text>
        <View style={s.overall}>
          <Text style={s.big}>{report.overall}/100</Text>
          <Text>LaunchPad Rubric Target: {report.target}. GitHub is counted only when connected.</Text>
        </View>
        {report.pillars.map((p) => (
          <View key={p.key} style={s.pillar} wrap={false}>
            <View style={s.row}>
              <Text style={s.h}>{p.title}</Text>
              <Text>
                {STATUS_LABEL[p.status]}
                {p.score !== null ? ` · ${p.score}/100` : ""}
              </Text>
            </View>
            <Text style={s.label}>What a screener notices</Text>
            {p.notices.map((n, i) => (
              <Text key={i}>{n}</Text>
            ))}
            {p.fixes.length ? <Text style={s.label}>How to fix it</Text> : null}
            {p.fixes.map((f, i) => (
              <Text key={i}>
                {i + 1}. {f}
              </Text>
            ))}
            {p.status !== "not_assessed" ? (
              <>
                <Text style={s.label}>How this was scored</Text>
                {p.checks.map((c) => (
                  <View key={c.id} style={s.check}>
                    <Text style={s.mark}>{c.met ? "Yes" : "No"}</Text>
                    <Text style={s.flex}>
                      {"  "}
                      {c.label} ({c.weight} pts). {c.evidence}
                    </Text>
                  </View>
                ))}
              </>
            ) : null}
          </View>
        ))}
        <Text style={s.foot}>
          Scores are calculated from the LaunchPad Rubric (version {report.rubricVersion}): points from checks met, out of 100.
          The target is LaunchPad&apos;s own bar for product-company SDE-1 screens, not an industry standard.
        </Text>
      </Page>
    </Document>
  )
}

export async function renderReportPdf(report: Report, name: string) {
  return renderToBuffer(<ReportPdf report={report} name={name} />)
}
