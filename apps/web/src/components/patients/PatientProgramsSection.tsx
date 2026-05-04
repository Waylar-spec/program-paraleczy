"use client"

import { useState } from "react"
import { Printer, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { PatientProgramEditModal } from "./PatientProgramEditModal"
import { deletePatientProgram } from "@/lib/actions/patient-programs"

type Program = {
  id: string
  name: string
  status: string
  start_date: string
  end_date: string | null
}

interface Props {
  programs: Program[]
  patientId: string
}

export function PatientProgramsSection({ programs, patientId }: Props) {
  const [editingProgram, setEditingProgram] = useState<Program | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete(programId: string) {
    setDeleting(true)
    try {
      await deletePatientProgram(programId, patientId)
      toast.success("Program usunięty")
      setConfirmDeleteId(null)
    } catch {
      toast.error("Nie udało się usunąć programu")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      {programs.length > 0 ? (
        <div className="space-y-3">
          {programs.map((program) => (
            <div key={program.id}>
              <div
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  confirmDeleteId === program.id
                    ? "border-red-200 bg-red-50"
                    : program.status === "active"
                    ? "border-gray-100 hover:border-navy-200 hover:bg-navy-50/30"
                    : "border-gray-100 opacity-60"
                }`}
              >
                <div
                  className={`flex-1 min-w-0 ${program.status === "active" ? "cursor-pointer" : ""}`}
                  onClick={() => program.status === "active" && confirmDeleteId !== program.id ? setEditingProgram(program) : undefined}
                >
                  <p className="text-sm font-medium text-gray-900">{program.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {program.status === "active" ? "Aktywny" : "Zakończony"}
                    {program.end_date && (
                      <> · kończy się {new Date(program.end_date).toLocaleDateString("pl-PL", { day: "numeric", month: "short" })}</>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <a
                    href={`/drukuj/program/${program.id}`}
                    target="_blank"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Drukuj / PDF"
                  >
                    <Printer size={14} />
                  </a>
                  {confirmDeleteId === program.id ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="h-7 px-2.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        Anuluj
                      </button>
                      <button
                        onClick={() => handleDelete(program.id)}
                        disabled={deleting}
                        className="h-7 px-2.5 rounded-lg text-xs font-medium bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 transition-colors"
                      >
                        {deleting ? "Usuwam..." : "Usuń"}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(program.id) }}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      title="Usuń program"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">Brak przypisanych programów</p>
        </div>
      )}

      {editingProgram && (
        <PatientProgramEditModal
          programId={editingProgram.id}
          programName={editingProgram.name}
          patientId={patientId}
          onClose={() => setEditingProgram(null)}
        />
      )}
    </>
  )
}
