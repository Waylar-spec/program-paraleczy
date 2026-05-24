"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Dumbbell, CheckCircle2, Play, ChevronRight, FileText, ExternalLink } from "lucide-react"
import { logExercise } from "@/lib/actions/patient-portal"
import { toast } from "sonner"

type ExerciseData = {
  id: string
  name: string
  description: string | null
  thumbnail_url: string | null
  animated_gif_url?: string | null
  video_url: string | null
  body_part: string | null
}

type ExerciseItem = {
  id: string
  order: number
  sets: number | null
  reps: number | null
  duration_seconds: number | null
  notes: string | null
  exercises: ExerciseData | ExerciseData[] | null
}

type ContentItem = {
  id: string
  order: number
  educational_content: {
    id: string
    name: string
    type: string
    file_url: string | null
    external_url: string | null
  } | {
    id: string
    name: string
    type: string
    file_url: string | null
    external_url: string | null
  }[] | null
}

type Program = {
  id: string
  name: string
  patient_program_items: ExerciseItem[]
  patient_program_content?: ContentItem[]
}

interface Props {
  program: Program
  patientId: string
  patientName: string
  kod: string
  doneTodayIds: string[]
}

export function PatientProgramView({ program, patientId, patientName, kod, doneTodayIds }: Props) {
  const [done, setDone] = useState<Set<string>>(new Set(doneTodayIds))
  const [active, setActive] = useState<ExerciseItem | null>(null)

  const items = program.patient_program_items
  const allDone = items.length > 0 && items.every((item) => done.has(item.id))

  async function handleMark(item: ExerciseItem, pain: number | null = null) {
    if (done.has(item.id)) return
    const next = new Set(done)
    next.add(item.id)
    setDone(next)
    try {
      await logExercise({
        patientId,
        programId: program.id,
        programItemId: item.id,
        completedSets: item.sets ?? 1,
        completedReps: item.reps,
        painAfter: pain,
      })
      toast.success("Ćwiczenie zaliczone!")
    } catch {
      next.delete(item.id)
      setDone(new Set(next))
      toast.error("Błąd zapisu")
    }
  }

  if (active) {
    return (
      <ExerciseSession
        item={active}
        isDone={done.has(active.id)}
        onMark={(pain) => handleMark(active, pain)}
        onClose={() => setActive(null)}
        onNext={() => {
          const idx = items.findIndex((i) => i.id === active.id)
          const next = items[idx + 1]
          setActive(next ?? null)
        }}
        hasNext={items.findIndex((i) => i.id === active.id) < items.length - 1}
      />
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-5 pb-4 space-y-4">
      {/* Back */}
      <Link href={`/p/${kod}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500">
        <ArrowLeft size={14} />
        {patientName}
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-gray-900">{program.name}</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {items.length} {items.length === 1 ? "ćwiczenie" : items.length < 5 ? "ćwiczenia" : "ćwiczeń"}
            {done.size > 0 && ` · ${done.size} zrobione dziś`}
          </p>
        </div>
        {allDone && (
          <span className="text-xs bg-green-50 text-green-600 font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
            <CheckCircle2 size={11} /> Dziś zrobione!
          </span>
        )}
      </div>

      {/* Exercise grid — 2 cols mobile, 3 cols tablet+ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((item) => {
          const isDone = done.has(item.id)
          const ex = Array.isArray(item.exercises) ? item.exercises[0] : item.exercises

          return (
            <button
              key={item.id}
              onClick={() => setActive(item)}
              className={`relative text-left rounded-xl overflow-hidden border-2 transition-all ${
                isDone ? "border-green-400" : "border-transparent"
              }`}
            >
              {/* Image */}
              <div className="w-full aspect-[4/3] bg-gray-100 relative">
                {ex?.thumbnail_url ? (
                  <img src={ex.thumbnail_url} alt={ex.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Dumbbell size={20} className="text-gray-300" />
                  </div>
                )}
                {isDone && (
                  <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                    <CheckCircle2 size={22} className="text-green-600 drop-shadow" />
                  </div>
                )}
                {!isDone && ex?.video_url && (
                  <div className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full bg-white/80 flex items-center justify-center">
                    <Play size={10} className="text-navy-500 ml-0.5" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="bg-white px-2.5 py-2.5">
                <p className={`text-xs font-semibold leading-tight line-clamp-2 ${isDone ? "text-green-700" : "text-gray-900"}`}>
                  {ex?.name ?? "Ćwiczenie"}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {[
                    item.reps && `${item.reps} powt.`,
                    item.sets && `${item.sets} serii`,
                    item.duration_seconds && `${item.duration_seconds}s`,
                  ].filter(Boolean).join(" · ")}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Educational materials */}
      {(program.patient_program_content?.length ?? 0) > 0 && (
        <div>
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Materiały edukacyjne</h2>
          <div className="space-y-2">
            {program.patient_program_content!
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((pc) => {
                const content = Array.isArray(pc.educational_content)
                  ? pc.educational_content[0]
                  : pc.educational_content
                if (!content) return null
                const url = content.file_url ?? content.external_url
                return (
                  <a
                    key={pc.id}
                    href={url ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl p-3 hover:border-navy-300 transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-navy-50 flex items-center justify-center shrink-0">
                      {content.type === "link" ? (
                        <ExternalLink size={18} className="text-navy-500" />
                      ) : (
                        <FileText size={18} className="text-navy-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{content.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {content.type === "pdf" ? "PDF" : content.type === "link" ? "Link" : content.type}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 shrink-0" />
                  </a>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Exercise session ─────────────────────────────────────────────────────────

interface SessionProps {
  item: ExerciseItem
  isDone: boolean
  onMark: (pain: number | null) => void
  onClose: () => void
  onNext: () => void
  hasNext: boolean
}

function ExerciseSession({ item, isDone, onMark, onClose, onNext, hasNext }: SessionProps) {
  const [timerActive, setTimerActive] = useState(false)
  const [timeLeft, setTimeLeft] = useState(item.duration_seconds ?? 0)
  const [showVas, setShowVas] = useState(false)
  const ex = Array.isArray(item.exercises) ? item.exercises[0] : item.exercises

  function startTimer() {
    setTimerActive(true)
    setTimeLeft(item.duration_seconds ?? 0)
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(interval); setTimerActive(false); return 0 }
        return t - 1
      })
    }, 1000)
  }

  function getEmbedUrl(url: string): string | null {
    const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/)
    if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0&autoplay=1`
    const vi = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
    if (vi) return `https://player.vimeo.com/video/${vi[1]}?autoplay=1&dnt=1`
    return null
  }

  const embedUrl = ex?.video_url ? getEmbedUrl(ex.video_url) : null

  return (
    <div className="max-w-2xl mx-auto pb-4">
      {showVas && (
        <VasPainModal onSubmit={(pain) => { setShowVas(false); onMark(pain) }} />
      )}
      <button onClick={onClose} className="inline-flex items-center gap-1.5 text-sm text-gray-500 px-4 pt-5 pb-3">
        <ArrowLeft size={14} />
        Wróć do listy
      </button>

      {/* Video or image */}
      <div className="w-full aspect-video bg-white">
        {embedUrl ? (
          <iframe src={embedUrl} className="w-full h-full" allowFullScreen allow="autoplay; encrypted-media" />
        ) : ex?.animated_gif_url ? (
          /\.(mp4|webm)(\?|$)/i.test(ex.animated_gif_url)
            ? <video src={ex.animated_gif_url} className="w-full h-full object-contain bg-black" controls playsInline autoPlay />
            : <img src={ex.animated_gif_url} alt={ex.name ?? ""} className="w-full h-full object-contain" />
        ) : ex?.thumbnail_url ? (
          <img src={ex.thumbnail_url} alt={ex.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <Dumbbell size={48} className="text-gray-400" />
          </div>
        )}
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Name */}
        <div>
          <h1 className="text-lg font-semibold text-gray-900">{ex?.name}</h1>
          {ex?.body_part && <p className="text-sm text-gray-400 mt-0.5">{ex.body_part}</p>}
        </div>

        {/* Params chips */}
        <div className="flex gap-3">
          {item.sets && (
            <div className="flex-1 bg-navy-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-navy-700">{item.sets}</p>
              <p className="text-xs text-navy-500 mt-0.5">serie</p>
            </div>
          )}
          {item.reps && (
            <div className="flex-1 bg-navy-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-navy-700">{item.reps}</p>
              <p className="text-xs text-navy-500 mt-0.5">powtórzeń</p>
            </div>
          )}
          {item.duration_seconds && (
            <div className="flex-1 bg-navy-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-navy-700">
                {timerActive
                  ? `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, "0")}`
                  : item.duration_seconds}
              </p>
              <p className="text-xs text-navy-500 mt-0.5">sekund</p>
            </div>
          )}
        </div>

        {/* Description */}
        {ex?.description && (
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-600 leading-relaxed">{ex.description}</p>
          </div>
        )}

        {/* Note */}
        {item.notes && (
          <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3">
            <p className="text-xs font-medium text-yellow-700 mb-1">Wskazówka od fizjoterapeuty</p>
            <p className="text-sm text-yellow-800">{item.notes}</p>
          </div>
        )}

        {/* Timer */}
        {item.duration_seconds && !timerActive && !isDone && (
          <button
            onClick={startTimer}
            className="w-full h-11 rounded-xl border border-navy-200 text-navy-600 font-medium text-sm flex items-center justify-center gap-2 hover:bg-navy-50 transition-colors"
          >
            <Play size={16} />
            Uruchom timer
          </button>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {!isDone && (
            <button
              onClick={() => setShowVas(true)}
              className="flex-1 h-12 rounded-xl bg-navy-500 hover:bg-navy-600 text-white font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={18} />
              Zrobione!
            </button>
          )}
          {isDone && hasNext && (
            <button
              onClick={onNext}
              className="flex-1 h-12 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold transition-colors flex items-center justify-center gap-2"
            >
              Następne ćwiczenie
              <ChevronRight size={18} />
            </button>
          )}
          {isDone && !hasNext && (
            <button
              onClick={onClose}
              className="flex-1 h-12 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={18} />
              Koniec programu!
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── VAS pain modal ───────────────────────────────────────────────────────────

interface VasModalProps {
  onSubmit: (pain: number | null) => void
}

function VasPainModal({ onSubmit }: VasModalProps) {
  const [pain, setPain] = useState<number>(0)
  const COLORS = ["#22c55e","#4ade80","#86efac","#bef264","#fde047","#fbbf24","#fb923c","#f97316","#ef4444","#dc2626","#991b1b"]

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl shadow-xl px-5 pt-5 pb-8">
        <h3 className="font-semibold text-gray-900 text-center mb-1">Jak się czujesz?</h3>
        <p className="text-xs text-gray-500 text-center mb-5">Oceń poziom bólu po tym ćwiczeniu (0 = brak bólu, 10 = maksymalny)</p>

        {/* Number display */}
        <div className="flex justify-center mb-4">
          <span className="text-5xl font-bold" style={{ color: COLORS[pain] }}>{pain}</span>
        </div>

        {/* Slider */}
        <input
          type="range"
          min={0}
          max={10}
          value={pain}
          onChange={e => setPain(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer mb-3"
          style={{ accentColor: COLORS[pain] }}
        />
        <div className="flex justify-between text-[10px] text-gray-400 mb-5 px-0.5">
          <span>Brak bólu</span>
          <span>Maksymalny ból</span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => onSubmit(null)}
            className="flex-1 h-11 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
          >
            Pomiń
          </button>
          <button
            onClick={() => onSubmit(pain)}
            className="flex-1 h-11 rounded-xl text-white font-semibold text-sm transition-colors"
            style={{ backgroundColor: COLORS[pain] }}
          >
            Zapisz
          </button>
        </div>
      </div>
    </div>
  )
}
