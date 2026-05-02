"use client"

import { Activity, TrendingUp, TrendingDown, Minus, Calendar } from "lucide-react"

type AdherenceData = {
  programId: string
  programName: string
  status: string
  totalItems: number
  adherencePct: number
  lastActivityAt: string | null
  avgPain: number | null
  last7days: { date: string; done: number }[]
}

interface Props {
  data: AdherenceData[]
}

function MiniBar({ days }: { days: { date: string; done: number }[] }) {
  const max = Math.max(...days.map((d) => d.done), 1)
  return (
    <div className="flex items-end gap-0.5 h-6">
      {days.map((d) => (
        <div
          key={d.date}
          className="flex-1 rounded-sm transition-all"
          style={{
            height: d.done > 0 ? `${Math.max(20, (d.done / max) * 100)}%` : "15%",
            backgroundColor: d.done > 0 ? "#0F4C81" : "#E5E7EB",
          }}
          title={`${new Date(d.date).toLocaleDateString("pl-PL", { weekday: "short", day: "numeric" })}: ${d.done} ćwiczeń`}
        />
      ))}
    </div>
  )
}

function PctRing({ pct }: { pct: number }) {
  const r = 18
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  const color = pct >= 70 ? "#22c55e" : pct >= 40 ? "#f59e0b" : "#ef4444"

  return (
    <svg width="48" height="48" viewBox="0 0 48 48" className="shrink-0">
      <circle cx="24" cy="24" r={r} fill="none" stroke="#E5E7EB" strokeWidth="4" />
      <circle
        cx="24" cy="24" r={r} fill="none"
        stroke={color} strokeWidth="4"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 24 24)"
      />
      <text x="24" y="28" textAnchor="middle" fontSize="11" fontWeight="700" fill={color}>
        {pct}%
      </text>
    </svg>
  )
}

export function AdherenceSection({ data }: Props) {
  const active = data.filter((d) => d.status === "active")
  const inactive = data.filter((d) => d.status !== "active")

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Activity size={24} className="mx-auto mb-2 opacity-40" />
        <p className="text-sm">Brak danych o aktywnościach</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {[...active, ...inactive].map((d) => {
        const lastDate = d.lastActivityAt
          ? new Date(d.lastActivityAt).toLocaleDateString("pl-PL", { day: "numeric", month: "short" })
          : null

        return (
          <div key={d.programId} className={`rounded-xl border p-4 ${d.status !== "active" ? "opacity-60" : "border-gray-100"}`}>
            <div className="flex items-start gap-3">
              <PctRing pct={d.adherencePct} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900 truncate">{d.programName}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${
                    d.status === "active" ? "bg-navy-50 text-navy-600" : "bg-gray-100 text-gray-500"
                  }`}>
                    {d.status === "active" ? "Aktywny" : "Zakończony"}
                  </span>
                </div>

                <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                  <span className="text-xs text-gray-500">
                    Adherencja (30 dni): <strong>{d.adherencePct}%</strong>
                  </span>
                  {d.avgPain !== null && (
                    <span className="text-xs text-gray-500">
                      Średni ból: <strong className={d.avgPain > 5 ? "text-red-500" : d.avgPain > 3 ? "text-yellow-600" : "text-green-600"}>
                        {d.avgPain}/10
                      </strong>
                    </span>
                  )}
                  {lastDate && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar size={11} />
                      Ostatnia aktywność: {lastDate}
                    </span>
                  )}
                </div>

                {/* 7-day sparkline */}
                <div className="mt-2">
                  <p className="text-xs text-gray-400 mb-1">Ostatnie 7 dni</p>
                  <MiniBar days={d.last7days} />
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
