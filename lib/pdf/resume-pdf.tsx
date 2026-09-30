import "server-only"

import { Document, Link, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer"

import type { ResumeDocument } from "@/lib/resume/document"

/**
 * ATS-safe resume PDF: one column, standard headings, built-in Helvetica (real, selectable
 * text), no tables, no images, no icons.
 */
const s = StyleSheet.create({
  page: { paddingVertical: 36, paddingHorizontal: 44, fontFamily: "Helvetica", fontSize: 10, lineHeight: 1.35, color: "#111111" },
  name: { fontSize: 20, fontFamily: "Helvetica-Bold" },
  headline: { fontSize: 11, marginTop: 2 },
  contact: { marginTop: 4, color: "#333333" },
  section: { marginTop: 12 },
  heading: { fontSize: 11, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.6, borderBottomWidth: 0.75, borderBottomColor: "#999999", paddingBottom: 2, marginBottom: 5 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  bold: { fontFamily: "Helvetica-Bold" },
  muted: { color: "#444444" },
  bullet: { flexDirection: "row", marginTop: 2, paddingLeft: 6 },
  dot: { width: 10 },
  bulletText: { flex: 1 },
  entry: { marginBottom: 6 },
})

function Bullets({ items }: { items: string[] }) {
  return (
    <>
      {items.map((b, i) => (
        <View key={i} style={s.bullet} wrap={false}>
          <Text style={s.dot}>-</Text>
          <Text style={s.bulletText}>{b}</Text>
        </View>
      ))}
    </>
  )
}

function ResumePdf({ doc }: { doc: ResumeDocument }) {
  return (
    <Document title={`${doc.name} - Resume`} author={doc.name} creator="LaunchPad" producer="LaunchPad">
      <Page size="A4" style={s.page}>
        <Text style={s.name}>{doc.name}</Text>
        {doc.headline ? <Text style={s.headline}>{doc.headline}</Text> : null}
        <Text style={s.contact}>{doc.contact.join("  |  ")}</Text>

        {doc.education.length ? (
          <View style={s.section}>
            <Text style={s.heading}>Education</Text>
            {doc.education.map((e, i) => (
              <View key={i} style={s.entry}>
                <View style={s.row}>
                  <Text style={s.bold}>{e.institution}</Text>
                  <Text>{e.period}</Text>
                </View>
                {e.detail ? <Text style={s.muted}>{e.detail}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}

        {doc.skills.length ? (
          <View style={s.section}>
            <Text style={s.heading}>Skills</Text>
            {doc.skills.map((k) => (
              <Text key={k.label}>
                <Text style={s.bold}>{k.label}: </Text>
                {k.items}
              </Text>
            ))}
          </View>
        ) : null}

        {doc.projects.length ? (
          <View style={s.section}>
            <Text style={s.heading}>Projects</Text>
            {doc.projects.map((p, i) => (
              <View key={i} style={s.entry}>
                <View style={s.row}>
                  <Text>
                    <Text style={s.bold}>{p.title}</Text>
                    {p.tech ? <Text style={s.muted}> | {p.tech}</Text> : null}
                  </Text>
                  {p.link ? <Link src={`https://${p.link}`}>{p.link}</Link> : null}
                </View>
                <Bullets items={p.bullets} />
              </View>
            ))}
          </View>
        ) : null}

        {doc.experience.length ? (
          <View style={s.section}>
            <Text style={s.heading}>Experience</Text>
            {doc.experience.map((x, i) => (
              <View key={i} style={s.entry}>
                <View style={s.row}>
                  <Text>
                    <Text style={s.bold}>{x.role}</Text>
                    {x.company ? `, ${x.company}` : ""}
                  </Text>
                  <Text>{x.period}</Text>
                </View>
                <Bullets items={x.bullets} />
              </View>
            ))}
          </View>
        ) : null}
      </Page>
    </Document>
  )
}

export async function renderResumePdf(doc: ResumeDocument) {
  return renderToBuffer(<ResumePdf doc={doc} />)
}
