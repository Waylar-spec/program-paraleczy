"use client"

import { useState, useEffect, useRef } from "react"
import { Play, Pause, RotateCcw, CheckCircle2, Timer } from "lucide-react"

type SessionConfig = {
  color: "emerald" | "sky" | "orange" | "violet"
  totalMinutes: number
  howTo?: string          // step-by-step or bullet info
  steps?: string[]        // optional structured steps
}

const COLOR: Record<string, { bg: string; text: string; ring: string; light: string }> = {
  emerald: { bg: "bg-emerald-500", text: "text-emerald-600", ring: "ring-emerald-200", light: "bg-emerald-50" },
  sky:     { bg: "bg-sky-500",     text: "text-sky-600",     ring: "ring-sky-200",     light: "bg-sky-50"     },
  orange:  { bg: "bg-orange-500",  text: "text-orange-600",  ring: "ring-orange-200",  light: "bg-orange-50"  },
  violet:  { bg: "bg-violet-500",  text: "text-violet-600",  ring: "ring-violet-200",  light: "bg-violet-50"  },
}

interface Props {
  config: SessionConfig
  onMark: () => void
}

export function TimedSessionCard({ config, onMark }: Props) {
  const hasTimer = (config.totalMinutes ?? 0) > 0
  const totalSeconds = (config.totalMinutes ?? 0) * 60
  const [timeLeft, setTimeLeft] = useState(totalSeconds)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const c = COLOR[config.color] ?? COLOR.emerald
  const progress = totalSeconds > 0 ? 1 - timeLeft / totalSeconds : 0

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(intervalRef.current!)
          setRunning(false)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running])

  function fmt(s: number) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, "0")}`
  }

  function reset() {
    setRunning(false)
    setTimeLeft(totalSeconds)
  }

  return (
    <div className="space-y-4">
      {/* How-to */}
      {(config.howTo || config.steps) && (
        <div className={`rounded-xl ${c.light} p-4`}>
          <p className={`text-xs font-semibold uppercase tracking-wide ${c.text} mb-2`}>Jak to zrobić</p>
          {config.steps ? (
            <ul className="space-y-1.5">
              {config.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className={`shrink-0 w-5 h-5 rounded-full ${c.bg} text-white text-xs flex items-center justify-center font-bold mt-0.5`}>
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{config.howTo}</p>
          )}
        </div>
      )}

      {/* Timer — only when totalMinutes > 0 */}
      {hasTimer && (
        <div className="flex flex-col items-center gap-4 py-4">
          {/* Circle timer */}
          <div className="relative w-36 h-36">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="none" stroke="#f3f4f6" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="44"
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                stroke="currentColor"
                className={c.text}
                strokeDasharray={`${2 * Math.PI * 44}`}
                strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress)}`}
                style={{ transition: running ? "stroke-dashoffset 1s linear" : "none" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Timer size={16} className="text-gray-400 mb-0.5" />
              <span className="text-2xl font-bold tabular-nums text-gray-900">{fmt(timeLeft)}</span>
              <span className="text-xs text-gray-400">{config.totalMinutes} min</span>
            </div>
          </div>

          {/* Timer controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={reset}
              className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={() => setRunning((r) => !r)}
              className={`w-14 h-14 rounded-full ${c.bg} text-white flex items-center justify-center shadow-md hover:opacity-90 transition-all`}
            >
              {running
                ? <Pause size={22} className="fill-white" />
                : <Play size={22} className="fill-white ml-0.5" />}
            </button>
            <div className="w-9 h-9" /> {/* spacer */}
          </div>

          <p className="text-xs text-gray-400">
            {running ? "Timer działa — możesz odłożyć telefon" : timeLeft === totalSeconds ? "Opcjonalny timer" : "Wstrzymano"}
          </p>
        </div>
      )}

      {/* Done button — always visible */}
      <button
        onClick={onMark}
        className={`w-full h-13 py-3.5 rounded-xl ${c.bg} text-white font-semibold text-base flex items-center justify-center gap-2 shadow-sm hover:opacity-90 transition-all`}
      >
        <CheckCircle2 size={18} />
        Zrobione!
      </button>
    </div>
  )
}
