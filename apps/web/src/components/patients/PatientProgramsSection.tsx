"use client"

import { useState } from "react"
import { Printer } from "lucide-react"
import { PatientProgramEditModal } from "./PatientProgramEditModal"

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

  return (
    <>
      {programs.length > 0 ? (
        <div className="space-y-3">
          {programs.map((program) => (
            <div
              key={program.id}
              className={`flex items-center justify-between p-3 rounded-lg border border-gray-100 transition-colors ${
                program.status === "active" ? "hover:border-navy-200 hover:bg-navy-50/30" : "opacity-60"
              }`}
            >
              <div
                className={`flex-1 min-w-0 ${program.status === "active" ? "cursor-pointer" : ""}`}
                onClick={() => program.status === "active" ? setEditingProgram(program) : undefined}
              >
                <p className="text-sm font-medium text-gray-900">{program.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {program.status === "active" ? "Aktywny" : "Zakończony"}
                  {program.end_date && (
                    <> · kończy się {new Date(program.end_date).toLocaleDateString("pl-PL", { day: "numeric", month: "short" })}</>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <a
                  href={`/drukuj/program/${program.id}`}
                  target="_blank"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Drukuj / PDF"
                >
                  <Printer size={14} />
                </a>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  program.status === "active" ? "bg-navy-50 text-navy-600" : "bg-gray-100 text-gray-500"
                }`}>
                  {program.status === "active" ? "Aktywny" : "Zakończony"}
                </span>
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
