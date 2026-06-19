"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { ArrowLeft, Dumbbell, CheckCircle2, Play, ChevronRight, FileText, ExternalLink, Target, BookOpen, ShieldCheck, Clock, RotateCcw, ChevronDown, ChevronUp, Info, Wind, ListChecks } from "lucide-react"
import { logExercise } from "@/lib/actions/patient-portal"
import { toast } from "sonner"
import { useVimeoThumbnail } from "@/lib/hooks/useVimeoThumbnail"
import { BreathingPlayer } from "./BreathingPlayer"
import { TimedSessionCard } from "./TimedSessionCard"

type ExerciseData = {
  id: string
  name: string
  description: string | null
  thumbnail_url: string | null
  animated_gif_url?: string | null
  video_url: string | null
  body_part: string | null
  exercise_type?: string | null
  breathing_config?: any
  running_config?: any
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

type PhaseInfo = {
  name: string
  description: string | null
  goals: string | null
  patient_intro: string | null
  rules: string | null
  duration_weeks: number
  protocolName: string
} | null

interface Props {
  program: Program
  patientId: string
  patientName: string
  kod: string
  doneTodayIds: string[]
  phaseInfo?: PhaseInfo
}

// Small component so each card can independently fetch its Vimeo thumb.
// Priority: vimeo thumb > static thumbnail > animated gif > mp4 > placeholder
function ExerciseThumb({ ex, className }: { ex: ExerciseData | null; className?: string }) {
  const isVimeo = !!ex?.video_url && ex.video_url.includes("vimeo")
  const vimeoThumb = useVimeoThumbnail(isVimeo ? ex!.video_url : null)
  const gifUrl = ex?.animated_gif_url ?? null
  const isGifMp4 = !!gifUrl && (gifUrl.endsWith(".mp4") || gifUrl.includes(".mp4"))
  const isDirectMp4 = !!ex?.video_url && !isVimeo &&
    (ex.video_url.endsWith(".mp4") || ex.video_url.includes(".mp4"))

  if (vimeoThumb) return <img src={vimeoThumb} alt={ex?.name ?? ""} className={className ?? "w-full h-full object-cover"} />
  if (ex?.thumbnail_url) return <img src={ex.thumbnail_url} alt={ex?.name ?? ""} className={className ?? "w-full h-full object-cover"} />
  if (gifUrl && !isGifMp4) return <img src={gifUrl} alt={ex?.name ?? ""} className={className ?? "w-full h-full object-contain"} />
  if (gifUrl && isGifMp4) return <video src={gifUrl} className={className ?? "w-full h-full object-contain"} muted playsInline autoPlay loop />
  if (isDirectMp4) return <video src={ex!.video_url!} className={className ?? "w-full h-full object-contain"} muted playsInline preload="metadata" />
  return <div className="w-full h-full flex items-center justify-center"><Dumbbell size={20} className="text-gray-300" /></div>
}

// ── Description formatter ─────────────────────────────────────────────────────
function isHeaderLine(line: string): boolean {
  const t = line.trim()
  if (!t || t.length < 5) return false
  if (/^(ĆWICZENIE|PROGRAM|JAK |PRZY |ZASADA|KROK\s)/i.test(t) && t.length > 6) return true
  const letters = t.replace(/[^a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, "")
  const upper  = t.replace(/[^ĄĆĘŁŃÓŚŹŻABCDEFGHIJKLMNOPQRSTUVWXYZ]/g, "")
  return letters.length > 4 && upper.length / letters.length > 0.62
}

function DescriptionFormatter({ text }: { text: string }) {
  const lines = text.split("\n")
  const nodes: React.ReactNode[] = []
  let k = 0

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue

    if (isHeaderLine(line)) {
      nodes.push(
        <div key={k++} className="mt-4 first:mt-0 flex items-center gap-2 px-3 py-2 bg-green-50 rounded-xl border-l-[3px] border-green-500">
          <p className="text-xs font-bold text-green-800 uppercase tracking-wide">{line.replace(/:$/, "")}</p>
        </div>
      )
      continue
    }

    if (line.startsWith("•")) {
      nodes.push(
        <div key={k++} className="flex items-start gap-2 pl-1">
          <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 shrink-0" />
          <p className="text-sm text-gray-700 leading-relaxed">{line.slice(1).trim()}</p>
        </div>
      )
      continue
    }

    const num = line.match(/^(\d+)[.)]\s+(.+)/)
    if (num) {
      nodes.push(
        <div key={k++} className="flex items-start gap-2.5 pl-1">
          <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-[10px] font-bold text-green-700">{num[1]}</span>
          </div>
          <p className="text-sm text-gray-800 leading-relaxed flex-1">{num[2]}</p>
        </div>
      )
      continue
    }

    if (/^(Wskazówka|Zasada|WAŻNE|Uwaga)[:\s]/.test(line)) {
      nodes.push(
        <div key={k++} className="bg-amber-50 rounded-xl px-3 py-2 border-l-[3px] border-amber-400">
          <p className="text-xs text-amber-900 leading-relaxed">{line}</p>
        </div>
      )
      continue
    }

    nodes.push(<p key={k++} className="text-sm text-gray-600 leading-relaxed">{line}</p>)
  }

  return <div className="space-y-2">{nodes}</div>
}

export function PatientProgramView({ program, patientId, patientName, kod, doneTodayIds, phaseInfo }: Props) {
  const [done, setDone] = useState<Set<string>>(new Set(doneTodayIds))
  const [active, setActive] = useState<ExerciseItem | null>(null)
  const [phaseOpen, setPhaseOpen] = useState(false)
  const [contentOpen, setContentOpen] = useState(false)

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
    const isLastUndone = items.filter(i => !done.has(i.id) && i.id !== active.id).length === 0
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
        showVasOnComplete={isLastUndone}
        phaseInfo={phaseInfo}
        kod={kod}
      />
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 pt-5 pb-10">
      {/* Back */}
      <Link href={`/p/${kod}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 mb-4">
        <ArrowLeft size={14} />
        {patientName}
      </Link>

      <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-6 lg:items-start">
        {/* ── Left: exercises ── */}
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
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

          {/* Mobile: collapsible info banners — before exercises */}
          <div className="lg:hidden space-y-2 mb-4">
            {phaseInfo && (phaseInfo.description || phaseInfo.goals || phaseInfo.patient_intro || phaseInfo.rules) && (
              <div className="rounded-xl border border-navy-100 overflow-hidden">
                <button
                  onClick={() => setPhaseOpen((v) => !v)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 bg-navy-50 text-left"
                >
                  <div className="flex items-center gap-2">
                    <Info size={13} className="text-navy-500" />
                    <span className="text-xs font-semibold text-navy-700">
                      {phaseInfo.name}
                      {phaseInfo.protocolName && (
                        <span className="font-normal text-navy-400"> · {phaseInfo.protocolName}</span>
                      )}
                    </span>
                  </div>
                  {phaseOpen
                    ? <ChevronUp size={14} className="text-navy-400 shrink-0" />
                    : <ChevronDown size={14} className="text-navy-400 shrink-0" />}
                </button>
                {phaseOpen && (
                  <div className="bg-white px-4 py-3 space-y-3">
                    {phaseInfo.description && (
                      <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{phaseInfo.description}</p>
                    )}
                    {phaseInfo.goals && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <Target size={12} className="text-navy-500" />
                          <p className="text-[10px] font-semibold text-navy-600 uppercase tracking-wide">Cele fazy</p>
                        </div>
                        <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">{phaseInfo.goals}</p>
                      </div>
                    )}
                    {phaseInfo.patient_intro && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <BookOpen size={12} className="text-navy-500" />
                          <p className="text-[10px] font-semibold text-navy-600 uppercase tracking-wide">Co cię czeka</p>
                        </div>
                        <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">{phaseInfo.patient_intro}</p>
                      </div>
                    )}
                    {phaseInfo.rules && (
                      <div className="bg-amber-50 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <ShieldCheck size={12} className="text-amber-600" />
                          <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide">Zasady</p>
                        </div>
                        <p className="text-xs text-amber-900 leading-relaxed whitespace-pre-line">{phaseInfo.rules}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {(program.patient_program_content ?? []).length > 0 && (
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setContentOpen((v) => !v)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 bg-gray-50 text-left"
                >
                  <div className="flex items-center gap-2">
                    <FileText size={13} className="text-gray-500" />
                    <span className="text-xs font-semibold text-gray-700">
                      Materiały edukacyjne
                      <span className="font-normal text-gray-400"> · {program.patient_program_content!.length}</span>
                    </span>
                  </div>
                  {contentOpen
                    ? <ChevronUp size={14} className="text-gray-400 shrink-0" />
                    : <ChevronDown size={14} className="text-gray-400 shrink-0" />}
                </button>
                {contentOpen && <ContentList content={program.patient_program_content} />}
              </div>
            )}
          </div>

          {/* Exercise grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {items.map((item) => {
              const isDone = done.has(item.id)
              const ex = Array.isArray(item.exercises) ? item.exercises[0] : item.exercises
              const isBreathing = ex?.exercise_type === "breathing"
              const isRunning = ex?.exercise_type === "running_intervals"
              const isAerobic = ex?.exercise_type === "aerobic_session"
              const isSpecial = isBreathing || isRunning || isAerobic
              const isDescriptive = !isSpecial && !ex?.thumbnail_url && !ex?.video_url && !ex?.animated_gif_url
              const breathingColor = ex?.breathing_config?.color ?? "emerald"

              const breathingBg: Record<string, string> = {
                emerald: "bg-gradient-to-br from-emerald-900 to-emerald-950",
                navy: "bg-gradient-to-br from-blue-900 to-blue-950",
                purple: "bg-gradient-to-br from-purple-900 to-purple-950",
                amber: "bg-gradient-to-br from-amber-900 to-amber-950",
              }
              const breathingGlow: Record<string, string> = {
                emerald: "#10b981",
                navy: "#3b5bdb",
                purple: "#8b5cf6",
                amber: "#f59e0b",
              }
              const runningBg = isRunning
                ? "bg-gradient-to-br from-emerald-900 to-teal-950"
                : "bg-gradient-to-br from-sky-900 to-cyan-950"
              const runningGlow = isRunning ? "#10b981" : "#0ea5e9"

              return (
                <button
                  key={item.id}
                  onClick={() => setActive(item)}
                  className={`relative text-left rounded-2xl overflow-hidden border-2 transition-all shadow-xs hover:shadow-md ${
                    isDone ? "border-green-400" : "border-transparent hover:border-navy-200"
                  }`}
                >
                  <div className={`w-full aspect-[4/3] relative ${isBreathing ? (breathingBg[breathingColor] ?? breathingBg.emerald) : (isRunning || isAerobic) ? runningBg : isDescriptive ? "bg-gradient-to-br from-slate-700 to-gray-900" : "bg-gray-100"}`}>
                    {isBreathing ? (
                      <>
                        {/* Breathing card — glowing circle icon */}
                        <div className="w-full h-full flex items-center justify-center">
                          <div
                            className="w-14 h-14 rounded-full flex items-center justify-center"
                            style={{
                              background: `radial-gradient(circle, ${breathingGlow[breathingColor] ?? "#10b981"}55, ${breathingGlow[breathingColor] ?? "#10b981"}22)`,
                              boxShadow: `0 0 24px 6px ${breathingGlow[breathingColor] ?? "#10b981"}44`,
                            }}
                          >
                            <Wind size={24} style={{ color: breathingGlow[breathingColor] ?? "#10b981" }} />
                          </div>
                        </div>
                      </>
                    ) : (isRunning || isAerobic) ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <div
                          className="w-14 h-14 rounded-full flex items-center justify-center text-3xl"
                          style={{
                            background: `radial-gradient(circle, ${runningGlow}55, ${runningGlow}22)`,
                            boxShadow: `0 0 24px 6px ${runningGlow}44`,
                          }}
                        >
                          {isRunning ? "🏃" : "⚡"}
                        </div>
                      </div>
                    ) : isDescriptive ? (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center gap-2.5">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                          <ListChecks size={18} className="text-white/70" />
                        </div>
                        {ex?.description && (
                          <p className="text-[11px] text-white/60 leading-snug line-clamp-3">
                            {ex.description.split("\n").find((l) => l.trim()) ?? ""}
                          </p>
                        )}
                      </div>
                    ) : (
                      <ExerciseThumb ex={ex} />
                    )}
                    {isDone && (
                      <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                        <CheckCircle2 size={22} className="text-green-600 drop-shadow" />
                      </div>
                    )}
                    {!isDone && (
                      <div className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-white/90 shadow flex items-center justify-center">
                        <Play size={11} className="text-navy-500 ml-0.5" />
                      </div>
                    )}
                  </div>
                  <div className="bg-white px-2.5 py-2.5">
                    <p className={`text-xs font-semibold leading-tight line-clamp-2 ${isDone ? "text-green-700" : "text-gray-900"}`}>
                      {ex?.name ?? "Ćwiczenie"}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {isBreathing
                        ? (ex?.breathing_config?.sessionDuration
                            ? `${Math.round(ex.breathing_config.sessionDuration / 60)} min`
                            : ex?.breathing_config?.sessionCycles
                              ? `${ex.breathing_config.sessionCycles} cykle`
                              : "Oddychanie")
                        : (isRunning || isAerobic)
                          ? (ex?.running_config?.totalMinutes ? `${ex.running_config.totalMinutes} min` : isRunning ? "Bieganie" : "Cardio")
                        : [
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

        </div>

        {/* ── Right: sidebar (desktop) ── */}
        <aside className="hidden lg:block space-y-3 sticky top-6">
          {/* Progress */}
          <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Postęp dzisiaj</p>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${items.length > 0 ? Math.round((done.size / items.length) * 100) : 0}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-600">{done.size}/{items.length}</span>
            </div>
            <p className="text-xs text-gray-400">
              {done.size === items.length && items.length > 0
                ? "Wszystkie ćwiczenia zrobione!"
                : `Pozostało ${items.length - done.size} ćwiczeń`}
            </p>
          </div>

          {/* Phase info */}
          {phaseInfo && <PhaseInfoCard phaseInfo={phaseInfo} />}

          {/* Educational materials */}
          <ContentList content={program.patient_program_content} />
        </aside>
      </div>
    </div>
  )
}

// ─── Shared sub-components ───────────────────────────────────────────────────

function PhaseInfoCard({ phaseInfo }: { phaseInfo: NonNullable<PhaseInfo> }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="bg-navy-700 px-4 py-3">
        <p className="text-[10px] font-semibold text-white/60 uppercase tracking-wide mb-0.5">{phaseInfo.protocolName}</p>
        <p className="text-sm font-bold text-white leading-snug">{phaseInfo.name}</p>
        <p className="text-xs text-white/60 mt-0.5">
          {phaseInfo.duration_weeks} {phaseInfo.duration_weeks === 1 ? "tydzień" : phaseInfo.duration_weeks < 5 ? "tygodnie" : "tygodni"}
        </p>
      </div>
      <div className="px-4 py-3 space-y-3">
        {phaseInfo.description && (
          <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{phaseInfo.description}</p>
        )}
        {phaseInfo.goals && (
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Target size={12} className="text-navy-500" />
              <p className="text-[10px] font-semibold text-navy-600 uppercase tracking-wide">Cele fazy</p>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">{phaseInfo.goals}</p>
          </div>
        )}
        {phaseInfo.patient_intro && (
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <BookOpen size={12} className="text-navy-500" />
              <p className="text-[10px] font-semibold text-navy-600 uppercase tracking-wide">Co cię czeka</p>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">{phaseInfo.patient_intro}</p>
          </div>
        )}
        {phaseInfo.rules && (
          <div className="bg-amber-50 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <ShieldCheck size={12} className="text-amber-600" />
              <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide">Zasady</p>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed whitespace-pre-line">{phaseInfo.rules}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function ContentList({ content }: { content?: ContentItem[] }) {
  const items = (content ?? []).slice().sort((a, b) => a.order - b.order)
  if (items.length === 0) return null
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-gray-100">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Materiały edukacyjne</p>
      </div>
      <div className="divide-y divide-gray-50">
        {items.map((pc) => {
          const c = Array.isArray(pc.educational_content) ? pc.educational_content[0] : pc.educational_content
          if (!c) return null
          const url = c.file_url ?? c.external_url
          return (
            <a
              key={pc.id}
              href={url ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-navy-50 flex items-center justify-center shrink-0">
                {c.type === "link" ? <ExternalLink size={14} className="text-navy-500" /> : <FileText size={14} className="text-navy-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">{c.name}</p>
                <p className="text-[10px] text-gray-400">{c.type === "pdf" ? "PDF" : c.type === "link" ? "Link" : c.type}</p>
              </div>
              <ChevronRight size={14} className="text-gray-300 shrink-0" />
            </a>
          )
        })}
      </div>
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
  showVasOnComplete: boolean
  phaseInfo?: PhaseInfo
  kod: string
}

function ExerciseSession({ item, isDone, onMark, onClose, onNext, hasNext, showVasOnComplete, phaseInfo }: SessionProps) {
  const [timerActive, setTimerActive] = useState(false)
  const [timeLeft, setTimeLeft] = useState(item.duration_seconds ?? 0)
  const [timerDone, setTimerDone] = useState(false)
  const [showVas, setShowVas] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const ex = Array.isArray(item.exercises) ? item.exercises[0] : item.exercises

  // Cleanup timer on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current)
    }
  }, [])

  // Breathing exercise — render full-screen player instead
  if (ex?.exercise_type === "breathing") {
    return (
      <BreathingPlayer
        item={item}
        exercise={ex}
        isDone={isDone}
        onMark={() => onMark(null)}
        onClose={onClose}
        onNext={onNext}
        hasNext={hasNext}
      />
    )
  }

  // Running/aerobic timed session — simple card
  const isTimedSession = ex?.exercise_type === "running_intervals" || ex?.exercise_type === "aerobic_session"
  if (isTimedSession && ex?.running_config) {
    return (
      <div className="min-h-screen bg-gray-50">
        <button onClick={onClose} className="inline-flex items-center gap-1.5 text-sm text-gray-500 px-4 pt-5 pb-3">
          <ArrowLeft size={14} />
          Wróć do listy
        </button>
        <div className="px-4 pb-8 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{ex.name}</h2>
            {ex.description && (
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">{ex.description}</p>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <TimedSessionCard
              config={ex.running_config}
              onMark={() => onMark(null)}
            />
          </div>
          {hasNext && (
            <button
              onClick={onNext}
              className="w-full h-11 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Następne ćwiczenie →
            </button>
          )}
        </div>
      </div>
    )
  }

  function startTimer() {
    if (intervalRef.current !== null) clearInterval(intervalRef.current)
    setTimerActive(true)
    setTimerDone(false)
    setTimeLeft(item.duration_seconds ?? 0)
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (intervalRef.current !== null) clearInterval(intervalRef.current)
          intervalRef.current = null
          setTimerActive(false)
          setTimerDone(true)
          return 0
        }
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
  const isDirectMp4 = !!ex?.video_url && !embedUrl &&
    (ex.video_url.endsWith(".mp4") || ex.video_url.includes(".mp4"))
  const isVideoFile = ex?.animated_gif_url && /\.(mp4|webm)(\?|$)/i.test(ex.animated_gif_url)
  const hasMedia = !!embedUrl || isDirectMp4 || !!isVideoFile || !!ex?.animated_gif_url || !!ex?.thumbnail_url

  // ── Shared info panel content ─────────────────────────────────────────────
  const paramsBlock = (
    <div className="flex gap-2">
      {item.sets && (
        <div className="flex-1 bg-navy-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-navy-700">{item.sets}</p>
          <p className="text-xs text-navy-400 mt-0.5">serie</p>
        </div>
      )}
      {item.reps && (
        <div className="flex-1 bg-navy-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-navy-700">{item.reps}</p>
          <p className="text-xs text-navy-400 mt-0.5">powtórzeń</p>
        </div>
      )}
      {item.duration_seconds && (
        <div className="flex-1 bg-navy-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-navy-700">
            {timerActive
              ? `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, "0")}`
              : timerDone ? "✓" : item.duration_seconds >= 60
                ? `${Math.floor(item.duration_seconds / 60)}:${String(item.duration_seconds % 60).padStart(2, "0")}`
                : item.duration_seconds}
          </p>
          <p className="text-xs text-navy-400 mt-0.5">
            {item.duration_seconds >= 60 ? "min" : "sekund"}
          </p>
        </div>
      )}
    </div>
  )

  const timerBlock = item.duration_seconds && !timerActive && !isDone ? (
    <button
      onClick={startTimer}
      className="w-full h-11 rounded-xl border border-navy-200 text-navy-600 font-medium text-sm flex items-center justify-center gap-2 hover:bg-navy-50 transition-colors"
    >
      {timerDone ? <><RotateCcw size={15} /> Ponów timer</> : <><Clock size={15} /> Uruchom timer</>}
    </button>
  ) : null

  const actionsBlock = (
    <div className="flex flex-col gap-2">
      {!isDone && (
        <button
          onClick={() => showVasOnComplete ? setShowVas(true) : onMark(null)}
          className="w-full h-12 rounded-xl bg-navy-500 hover:bg-navy-600 text-white font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <CheckCircle2 size={18} />
          Zrobione!
        </button>
      )}
      {isDone && hasNext && (
        <button
          onClick={onNext}
          className="w-full h-12 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold transition-colors flex items-center justify-center gap-2"
        >
          Następne ćwiczenie <ChevronRight size={18} />
        </button>
      )}
      {isDone && !hasNext && (
        <button
          onClick={onClose}
          className="w-full h-12 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <CheckCircle2 size={18} /> Koniec programu!
        </button>
      )}
      {isDone && (
        <button
          onClick={onClose}
          className="w-full h-10 rounded-xl border border-gray-200 text-gray-500 text-sm hover:bg-gray-50 transition-colors"
        >
          Wróć do listy
        </button>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {showVas && <VasPainModal onSubmit={(pain) => { setShowVas(false); onMark(pain) }} />}

      <button onClick={onClose} className="inline-flex items-center gap-1.5 text-sm text-gray-500 px-4 pt-5 pb-3">
        <ArrowLeft size={14} />
        Wróć do listy
      </button>

      {/* ══ NO MEDIA — single column with formatted description ══ */}
      {!hasMedia ? (
        <div className="max-w-2xl mx-auto px-4 pb-10 space-y-5">
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">{ex?.name}</h1>
            {ex?.body_part && <p className="text-sm text-gray-400 mt-0.5">{ex.body_part}</p>}
          </div>

          {paramsBlock}

          {ex?.description && (
            <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 space-y-1">
              <div className="flex items-center gap-2 mb-3">
                <ListChecks size={14} className="text-gray-400" />
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Instrukcja</p>
              </div>
              <DescriptionFormatter text={ex.description} />
            </div>
          )}

          {item.notes && (
            <div className="bg-amber-50 rounded-2xl px-5 py-4">
              <p className="text-xs font-semibold text-amber-700 mb-1.5">Wskazówka od fizjoterapeuty</p>
              <p className="text-sm text-amber-800 leading-relaxed">{item.notes}</p>
            </div>
          )}

          {timerBlock}
          {actionsBlock}
        </div>
      ) : (
        /* ══ HAS MEDIA — original 2-column layout ══ */
        <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-0 lg:items-start max-w-5xl mx-auto">
          {/* Video panel */}
          <div className="lg:sticky lg:top-0">
            <div className="w-full aspect-video bg-black">
              {embedUrl ? (
                <iframe src={embedUrl} className="w-full h-full" allowFullScreen allow="autoplay; encrypted-media" />
              ) : isDirectMp4 ? (
                <video src={ex!.video_url!} className="w-full h-full object-contain" controls playsInline autoPlay loop />
              ) : isVideoFile ? (
                <video src={ex!.animated_gif_url!} className="w-full h-full object-contain" controls playsInline autoPlay />
              ) : ex?.animated_gif_url ? (
                <img src={ex.animated_gif_url} alt={ex.name ?? ""} className="w-full h-full object-contain" />
              ) : (
                <img src={ex!.thumbnail_url!} alt={ex?.name ?? ""} className="w-full h-full object-cover" />
              )}
            </div>

            {phaseInfo && (phaseInfo.goals || phaseInfo.rules) && (
              <div className="hidden lg:block bg-white border-t border-gray-100 px-5 py-4 space-y-3">
                {phaseInfo.goals && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Target size={12} className="text-navy-500" />
                      <p className="text-[10px] font-semibold text-navy-600 uppercase tracking-wide">Cele fazy</p>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{phaseInfo.goals}</p>
                  </div>
                )}
                {phaseInfo.rules && (
                  <div className="bg-amber-50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <ShieldCheck size={12} className="text-amber-600" />
                      <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide">Zasady</p>
                    </div>
                    <p className="text-xs text-amber-900 leading-relaxed whitespace-pre-line">{phaseInfo.rules}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Info panel */}
          <div className="bg-white lg:min-h-screen lg:border-l border-gray-100 px-5 pt-5 pb-10 space-y-5">
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">{ex?.name}</h1>
              {ex?.body_part && <p className="text-sm text-gray-400 mt-0.5">{ex.body_part}</p>}
            </div>

            {paramsBlock}

            {(ex?.description || item.notes) && (
              <div className="rounded-xl overflow-hidden border border-gray-100">
                {ex?.description && (
                  <div className="bg-gray-50 px-4 py-3">
                    <p className="text-sm text-gray-600 leading-relaxed">{ex.description}</p>
                  </div>
                )}
                {item.notes && (
                  <div className={`bg-amber-50 px-4 py-3${ex?.description ? " border-t border-amber-100" : ""}`}>
                    <p className="text-xs font-semibold text-amber-700 mb-1">Wskazówka od fizjoterapeuty</p>
                    <p className="text-sm text-amber-800 leading-relaxed">{item.notes}</p>
                  </div>
                )}
              </div>
            )}

            {timerBlock}
            {actionsBlock}

            {phaseInfo && (phaseInfo.goals || phaseInfo.patient_intro || phaseInfo.rules) && (
              <div className="lg:hidden space-y-3 pt-2 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Info o fazie</p>
                {phaseInfo.goals && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Target size={12} className="text-navy-500" />
                      <p className="text-[10px] font-semibold text-navy-600 uppercase tracking-wide">Cele</p>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{phaseInfo.goals}</p>
                  </div>
                )}
                {phaseInfo.rules && (
                  <div className="bg-amber-50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <ShieldCheck size={12} className="text-amber-600" />
                      <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide">Zasady</p>
                    </div>
                    <p className="text-xs text-amber-900 leading-relaxed whitespace-pre-line">{phaseInfo.rules}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── VAS pain modal ───────────────────────────────────────────────────────────

interface VasModalProps {
  onSubmit: (pain: number | null) => void
}

function VasPainModal({ onSubmit }: VasModalProps) {
  const [pain, setPain] = useState<number | null>(null)
  const COLORS = ["#22c55e","#4ade80","#86efac","#bef264","#fde047","#fbbf24","#fb923c","#f97316","#ef4444","#dc2626","#991b1b"]
  const LABELS = ["Brak bólu","","","Lekki","","","Umiarkowany","","","Silny","Maksymalny"]

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl shadow-xl px-5 pt-6 pb-8">
        <h3 className="font-bold text-gray-900 text-center text-base mb-1">Jak się czujesz po treningu?</h3>
        <p className="text-xs text-gray-400 text-center mb-5">Oceń ogólny poziom bólu — 0 = brak, 10 = maksymalny</p>

        {/* Number grid */}
        <div className="grid grid-cols-11 gap-1 mb-2">
          {Array.from({ length: 11 }, (_, i) => (
            <button
              key={i}
              onClick={() => setPain(i)}
              className="aspect-square rounded-lg text-sm font-bold transition-all"
              style={{
                backgroundColor: pain === i ? COLORS[i] : `${COLORS[i]}33`,
                color: pain === i ? "#fff" : COLORS[i],
                transform: pain === i ? "scale(1.15)" : "scale(1)",
                boxShadow: pain === i ? `0 2px 8px ${COLORS[i]}66` : "none",
              }}
            >
              {i}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 mb-5">
          <span>Brak bólu</span>
          <span>Maksymalny ból</span>
        </div>

        {/* Selected label */}
        {pain !== null && (
          <div className="text-center mb-4">
            <span className="text-sm font-semibold" style={{ color: COLORS[pain] }}>
              {pain} — {LABELS[pain] || ""}
            </span>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => onSubmit(null)}
            className="flex-1 h-11 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
          >
            Pomiń
          </button>
          <button
            onClick={() => pain !== null && onSubmit(pain)}
            disabled={pain === null}
            className="flex-1 h-11 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-40"
            style={{ backgroundColor: pain !== null ? COLORS[pain] : "#94a3b8" }}
          >
            Zapisz
          </button>
        </div>
      </div>
    </div>
  )
}
