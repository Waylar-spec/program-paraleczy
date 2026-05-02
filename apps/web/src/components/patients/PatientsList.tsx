"use client"

import { useState } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { pl } from "date-fns/locale"
import { User, Search, X } from "lucide-react"

type Program = {
  id: string
  name: string
  status: string
  start_date: string
  end_date: string | null
}

type Patient = {
  id: string
  first_name: string
  last_name: string
  birth_year: number | null
  gender: string | null
  access_code: string
  last_seen_at: string | null
  patient_programs: Program[]
}

interface PatientsListProps {
  patients: Patient[]
}

function getActiveProgram(programs: Program[]) {
  return programs.find((p) => p.status === "active") ?? programs[0] ?? null
}

function genderIcon(gender: string | null) {
  if (gender === "male") return "♂"
  if (gender === "female") return "♀"
  return "—"
}

export function PatientsList({ patients }: PatientsListProps) {
  const [search, setSearch] = useState("")

  const filtered = search.trim()
    ? patients.filter((p) =>
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase())
      )
    : patients

  if (patients.length === 0) return null

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Szukaj pacjentów..."
          className="w-full h-9 pl-9 pr-8 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-navy-400 bg-white"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={13} />
          </button>
        )}
      </div>
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Table header */}
      <div className="grid grid-cols-[40px_1fr_120px_1fr] gap-4 px-5 py-3 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wide">
        <div></div>
        <div>Pacjent</div>
        <div>Rok ur.</div>
        <div>Aktywny program</div>
      </div>

      {/* Rows */}
      {filtered.length === 0 ? (
        <div className="py-10 text-center text-sm text-gray-400">Brak wyników dla "{search}"</div>
      ) : filtered.map((patient) => {
        const activeProgram = getActiveProgram(patient.patient_programs)
        const endDate = activeProgram?.end_date ? new Date(activeProgram.end_date) : null

        return (
          <Link
            key={patient.id}
            href={`/pacjenci/${patient.id}`}
            className="grid grid-cols-[40px_1fr_120px_1fr] gap-4 px-5 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition-colors items-center last:border-0"
          >
            {/* Gender icon */}
            <div className="text-gray-400 text-sm text-center">
              <User size={16} className="mx-auto" />
            </div>

            {/* Name */}
            <div>
              <span className="text-sm font-medium text-gray-900">
                {patient.first_name}{" "}
                <span className="font-semibold">{patient.last_name}</span>
              </span>
              {patient.last_seen_at && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Ostatnio widziany{" "}
                  {formatDistanceToNow(new Date(patient.last_seen_at), {
                    addSuffix: true,
                    locale: pl,
                  })}
                </p>
              )}
            </div>

            {/* Birth year */}
            <div className="text-sm text-gray-600">
              {patient.birth_year ?? "—"}
            </div>

            {/* Program */}
            <div>
              {activeProgram ? (
                <div>
                  <p className="text-sm text-navy-600 font-medium leading-tight">
                    {activeProgram.name}
                  </p>
                  {endDate && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      kończy się{" "}
                      {endDate.toLocaleDateString("pl-PL", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>
              ) : (
                <span className="text-sm text-gray-400">Brak programu</span>
              )}
            </div>

          </Link>
        )
      })}
    </div>
    </div>
  )
}
