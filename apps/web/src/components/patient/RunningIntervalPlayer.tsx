"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Play, Pause, SkipForward, RotateCcw, CheckCircle2, PersonStanding } from "lucide-react"

type PhaseType = "walk" | "run" | "warmup" | "active" | "cooldown"

type Phase = {
  label: string
  duration: number // seconds
  type: PhaseType
}

type RunningConfig = {
  color: "emerald" | "sky" | "orange" | "violet"
  totalMinutes: number
  description?: string
  phases: Phase[]
}

const PHASE_STYLES: Record<PhaseType, {
  bg: string
  ring: string
  text: string
  label: string
  icon: string
  speed: number // animation duration in ms
}> = {
  walk:    { bg: "bg-sky-500",     ring: "ring-sky-300",     text: "text-sky-50",    label: "Marsz",       icon: "🚶",  speed: 1200 },
  run:     { bg: "bg-emerald-500", ring: "ring-emerald-300", text: "text-emerald-50",label: "Trucht",      icon: "🏃",  speed: 600  },
  warmup:  { bg: "bg-amber-500",   ring: "ring-amber-300",   text: "text-amber-50",  label: "Rozgrzewka",  icon: "🔥",  speed: 1400 },
  active:  { bg: "bg-sky-500",     ring: "ring-sky-300",     text: "text-sky-50",    label: "Aktywność",   icon: "⚡",  speed: 700  },
  cooldown:{ bg: "bg-indigo-500",  ring: "ring-indigo-300",  text: "text-indigo-50", label: "Schłodzenie", icon: "❄️",  speed: 1600 },
}

interface Props {
  config: RunningConfig
  onMark: () => void
}

export function RunningIntervalPlayer({ config, onMark }: Props) {
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(config.phases[0]?.duration ?? 0)
  const [pulse, setPulse] = useState(false)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const beepRef = useRef<AudioContext | null>(null)

  const totalDuration = config.phases.reduce((s, p) => s + p.duration, 0)
  const elapsedBefore = config.phases.slice(0, phaseIndex).reduce((s, p) => s + p.duration, 0)
  const elapsedTotal = elapsedBefore + (config.phases[phaseIndex]?.duration ?? 0) - timeLeft
  const progress = totalDuration > 0 ? elapsedTotal / totalDuration : 0

  const currentPhase = config.phases[phaseIndex]
  const style = currentPhase ? PHASE_STYLES[currentPhase.type] : PHASE_STYLES.walk

  function playBeep(freq: number, duration = 0.12) {
    try {
      if (!beepRef.current) beepRef.current = new AudioContext()
      const ctx = beepRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = "sine"
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.18, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + duration)
    } catch { /* ignore */ }
  }

  const advance = useCallback(() => {
    setPhaseIndex((prev) => {
      const next = prev + 1
      if (next >= config.phases.length) {
        setRunning(false)
        setDone(true)
        return prev
      }
      setTimeLeft(config.phases[next].duration)
      playBeep(660, 0.15)
      return next
    })
  }, [config.phases])

  useEffect(() => {
    if (!running) {
      if (tickRef.current) clearInterval(tickRef.current)
      return
    }
    tickRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          advance()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (tickRef.current) clearInterval(tickRef.current) }
  }, [running, advance])

  // Pulse animation
  useEffect(() => {
    if (!running) return
    const speed = style.speed
    const id = setInterval(() => setPulse((p) => !p), speed)
    return () => clearInterval(id)
  }, [running, style.speed, phaseIndex])

  function handleStart() {
    if (done) {
      setDone(false)
      setPhaseIndex(0)
      setTimeLeft(config.phases[0]?.duration ?? 0)
    }
    playBeep(528, 0.1)
    setRunning(true)
  }

  function handlePause() { setRunning(false) }

  function handleSkip() {
    playBeep(660, 0.12)
    advance()
  }

  function handleReset() {
    setRunning(false)
    setDone(false)
    setPhaseIndex(0)
    setTimeLeft(config.phases[0]?.duration ?? 0)
    setPulse(false)
  }

  function fmt(s: number) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, "0")}`
  }

  const nextPhase = config.phases[phaseIndex + 1]

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-10 text-center">
        <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 size={44} className="text-emerald-500" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Sesja zakończona!</h3>
          <p className="text-sm text-gray-500 mt-1">{fmt(totalDuration)} aktywności</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 h-10 px-5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <RotateCcw size={14} />
            Powtórz sesję
          </button>
          <button
            onClick={onMark}
            className="flex items-center gap-2 h-10 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors"
          >
            <CheckCircle2 size={14} />
            Zrobione!
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6 py-6 select-none">
      {/* Description */}
      {config.description && (
        <p className="text-xs text-gray-400 text-center max-w-xs">{config.description}</p>
      )}

      {/* Animated circle */}
      <div className="relative flex items-center justify-center">
        {/* Outer ring — pulses */}
        <div
          className={`absolute rounded-full ring-4 ${style.ring} transition-all duration-700`}
          style={{
            width: running && pulse ? 176 : 152,
            height: running && pulse ? 176 : 152,
            opacity: running ? (pulse ? 0.5 : 0.2) : 0.15,
          }}
        />
        {/* Main circle */}
        <div
          className={`relative w-36 h-36 rounded-full ${style.bg} flex flex-col items-center justify-center shadow-lg transition-all duration-500`}
          style={{ transform: running && pulse ? "scale(1.04)" : "scale(1)" }}
        >
          <span className="text-3xl leading-none mb-1">{style.icon}</span>
          <span className={`text-2xl font-bold tabular-nums ${style.text}`}>{fmt(timeLeft)}</span>
        </div>
      </div>

      {/* Current phase label */}
      <div className="text-center">
        <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Teraz</p>
        <p className="text-lg font-semibold text-gray-900">{currentPhase?.label}</p>
        {nextPhase && (
          <p className="text-xs text-gray-400 mt-1">
            Następnie: {nextPhase.label} ({fmt(nextPhase.duration)})
          </p>
        )}
      </div>

      {/* Phase dots */}
      <div className="flex items-center gap-1.5 flex-wrap justify-center max-w-xs">
        {config.phases.map((ph, i) => {
          const s = PHASE_STYLES[ph.type]
          return (
            <div
              key={i}
              title={ph.label}
              className={`h-2 rounded-full transition-all duration-300 ${
                i < phaseIndex ? "opacity-40" : i === phaseIndex ? "opacity-100 scale-110" : "opacity-20"
              } ${s.bg}`}
              style={{ width: Math.max(8, Math.round(ph.duration / totalDuration * 180)) }}
            />
          )
        })}
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>{fmt(elapsedTotal)}</span>
          <span>{fmt(totalDuration)}</span>
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${style.bg} rounded-full transition-all duration-1000`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleReset}
          className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors"
        >
          <RotateCcw size={15} />
        </button>

        {running ? (
          <button
            onClick={handlePause}
            className={`w-16 h-16 rounded-full ${style.bg} hover:opacity-90 flex items-center justify-center shadow-lg transition-all`}
          >
            <Pause size={24} className="text-white fill-white" />
          </button>
        ) : (
          <button
            onClick={handleStart}
            className={`w-16 h-16 rounded-full ${style.bg} hover:opacity-90 flex items-center justify-center shadow-lg transition-all`}
          >
            <Play size={24} className="text-white fill-white ml-1" />
          </button>
        )}

        <button
          onClick={handleSkip}
          disabled={phaseIndex >= config.phases.length - 1}
          className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-300 disabled:opacity-30 transition-colors"
        >
          <SkipForward size={15} />
        </button>
      </div>

      {/* Skip — mark as done without timer */}
      {!running && !done && (
        <button
          onClick={onMark}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-2"
        >
          Już wykonałem — oznacz jako ukończone
        </button>
      )}
    </div>
  )
}
