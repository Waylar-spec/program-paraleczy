"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronRight, Clock, CheckCircle2, Circle, MoreVertical, Trash2 } from "lucide-react"
import { advancePhase, setPatientPhase, removePatientProtocol } from "@/lib/actions/protocols"
import { toast } from "sonner"

type PatientProtocol = {
  id: string
  status: string
  start_date: string
  rehabilitation_protocols: {
    id: string
    name: string
    body_part: string | null
    total_weeks: number | null
    protocol_phases: { id: string; order: number; name: string; duration_weeks: number }[]
  } | null
  current_phase: { id: string; order: number; name: string; duration_weeks: number } | null
}

interface Props {
  patientProtocol: PatientProtocol
  patientId: string
}

export function PatientProtocolCard({ patientProtocol: pp, patientId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirmAdvance, setConfirmAdvance] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const protocol = pp.rehabilitation_protocols
  if (!protocol) return null

  const phases = [...(protocol.protocol_phases ?? [])].sort((a, b) => a.order - b.order)
  const currentPhase = pp.current_phase
  const currentPhaseIndex = currentPhase ? phases.findIndex((p) => p.id === currentPhase.id) : -1
  const isCompleted = pp.status === "completed"
  const isLastPhase = phases.length === 0 || currentPhaseIndex === phases.length - 1

  async function handleAdvance() {
    if (!confirmAdvance) {
      setConfirmAdvance(true)
      setTimeout(() => setConfirmAdvance(false), 3000)
      return
    }
    setConfirmAdvance(false)
    setLoading(true)
    try {
      await advancePhase(pp.id, patientId)
      if (isLastPhase) {
        toast.success("Protokół zakończony")
      } else {
        toast.success(`Faza: ${phases[currentPhaseIndex + 1]?.name}`, {
          description: "Program ćwiczeń został automatycznie przypisany",
        })
      }
      router.refresh()
    } catch {
      toast.error("Błąd zmiany fazy")
    } finally {
      setLoading(false)
    }
  }

  async function handleSetPhase(phaseId: string, phaseName: string) {
    setLoading(true)
    setMenuOpen(false)
    try {
      await setPatientPhase(pp.id, patientId, phaseId)
      toast.success(`Zmieniono na: ${phaseName}`)
      router.refresh()
    } catch {
      toast.error("Błąd zmiany fazy")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setMenuOpen(false)
      setTimeout(() => setConfirmDelete(false), 4000)
      return
    }
    setConfirmDelete(false)
    setLoading(true)
    try {
      await removePatientProtocol(pp.id, patientId)
      toast.success("Protokół usunięty")
      router.refresh()
    } catch {
      toast.error("Błąd usuwania protokołu")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gray-50/50 rounded-t-lg">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{protocol.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {protocol.body_part && (
              <span className="text-xs text-gray-500">{protocol.body_part}</span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              isCompleted
                ? "bg-gray-100 text-gray-500"
                : "bg-navy-50 text-navy-600"
            }`}>
              {isCompleted ? "Zakończony" : "Aktywny"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Advance / complete button */}
          {!isCompleted && (
            <button
              onClick={handleAdvance}
              disabled={loading}
              className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                confirmAdvance
                  ? "bg-navy-500 text-white"
                  : "border border-gray-200 text-gray-600 hover:bg-white hover:border-navy-200 hover:text-navy-600"
              }`}
            >
              {loading ? "..." : confirmAdvance ? "Potwierdź" : isLastPhase ? "Zakończ" : "Następna faza"}
              {!loading && !confirmAdvance && !isLastPhase && <ChevronRight size={12} />}
            </button>
          )}

          {/* Delete confirm pill */}
          {confirmDelete && (
            <button
              onClick={handleDelete}
              disabled={loading}
              className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-xs font-medium bg-red-500 text-white transition-colors"
            >
              <Trash2 size={11} />
              Usuń?
            </button>
          )}

          {/* Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-white hover:border-gray-300 transition-colors text-gray-400 hover:text-gray-600"
            >
              <MoreVertical size={14} />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-8 z-20 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[180px]">
                  {/* Phase list */}
                  {phases.length > 0 && (
                    <>
                      <p className="px-3 pt-1.5 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                        Zmień fazę
                      </p>
                      {phases.map((phase, i) => {
                        const isCurrent = phase.id === currentPhase?.id && !isCompleted
                        return (
                          <button
                            key={phase.id}
                            onClick={() => handleSetPhase(phase.id, phase.name)}
                            disabled={isCurrent}
                            className={`w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs transition-colors ${
                              isCurrent
                                ? "text-navy-600 font-medium bg-navy-50/50 cursor-default"
                                : "text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            <span className="w-4 h-4 rounded-full border border-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-500 shrink-0">
                              {i + 1}
                            </span>
                            <span className="truncate">{phase.name}</span>
                            {isCurrent && <span className="ml-auto text-[9px] text-navy-400">aktywna</span>}
                          </button>
                        )
                      })}
                      <div className="border-t border-gray-100 my-1" />
                    </>
                  )}

                  <button
                    onClick={handleDelete}
                    className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={12} />
                    Usuń protokół
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Phase timeline */}
      {phases.length > 0 && (
        <div className="px-3 py-2.5 flex items-center gap-1.5 overflow-x-auto rounded-b-lg">
          {phases.map((phase, i) => {
            const isDone = (currentPhaseIndex > i && !isCompleted) || isCompleted
            const isCurrent = phase.id === currentPhase?.id && !isCompleted
            return (
              <div key={phase.id} className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleSetPhase(phase.id, phase.name)}
                  disabled={loading || isCurrent}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors ${
                    isCurrent
                      ? "bg-navy-50 text-navy-700 font-medium cursor-default"
                      : isDone
                      ? "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  }`}
                  title={isCurrent ? undefined : `Przejdź do: ${phase.name}`}
                >
                  {isDone ? (
                    <CheckCircle2 size={12} className="text-green-500 shrink-0" />
                  ) : isCurrent ? (
                    <Clock size={12} className="text-navy-500 shrink-0" />
                  ) : (
                    <Circle size={12} className="shrink-0" />
                  )}
                  <span>{phase.name}</span>
                  <span className="text-gray-400 font-normal">({phase.duration_weeks}t)</span>
                </button>
                {i < phases.length - 1 && (
                  <ChevronRight size={10} className="text-gray-300 shrink-0" />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
