"use client"

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"
import { Activity } from "lucide-react"

type AdherenceData = {
  programId: string
  programName: string
  status: string
  totalItems: number
  adherencePct: number
  lastActivityAt: string | null
  avgPain: number | null
  last7days: { date: string; done: number }[]
  last30days: { date: string; done: number; expected: number }[]
}

interface Props {
  data: AdherenceData[]
}

const POLISH_DAY_ABBR: Record<number, string> = {
  0: "Nd",
  1: "Pn",
  2: "Wt",
  3: "Śr",
  4: "Cz",
  5: "Pt",
  6: "Sb",
}

function formatXTick(dateStr: string, idx: number): string {
  if (idx % 5 !== 0) return ""
  const d = new Date(dateStr)
  return POLISH_DAY_ABBR[d.getDay()] ?? ""
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const date = label
    ? new Date(label).toLocaleDateString("pl-PL", {
        day: "numeric",
        month: "short",
        weekday: "short",
      })
    : ""
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm text-xs">
      <p className="text-gray-500">{date}</p>
      <p className="font-semibold text-gray-900">
        {payload[0].value} ćwiczeń
      </p>
    </div>
  )
}

export function AdherenceChart({ data }: Props) {
  const active = data.filter((d) => d.status === "active")

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Activity size={24} className="mx-auto mb-2 opacity-40" />
        <p className="text-sm">Brak danych o aktywnościach</p>
      </div>
    )
  }

  // Aggregate last30days across all active programs by date
  const dateMap = new Map<string, number>()

  const source = active.length > 0 ? active : data
  for (const prog of source) {
    for (const day of prog.last30days ?? []) {
      dateMap.set(day.date, (dateMap.get(day.date) ?? 0) + day.done)
    }
  }

  // Build sorted array
  const chartData = Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, done]) => ({ date, done }))

  const maxDone = Math.max(...chartData.map((d) => d.done), 0)

  // Summary stats
  const activeData = active.length > 0 ? active : data
  const avgAdherence =
    activeData.length > 0
      ? Math.round(
          activeData.reduce((s, d) => s + d.adherencePct, 0) / activeData.length
        )
      : 0

  const totalSessions = chartData.reduce((s, d) => s + d.done, 0)

  const allPains = activeData
    .map((d) => d.avgPain)
    .filter((p): p is number => p !== null)
  const avgPain =
    allPains.length > 0
      ? Math.round((allPains.reduce((s, p) => s + p, 0) / allPains.length) * 10) /
        10
      : null

  const hasData = chartData.some((d) => d.done > 0)

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Adherencja (30 dni)</p>
          <p
            className={`text-xl font-bold ${
              avgAdherence >= 70
                ? "text-green-600"
                : avgAdherence >= 40
                ? "text-yellow-600"
                : "text-red-500"
            }`}
          >
            {avgAdherence}%
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Sesje w tym miesiącu</p>
          <p className="text-xl font-bold text-gray-900">{totalSessions}</p>
        </div>
        {avgPain !== null ? (
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Średni ból</p>
            <p
              className={`text-xl font-bold ${
                avgPain > 5
                  ? "text-red-500"
                  : avgPain > 3
                  ? "text-yellow-600"
                  : "text-green-600"
              }`}
            >
              {avgPain}/10
            </p>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Średni ból</p>
            <p className="text-xl font-bold text-gray-400">—</p>
          </div>
        )}
      </div>

      {/* Chart */}
      {!hasData ? (
        <div className="text-center py-6 text-gray-400">
          <p className="text-sm">Brak danych</p>
        </div>
      ) : (
        <div>
          <p className="text-xs text-gray-400 mb-2">Aktywność — ostatnie 30 dni</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} barSize={8} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tickFormatter={(val, idx) => formatXTick(val, idx)}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              {maxDone > 0 && (
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
              )}
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f3f4f6" }} />
              <Bar dataKey="done" fill="#1e3a5f" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Per-program list */}
      {data.length > 0 && (
        <div className="space-y-2 border-t border-gray-100 pt-3">
          {data.map((d) => (
            <div
              key={d.programId}
              className={`flex items-center justify-between text-sm ${
                d.status !== "active" ? "opacity-60" : ""
              }`}
            >
              <span className="text-gray-700 truncate max-w-[60%]">{d.programName}</span>
              <span
                className={`font-medium ${
                  d.adherencePct >= 70
                    ? "text-green-600"
                    : d.adherencePct >= 40
                    ? "text-yellow-600"
                    : "text-red-500"
                }`}
              >
                {d.adherencePct}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
