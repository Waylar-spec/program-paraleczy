"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { X, CheckCircle2, Wind } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

export type BreathingPhase = {
  label: string
  cue: string
  duration: number
}

export type BreathingConfig = {
  pattern: string
  sessionDuration?: number   // seconds; 0 = count cycles
  sessionCycles?: number     // used when sessionDuration === 0
  color: "emerald" | "navy" | "purple" | "amber"
  phases: BreathingPhase[]
}

type ExerciseData = {
  id: string
  name: string
  description: string | null
  thumbnail_url: string | null
  animated_gif_url?: string | null
  video_url: string | null
  body_part: string | null
  exercise_type?: string | null
  breathing_config?: BreathingConfig | null | any
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

interface Props {
  item: ExerciseItem
  exercise: ExerciseData & { breathing_config?: BreathingConfig }
  isDone: boolean
  onMark: () => void
  onClose: () => void
  onNext: () => void
  hasNext: boolean
}

// ─── Color palette ────────────────────────────────────────────────────────────

const COLORS = {
  emerald: {
    hex: "#10b981",
    glow: "rgba(16,185,129,0.35)",
    ring: "rgba(16,185,129,0.15)",
    bg: "from-emerald-950 via-gray-950 to-gray-950",
    text: "text-emerald-400",
    btn: "bg-emerald-500 hover:bg-emerald-400",
    bar: "bg-emerald-500",
    badge: "bg-emerald-900/60 text-emerald-300",
  },
  navy: {
    hex: "#3b5bdb",
    glow: "rgba(59,91,219,0.4)",
    ring: "rgba(59,91,219,0.15)",
    bg: "from-blue-950 via-gray-950 to-gray-950",
    text: "text-blue-400",
    btn: "bg-blue-600 hover:bg-blue-500",
    bar: "bg-blue-500",
    badge: "bg-blue-900/60 text-blue-300",
  },
  purple: {
    hex: "#8b5cf6",
    glow: "rgba(139,92,246,0.4)",
    ring: "rgba(139,92,246,0.15)",
    bg: "from-purple-950 via-gray-950 to-gray-950",
    text: "text-purple-400",
    btn: "bg-purple-600 hover:bg-purple-500",
    bar: "bg-purple-500",
    badge: "bg-purple-900/60 text-purple-300",
  },
  amber: {
    hex: "#f59e0b",
    glow: "rgba(245,158,11,0.35)",
    ring: "rgba(245,158,11,0.15)",
    bg: "from-amber-950 via-gray-950 to-gray-950",
    text: "text-amber-400",
    btn: "bg-amber-500 hover:bg-amber-400",
    bar: "bg-amber-500",
    badge: "bg-amber-900/60 text-amber-300",
  },
} as const

// ─── Tone frequencies ─────────────────────────────────────────────────────────

function getToneHz(label: string): number {
  const l = label.toLowerCase()
  if (l.includes("wdech")) return 432
  if (l.includes("wydech")) return 396
  return 528 // hold / pause
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function fmt(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return m > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${s}s`
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BreathingPlayer({ item, exercise, isDone, onMark, onClose, onNext, hasNext }: Props) {
  const config: BreathingConfig = exercise.breathing_config ?? {
    pattern: "coherence",
    sessionDuration: 300,
    color: "emerald",
    phases: [
      { label: "Wdech", cue: "nosem", duration: 5.5 },
      { label: "Wydech", cue: "nosem", duration: 5.5 },
    ],
  }

  const palette = COLORS[config.color] ?? COLORS.emerald
  const phases = config.phases
  const totalPhaseDuration = phases.reduce((s, p) => s + p.duration, 0)
  const useCycles = !config.sessionDuration || config.sessionDuration === 0
  const totalCycles = config.sessionCycles ?? 4
  const totalSeconds = useCycles
    ? totalCycles * totalPhaseDuration
    : config.sessionDuration!

  // ── State ──
  const [started, setStarted] = useState(false)
  const [finished, setFinished] = useState(false)
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [phaseElapsed, setPhaseElapsed] = useState(0)   // seconds into current phase
  const [totalElapsed, setTotalElapsed] = useState(0)   // seconds elapsed overall
  const [cycle, setCycle] = useState(1)
  const [scale, setScale] = useState(0.6)
  const [isHold, setIsHold] = useState(false)

  // Audio
  const audioCtxRef = useRef<AudioContext | null>(null)

  const playTone = useCallback((hz: number) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      const ctx = audioCtxRef.current
      if (ctx.state === "suspended") ctx.resume()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = "sine"
      osc.frequency.setValueAtTime(hz, ctx.currentTime)
      gain.gain.setValueAtTime(0, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.02)
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.12)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.15)
    } catch {
      // Audio not available — silent fallback
    }
  }, [])

  // ── Derived phase info ──
  const currentPhase = phases[phaseIdx]
  const phaseDuration = currentPhase?.duration ?? 1
  const phaseRemaining = Math.max(0, phaseDuration - phaseElapsed)
  const sessionRemaining = Math.max(0, totalSeconds - totalElapsed)

  // Progress bar: 0..1
  const progress = totalSeconds > 0 ? Math.min(totalElapsed / totalSeconds, 1) : 0

  // Circle scale based on phase label
  const targetScale = (() => {
    const l = (currentPhase?.label ?? "").toLowerCase()
    if (l.includes("wdech")) return 1.0
    if (l.includes("wydech")) return 0.6
    return scale  // hold — stay where we are
  })()

  // Detect hold phase
  const currentIsHold = (() => {
    const l = (currentPhase?.label ?? "").toLowerCase()
    return !l.includes("wdech") && !l.includes("wydech")
  })()

  // ── Timer tick ──
  useEffect(() => {
    if (!started || finished) return

    const interval = setInterval(() => {
      setPhaseElapsed((prev) => {
        const next = prev + 0.1
        if (next >= phaseDuration) {
          // Advance to next phase
          const nextIdx = (phaseIdx + 1) % phases.length
          const isNewCycle = nextIdx === 0
          const newCycle = isNewCycle ? cycle + 1 : cycle

          setPhaseIdx(nextIdx)
          setPhaseElapsed(0)
          if (isNewCycle) setCycle(newCycle)

          // Play tone for next phase
          const nextPhase = phases[nextIdx]
          if (nextPhase) playTone(getToneHz(nextPhase.label))

          // Update scale for next phase
          const nl = (phases[nextIdx]?.label ?? "").toLowerCase()
          if (nl.includes("wdech")) setScale(1.0)
          else if (nl.includes("wydech")) setScale(0.6)
          // hold — keep current

          return 0
        }
        return next
      })

      setTotalElapsed((prev) => {
        const next = prev + 0.1
        if (next >= totalSeconds) {
          setFinished(true)
          return totalSeconds
        }
        return next
      })
    }, 100)

    return () => clearInterval(interval)
  }, [started, finished, phaseIdx, phaseDuration, phases, cycle, totalSeconds, playTone])

  // Update scale when phase changes
  useEffect(() => {
    const l = (currentPhase?.label ?? "").toLowerCase()
    if (l.includes("wdech")) setScale(1.0)
    else if (l.includes("wydech")) setScale(0.6)
    setIsHold(currentIsHold)
  }, [phaseIdx, currentPhase, currentIsHold])

  function handleStart() {
    setStarted(true)
    setFinished(false)
    setPhaseIdx(0)
    setPhaseElapsed(0)
    setTotalElapsed(0)
    setCycle(1)
    setScale(0.6)
    // Play first tone
    playTone(getToneHz(phases[0]?.label ?? ""))
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  // Circle transition duration = phase duration
  const transitionDuration = currentIsHold ? 0 : `${phaseDuration}s`

  return (
    <div className={`fixed inset-0 z-50 bg-gradient-to-b ${palette.bg} flex flex-col`}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <X size={18} className="text-white/70" />
        </button>

        <div className="text-center">
          <p className="text-white font-semibold text-sm leading-tight">{exercise.name}</p>
          {exercise.body_part && (
            <p className="text-white/40 text-[11px]">{exercise.body_part}</p>
          )}
        </div>

        {/* Cycle badge */}
        <div className={`text-xs font-semibold px-2.5 py-1 rounded-full ${palette.badge}`}>
          {useCycles
            ? `${cycle}/${totalCycles}`
            : fmt(sessionRemaining)
          }
        </div>
      </div>

      {/* Main breathing area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6">

        {/* ── Glowing circle ── */}
        <div className="relative flex items-center justify-center" style={{ width: 260, height: 260 }}>
          {/* Outer ring — subtle ambient glow */}
          <div
            className="absolute rounded-full transition-all"
            style={{
              width: 260,
              height: 260,
              background: palette.ring,
              transform: `scale(${started ? (scale * 1.15 + 0.1) : 0.9})`,
              transition: currentIsHold
                ? "transform 0.3s ease-in-out"
                : `transform ${transitionDuration} ease-in-out`,
            }}
          />

          {/* Main circle */}
          <div
            className="absolute rounded-full"
            style={{
              width: 220,
              height: 220,
              background: `radial-gradient(circle at 40% 40%, ${palette.hex}cc, ${palette.hex}88)`,
              boxShadow: `0 0 60px 20px ${palette.glow}, 0 0 120px 40px ${palette.glow.replace("0.35", "0.15").replace("0.4", "0.12")}`,
              transform: `scale(${started ? scale : 0.6})`,
              transition: currentIsHold
                ? "transform 0.3s ease-in-out"
                : `transform ${transitionDuration} ease-in-out`,
            }}
          />

          {/* Hold pulse ring — only when holding */}
          {started && currentIsHold && (
            <div
              className="absolute rounded-full animate-ping"
              style={{
                width: 220,
                height: 220,
                border: `2px solid ${palette.hex}66`,
                animationDuration: "2s",
              }}
            />
          )}

          {/* Circle content */}
          <div className="relative z-10 text-center">
            {!started && !finished ? (
              <div className="text-white/60 text-sm">Gotowy?</div>
            ) : finished ? (
              <div className="text-white text-center">
                <div className="text-4xl mb-1">✓</div>
                <div className="text-sm text-white/80">Ukończono!</div>
              </div>
            ) : (
              <>
                <p className="text-white text-2xl font-bold leading-none">
                  {currentPhase?.label}
                </p>
                {currentPhase?.cue && (
                  <p className="text-white/60 text-xs mt-1">{currentPhase.cue}</p>
                )}
                <p className={`text-3xl font-mono font-bold mt-2 ${palette.text}`}>
                  {Math.ceil(phaseRemaining)}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Phase indicator dots */}
        {started && !finished && (
          <div className="flex items-center gap-2">
            {phases.map((p, i) => (
              <div
                key={i}
                className="transition-all duration-300"
                style={{
                  width: i === phaseIdx ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: i === phaseIdx ? palette.hex : `${palette.hex}44`,
                }}
              />
            ))}
          </div>
        )}

        {/* Phase labels row */}
        {started && !finished && (
          <div className="flex items-center gap-3">
            {phases.map((p, i) => (
              <span
                key={i}
                className="text-xs font-medium transition-all duration-300"
                style={{ color: i === phaseIdx ? palette.hex : "rgba(255,255,255,0.25)" }}
              >
                {p.label}
              </span>
            ))}
          </div>
        )}

        {/* Description / instructions before start */}
        {!started && !finished && exercise.description && (
          <div className="max-w-xs text-center">
            <p className="text-white/50 text-sm leading-relaxed">{exercise.description}</p>
          </div>
        )}

        {/* Session info before start */}
        {!started && !finished && (
          <div className="flex items-center gap-4">
            {useCycles ? (
              <div className="text-center">
                <p className="text-white font-semibold text-lg">{totalCycles}</p>
                <p className="text-white/40 text-xs">cykli</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-white font-semibold text-lg">{fmt(totalSeconds)}</p>
                <p className="text-white/40 text-xs">sesja</p>
              </div>
            )}
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-white font-semibold text-lg">{totalPhaseDuration}s</p>
              <p className="text-white/40 text-xs">cykl</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-white font-semibold text-lg">{phases.length}</p>
              <p className="text-white/40 text-xs">fazy</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="shrink-0 px-6 pb-10 pt-4 space-y-3">

        {/* Progress bar */}
        {started && (
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full ${palette.bar} rounded-full transition-all duration-300`}
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        )}

        {/* Time remaining */}
        {started && !finished && (
          <p className="text-center text-white/40 text-xs">
            {useCycles
              ? `Cykl ${cycle} z ${totalCycles}`
              : `${fmt(sessionRemaining)} pozostało`}
          </p>
        )}

        {/* Notes from physio */}
        {item.notes && (
          <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
            <p className="text-white/50 text-xs font-medium mb-0.5">Wskazówka od fizjoterapeuty</p>
            <p className="text-white/70 text-sm">{item.notes}</p>
          </div>
        )}

        {/* Action buttons */}
        {!started && !finished && (
          <div className="space-y-2">
            <button
              onClick={handleStart}
              className={`w-full h-14 rounded-2xl ${palette.btn} text-white font-bold text-base flex items-center justify-center gap-2.5 transition-all shadow-lg`}
              style={{ boxShadow: `0 4px 24px ${palette.glow}` }}
            >
              <Wind size={20} />
              Rozpocznij ćwiczenie
            </button>
            {!isDone && (
              <button
                onClick={onMark}
                className="w-full h-10 rounded-xl border border-white/15 text-white/40 text-sm hover:bg-white/5 hover:text-white/60 transition-colors"
              >
                Już wykonałem — oznacz jako ukończone
              </button>
            )}
          </div>
        )}

        {started && !finished && (
          <button
            onClick={onClose}
            className="w-full h-11 rounded-xl border border-white/15 text-white/50 text-sm hover:bg-white/5 transition-colors"
          >
            Zakończ sesję
          </button>
        )}

        {finished && (
          <div className="space-y-2">
            {!isDone && (
              <button
                onClick={onMark}
                className={`w-full h-14 rounded-2xl ${palette.btn} text-white font-bold text-base flex items-center justify-center gap-2.5 transition-all shadow-lg`}
                style={{ boxShadow: `0 4px 24px ${palette.glow}` }}
              >
                <CheckCircle2 size={20} />
                Zrobione!
              </button>
            )}
            {isDone && hasNext && (
              <button
                onClick={onNext}
                className="w-full h-14 rounded-2xl bg-green-500 hover:bg-green-400 text-white font-bold text-base flex items-center justify-center gap-2 transition-all"
              >
                Następne ćwiczenie
              </button>
            )}
            {isDone && !hasNext && (
              <button
                onClick={onClose}
                className="w-full h-14 rounded-2xl bg-green-500 hover:bg-green-400 text-white font-bold text-base flex items-center justify-center gap-2 transition-all"
              >
                <CheckCircle2 size={20} />
                Koniec programu!
              </button>
            )}
            <button
              onClick={handleStart}
              className="w-full h-10 rounded-xl border border-white/15 text-white/40 text-sm hover:bg-white/5 transition-colors"
            >
              Powtórz sesję
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
