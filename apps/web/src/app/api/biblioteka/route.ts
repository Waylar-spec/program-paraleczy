import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

// Public read-only endpoint — returns a Claude-friendly text snapshot of the exercise library.
// No patient data, no auth required.
export async function GET() {
  const sb = createServiceClient()

  const [{ data: exercises }, { data: content }, { data: protocols }] = await Promise.all([
    sb
      .from("exercises")
      .select("name, name_en, body_part, category, default_sets, default_reps, default_duration_seconds, animated_gif_url, video_url")
      .order("body_part", { ascending: true })
      .order("name", { ascending: true }),
    sb
      .from("educational_content")
      .select("name, type, body_part")
      .order("name", { ascending: true }),
    sb
      .from("rehabilitation_protocols")
      .select("name, body_part, total_weeks, protocol_phases(name, duration_weeks, template_id)")
      .order("name", { ascending: true }),
  ])

  const lines: string[] = []
  const now = new Date().toISOString().split("T")[0]
  lines.push(`# Biblioteka Para Leczy — snapshot ${now}`)
  lines.push("")

  // ── ĆWICZENIA ──────────────────────────────────────────────────────────────
  lines.push(`## ĆWICZENIA (${exercises?.length ?? 0})`)
  lines.push("")

  const byPart: Record<string, typeof exercises> = {}
  for (const ex of exercises ?? []) {
    const part = ex.body_part ?? "Inne"
    if (!byPart[part]) byPart[part] = []
    byPart[part]!.push(ex)
  }

  for (const [part, exs] of Object.entries(byPart).sort()) {
    lines.push(`### ${part}`)
    for (const ex of exs ?? []) {
      const hasVideo = !!(ex.animated_gif_url || ex.video_url)
      const params = [
        ex.default_sets && `${ex.default_sets} serii`,
        ex.default_reps && `${ex.default_reps} powt.`,
        ex.default_duration_seconds && `${ex.default_duration_seconds}s`,
      ].filter(Boolean).join(", ")
      const video = hasVideo ? "✓video" : "brak video"
      const cat = ex.category ? ` [${ex.category}]` : ""
      const en = ex.name_en ? ` / ${ex.name_en}` : ""
      lines.push(`- ${ex.name}${en}${cat} — ${params || "brak param."} — ${video}`)
    }
    lines.push("")
  }

  // ── MATERIAŁY EDUKACYJNE ───────────────────────────────────────────────────
  lines.push(`## MATERIAŁY EDUKACYJNE (${content?.length ?? 0})`)
  lines.push("")
  for (const c of content ?? []) {
    lines.push(`- [${c.type?.toUpperCase() ?? "PDF"}] ${c.name}`)
  }
  lines.push("")

  // ── PROTOKOŁY ─────────────────────────────────────────────────────────────
  lines.push(`## PROTOKOŁY REHABILITACYJNE (${protocols?.length ?? 0})`)
  lines.push("")
  for (const p of protocols ?? []) {
    const phases = Array.isArray(p.protocol_phases) ? p.protocol_phases : []
    const weeks = p.total_weeks ? ` ${p.total_weeks} tyg.` : ""
    const part = p.body_part ? ` [${p.body_part}]` : ""
    lines.push(`### ${p.name}${part}${weeks}`)
    for (const ph of [...phases].sort((a: any, b: any) => 0)) {
      const linked = ph.template_id ? " ✓szablon" : " (brak szablonu)"
      lines.push(`  - ${ph.name} — ${ph.duration_weeks} tyg.${linked}`)
    }
    lines.push("")
  }

  const text = lines.join("\n")
  return new NextResponse(text, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
