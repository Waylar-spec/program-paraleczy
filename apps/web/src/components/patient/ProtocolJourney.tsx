"use client"

import Link from "next/link"
import { CheckCircle2, Lock, Play, ChevronRight, Activity } from "lucide-react"

type Phase = {
  id: string
  order: number
  name: string
  description: string | null
  goals: string | null
  patient_intro: string | null
  rules: string | null
  duration_weeks: number
  template_id: string | null
}

type LinkedProgram = {
  id: string
  name: string
} | null

type PatientProtocol = {
  id: string
  status: string
  start_date: string
  protocol: {
    name: string
    description: string | null
    total_weeks: number | null
    body_part: string | null
  } | null
  phases: Phase[]
  currentPhaseIdx: number
  linkedProgram: LinkedProgram
}

interface Props {
  protocols: PatientProtocol[]
  kod: string
}

export function ProtocolJourney({ protocols, kod }: Props) {
  if (protocols.length === 0) return null

  return (
    <div className="space-y-4">
      {protocols.map((pp) => (
        <ProtocolCard key={pp.id} pp={pp} kod={kod} />
      ))}
    </div>
  )
}

function ProtocolCard({ pp, kod }: { pp: PatientProtocol; kod: string }) {
  const { protocol, phases, currentPhaseIdx, linkedProgram, status } = pp
  if (!protocol) return null

  const totalPhases = phases.length
  const completedCount = currentPhaseIdx >= 0 ? currentPhaseIdx : 0
  const isCompleted = status === "completed"
  const progress = totalPhases > 0
    ? isCompleted ? 100 : Math.round((completedCount / totalPhases) * 100)
    : 0

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-navy-700 px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0 mt-0.5">
            <Activity size={16} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/70 font-medium uppercase tracking-wide mb-0.5">
              Protokół rehabilitacyjny
            </p>
            <h2 className="text-base font-bold text-white leading-tight">{protocol.name}</h2>
            {protocol.body_part && (
              <p className="text-xs text-white/75 mt-0.5">{protocol.body_part}</p>
            )}
          </div>
          {isCompleted && (
            <span className="shrink-0 text-xs bg-green-500 text-white font-semibold px-2.5 py-1 rounded-full">
              Ukończony
            </span>
          )}
        </div>

        {/* Progress bar */}
        {totalPhases > 0 && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-white/75">
                {isCompleted
                  ? "Wszystkie fazy ukończone"
                  : currentPhaseIdx >= 0
                  ? `Faza ${currentPhaseIdx + 1} z ${totalPhases}`
                  : "Oczekuje na start"}
              </span>
              <span className="text-xs font-semibold text-white">{progress}%</span>
            </div>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>


      {/* Phase timeline */}
      <div className="px-4 py-3 space-y-1">
        {phases.map((phase, idx) => {
          const isCurrent = idx === currentPhaseIdx && !isCompleted
          const isDone = isCompleted ? true : idx < currentPhaseIdx

          return (
            <PhaseRow
              key={phase.id}
              phase={phase}
              isCurrent={isCurrent}
              isDone={isDone}
              isLast={idx === phases.length - 1}
              linkedProgram={isCurrent ? linkedProgram : null}
              kod={kod}
            />
          )
        })}
      </div>
    </div>
  )
}

function PhaseRow({
  phase,
  isCurrent,
  isDone,
  isLast,
  linkedProgram,
  kod,
}: {
  phase: Phase
  isCurrent: boolean
  isDone: boolean
  isLast: boolean
  linkedProgram: LinkedProgram
  kod: string
}) {
  const inner = (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
        isCurrent
          ? linkedProgram
            ? "bg-navy-50 hover:bg-navy-100 cursor-pointer"
            : "bg-navy-50/50"
          : isDone
          ? "opacity-50"
          : "opacity-30"
      }`}
    >
      {/* Icon */}
      <div className="relative shrink-0">
        {isDone ? (
          <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 size={14} className="text-green-600" />
          </div>
        ) : isCurrent ? (
          <div className="w-7 h-7 rounded-full bg-navy-600 flex items-center justify-center">
            <Play size={11} className="text-white fill-white ml-0.5" />
          </div>
        ) : (
          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
            <Lock size={11} className="text-gray-400" />
          </div>
        )}
        {!isLast && (
          <div className={`absolute left-1/2 -translate-x-1/2 top-7 w-0.5 h-3 ${isDone ? "bg-green-200" : "bg-gray-100"}`} />
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-tight ${isCurrent ? "text-navy-800" : isDone ? "text-gray-500" : "text-gray-400"}`}>
          {phase.name}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {phase.duration_weeks} {phase.duration_weeks === 1 ? "tydzień" : phase.duration_weeks < 5 ? "tygodnie" : "tygodni"}
        </p>
      </div>

      {isCurrent && linkedProgram && (
        <ChevronRight size={15} className="text-navy-400 shrink-0" />
      )}
      {isCurrent && !linkedProgram && (
        <span className="shrink-0 text-[10px] bg-navy-600 text-white font-medium px-1.5 py-0.5 rounded-full leading-none">
          Aktywna
        </span>
      )}
    </div>
  )

  if (isCurrent && linkedProgram) {
    return <Link href={`/p/${kod}/program/${linkedProgram.id}`}>{inner}</Link>
  }
  return inner
}
