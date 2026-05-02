import { FileText } from "lucide-react"

type Exercise = {
  id: string
  name: string
  thumbnail_url: string | null
  body_part: string | null
  description?: string | null
  default_sets?: number | null
  default_reps?: number | null
  default_duration_seconds?: number | null
  default_rest_seconds?: number | null
  step_images?: string[] | null
}

type Item = {
  id: string
  order: number
  sets: number | null
  reps: number | null
  duration_seconds: number | null
  rest_seconds: number | null
  notes: string | null
  exercises: Exercise | Exercise[] | null
}

type ContentItem = {
  id: string
  name: string
  type: string
  file_url: string | null
  external_url: string | null
}

type Practitioner = {
  first_name: string
  last_name: string
  practice_name: string | null
  practice_address: string | null
  practice_city: string | null
  practice_postal_code: string | null
  logo_url: string | null
} | null

interface Props {
  title: string
  subtitle?: string
  patientName?: string
  practitioner: Practitioner
  items: Item[]
  content?: ContentItem[]
  printedAt: string
}

function paramLabel(sets: number | null | undefined, reps: number | null | undefined, duration: number | null | undefined, rest: number | null | undefined) {
  const parts: string[] = []
  if (sets) parts.push(`Serie: ${sets}`)
  if (reps) parts.push(`Powtórzenia: ${reps}`)
  if (duration) {
    if (duration >= 60) {
      const m = Math.floor(duration / 60)
      const s = duration % 60
      parts.push(`Czas trwania: ${m}min${s ? ` ${s}s` : ""}`)
    } else {
      parts.push(`Czas trwania: ${duration}s`)
    }
  }
  if (rest) parts.push(`Przerwa: ${rest}s`)
  return parts.join(" · ")
}

export function PrintPage({ title, subtitle, patientName, practitioner, items, content, printedAt }: Props) {
  const practName = practitioner
    ? `mgr ${practitioner.first_name} ${practitioner.last_name}`
    : "Para Leczy"

  const practAddress = practitioner?.practice_city
    ? [practitioner.practice_address, `${practitioner.practice_postal_code ?? ""} ${practitioner.practice_city}`.trim()]
        .filter(Boolean).join(", ")
    : null

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-[800px] mx-auto px-10 py-8 font-sans text-gray-900">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-1">
          {/* Left: clinic */}
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Para Leczy" className="w-9 h-9 rounded-lg object-cover" />
            <div>
              <p className="font-bold text-[13px] text-gray-900 leading-tight">
                {practitioner?.practice_name ?? "Para Leczy"}
              </p>
              <p className="text-[11px] text-gray-500 leading-tight">{practName}</p>
              {practAddress && (
                <p className="text-[11px] text-gray-400 leading-tight">{practAddress}</p>
              )}
            </div>
          </div>

          {/* Right: patient if any */}
          {patientName && (
            <div className="text-right">
              <p className="text-[11px] text-gray-400">Pacjent</p>
              <p className="text-[13px] font-semibold text-gray-800">{patientName}</p>
            </div>
          )}
        </div>

        {/* Program title accent bar */}
        <div className="border-t-2 border-[#e05c2a] mt-3 pt-2 mb-6">
          <p className="text-[15px] font-bold text-[#e05c2a] tracking-wide uppercase">{title}</p>
          {subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
        </div>

        {/* ── Exercises ──────────────────────────────────────────────────────── */}
        <div>
          {items.map((item, idx) => {
            const ex = Array.isArray(item.exercises) ? item.exercises[0] : item.exercises
            const sets = item.sets ?? ex?.default_sets
            const reps = item.reps ?? ex?.default_reps
            const duration = item.duration_seconds ?? ex?.default_duration_seconds
            const rest = item.rest_seconds ?? ex?.default_rest_seconds
            const params = paramLabel(sets, reps, duration, rest)

            return (
              <div
                key={item.id}
                className="break-inside-avoid border-b border-gray-100 last:border-0"
                style={{ paddingTop: "14px", paddingBottom: "14px" }}
              >
                {/* Params right-aligned */}
                {params && (
                  <p className="text-right text-[11px] text-[#e05c2a] font-medium mb-1">{params}</p>
                )}

                <div className="flex gap-4">
                  {/* Images — step grid or single thumbnail */}
                  {(() => {
                    const imgs = (ex?.step_images ?? []).filter(Boolean)
                    if (imgs.length > 0) {
                      const cols = imgs.length <= 2 ? imgs.length : 2
                      return (
                        <div
                          className="shrink-0"
                          style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 4, width: cols === 1 ? 120 : 220 }}
                        >
                          {imgs.map((url, i) => (
                            <div key={i} className="relative rounded overflow-hidden bg-gray-100" style={{ height: imgs.length > 2 ? 80 : 100 }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={url} alt={`${i + 1}`} className="w-full h-full object-cover" />
                              <span className="absolute bottom-0.5 left-0.5 w-4 h-4 rounded bg-black/50 text-white text-[9px] font-bold flex items-center justify-center">{i + 1}</span>
                            </div>
                          ))}
                        </div>
                      )
                    }
                    return (
                      <div className="shrink-0 rounded overflow-hidden bg-gray-100 flex items-center justify-center" style={{ width: 120, height: 100 }}>
                        {ex?.thumbnail_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={ex.thumbnail_url} alt={ex?.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[40px] text-gray-200">○</span>
                        )}
                      </div>
                    )
                  })()}

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[13px] text-gray-900 leading-snug">
                      {idx + 1}. {ex?.name ?? "Ćwiczenie"}
                    </p>

                    {ex?.body_part && (
                      <p className="text-[11px] text-gray-400 mt-0.5">{ex.body_part}</p>
                    )}

                    {ex?.description && (
                      <p className="text-[12px] text-gray-600 mt-1.5 leading-relaxed">{ex.description}</p>
                    )}

                    {item.notes && (
                      <p className="text-[12px] text-gray-500 italic mt-1.5 leading-relaxed border-l-2 border-[#e05c2a] pl-2">
                        {item.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Educational content ────────────────────────────────────────────── */}
        {content && content.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200 break-inside-avoid">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
              Materiały edukacyjne
            </p>
            <div className="space-y-1">
              {content.map((c) => (
                <div key={c.id} className="flex items-center gap-2">
                  <FileText size={11} className="text-[#e05c2a] shrink-0" />
                  <span className="text-[12px] text-gray-700">{c.name}</span>
                  {(c.file_url || c.external_url) && (
                    <span className="text-[11px] text-gray-400">— {c.file_url ?? c.external_url}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Footer ─────────────────────────────────────────────────────────── */}
        <div className="mt-8 pt-3 border-t border-gray-200 flex items-center justify-between">
          <p className="text-[11px] text-[#e05c2a] font-medium">{title}</p>
          <p className="text-[11px] text-gray-400">wydrukowane dnia {printedAt}</p>
        </div>
      </div>

      <style>{`
        @media print {
          @page { margin: 1.5cm 1.5cm; size: A4; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  )
}
