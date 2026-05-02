"use client"

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts"

interface Props {
  data: { date: string; value: number }[]
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
  })
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
  const date = label ? formatDate(label) : ""
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm text-xs">
      <p className="text-gray-500">{date}</p>
      <p className="font-semibold text-gray-900">Ból: {payload[0].value}/10</p>
    </div>
  )
}

export function VasChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-sm">Brak wyników VAS</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart
        data={data}
        margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 10]}
          ticks={[0, 2, 4, 6, 8, 10]}
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
          width={28}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine
          y={3}
          stroke="#22c55e"
          strokeDasharray="4 2"
          label={{
            value: "Łagodny",
            position: "insideTopRight",
            fontSize: 10,
            fill: "#22c55e",
          }}
        />
        <ReferenceLine
          y={7}
          stroke="#ef4444"
          strokeDasharray="4 2"
          label={{
            value: "Silny",
            position: "insideTopRight",
            fontSize: 10,
            fill: "#ef4444",
          }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#ef4444"
          strokeWidth={2}
          dot={{ fill: "#ef4444", r: 4, strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
