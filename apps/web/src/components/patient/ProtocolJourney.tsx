"use client"

import Link from "next/link"
import { CheckCircle2, Lock, Play, ChevronRight, Activity, BookOpen, ShieldCheck, Target, FileText } from "lucide-react"

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
  const currentPhase = phases[currentPhaseIdx] ?? null

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

      {/* Protocol description */}
      {protocol.description && (
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{protocol.description}</p>
        </div>
      )}

      {/* Current phase expanded card */}
      {currentPhase && !isCompleted && (
        <div className="px-4 pt-4 pb-2 space-y-3">
          <div className="rounded-xl bg-navy-50 border border-navy-100 overflow-hidden">
            {/* Phase header */}
            <div className="px-4 py-3 bg-navy-100/60 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-navy-600 flex items-center justify-center shrink-0">
                <Play size={10} className="text-white fill-white ml-0.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-navy-500 font-medium">Aktualna faza</p>
                <p className="text-sm font-bold text-navy-800 leading-tight">{currentPhase.name}</p>
              </div>
              <span className="shrink-0 text-xs text-navy-500 font-medium">
                {currentPhase.duration_weeks} {currentPhase.duration_weeks === 1 ? "tydzień" : currentPhase.duration_weeks < 5 ? "tygodnie" : "tygodni"}
              </span>
            </div>

            <div className="px-4 py-3 space-y-3">
              {/* Description */}
              {currentPhase.description && (
                <div className="flex gap-2.5">
                  <FileText size={14} className="text-navy-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-navy-700 leading-relaxed whitespace-pre-line">{currentPhase.description}</p>
                </div>
              )}

              {/* Goals */}
              {currentPhase.goals && (
                <div className="rounded-lg bg-white border border-navy-100 p-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Target size={13} className="text-navy-500 shrink-0" />
                    <p className="text-xs font-semibold text-navy-600 uppercase tracking-wide">Cele fazy</p>
                  </div>
                  <p className="text-sm text-navy-800 leading-relaxed whitespace-pre-line">{currentPhase.goals}</p>
                </div>
              )}

              {/* Patient intro */}
              {currentPhase.patient_intro && (
                <div className="rounded-lg bg-white border border-navy-100 p-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <BookOpen size={13} className="text-navy-500 shrink-0" />
                    <p className="text-xs font-semibold text-navy-600 uppercase tracking-wide">Co cię czeka</p>
                  </div>
                  <p className="text-sm text-navy-800 leading-relaxed whitespace-pre-line">{currentPhase.patient_intro}</p>
                </div>
              )}

              {/* Rules */}
              {currentPhase.rules && (
                <div className="rounded-lg bg-amber-50 border border-amber-100 p-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <ShieldCheck size={13} className="text-amber-600 shrink-0" />
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Zasady</p>
                  </div>
                  <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-line">{currentPhase.rules}</p>
                </div>
              )}

              {/* CTA — go to exercises */}
              {linkedProgram && (
                <Link
                  href={`/p/${kod}/program/${linkedProgram.id}`}
                  className="flex items-center justify-between gap-3 bg-navy-600 hover:bg-navy-700 active:bg-navy-800 text-white rounded-lg px-4 py-3 transition-colors"
                >
                  <span className="text-sm font-semibold">Ćwiczenia tej fazy</span>
                  <ChevronRight size={16} />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

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
}: {
  phase: Phase
  isCurrent: boolean
  isDone: boolean
  isLast: boolean
}) {
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${
        isCurrent ? "bg-navy-50/50" : isDone ? "opacity-50" : "opacity-30"
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

      {isCurrent && (
        <span className="shrink-0 text-[10px] bg-navy-600 text-white font-medium px-1.5 py-0.5 rounded-full leading-none">
          Aktywna
        </span>
      )}
    </div>
  )
}
