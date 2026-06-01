"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { UserPlus, Search, Check } from "lucide-react"
import { assignProtocolToPatient } from "@/lib/actions/protocols"
import { getPatientsList } from "@/lib/actions/patients"
import { toast } from "sonner"

type Protocol = {
  id: string
  name: string
  total_weeks: number | null
  protocol_phases: { id: string; order: number; name: string; duration_weeks: number }[]
}

interface Props {
  protocol: Protocol
}

export function AssignProtocolFromLibraryButton({ protocol }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [patients, setPatients] = useState<{ id: string; first_name: string; last_name: string }[]>([])
  const [selectedPatient, setSelectedPatient] = useState("")
  const [patientSearch, setPatientSearch] = useState("")
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && patients.length === 0) {
      getPatientsList().then(setPatients)
    }
  }, [open])

  const filteredPatients = useMemo(() => {
    const q = patientSearch.trim().toLowerCase()
    if (!q) return patients
    return patients.filter((p) =>
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(q)
    )
  }, [patients, patientSearch])

  function handleClose() {
    setOpen(false)
    setSelectedPatient("")
    setPatientSearch("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPatient) return
    setLoading(true)
    try {
      await assignProtocolToPatient(selectedPatient, protocol.id, startDate)
      const pat = patients.find((p) => p.id === selectedPatient)
      toast.success(`Protokół przypisany do ${pat?.first_name} ${pat?.last_name}`)
      handleClose()
      router.refresh()
    } catch {
      toast.error("Nie udało się przypisać protokołu")
    } finally {
      setLoading(false)
    }
  }

  const selectedPat = patients.find((p) => p.id === selectedPatient)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex-1 h-8 rounded-lg bg-navy-500 hover:bg-navy-600 text-xs font-medium text-white transition-colors flex items-center justify-center gap-1"
      >
        <UserPlus size={11} /> Przypisz
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-sm text-gray-900">Przypisz do pacjenta</h3>
              <p className="text-xs text-gray-500 mt-0.5">{protocol.name}</p>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700">Pacjent *</label>

                {/* Search input */}
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Szukaj pacjenta..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="w-full h-9 pl-8 pr-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-400"
                  />
                </div>

                {/* Scrollable patient list */}
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100">
                  {patients.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">Ładowanie pacjentów…</p>
                  ) : filteredPatients.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">Brak wyników</p>
                  ) : (
                    filteredPatients.map((p) => {
                      const isSelected = selectedPatient === p.id
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedPatient(p.id)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors ${
                            isSelected
                              ? "bg-navy-50 text-navy-700"
                              : "hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          <span className="text-sm font-medium">
                            {p.first_name} {p.last_name}
                          </span>
                          {isSelected && <Check size={14} className="text-navy-500 shrink-0" />}
                        </button>
                      )
                    })
                  )}
                </div>

                {selectedPat && (
                  <p className="text-xs text-navy-600 font-medium">
                    Wybrano: {selectedPat.first_name} {selectedPat.last_name}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700">Data rozpoczęcia *</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-400"
                  required
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedPatient}
                  className="flex-1 h-10 rounded-xl bg-navy-500 hover:bg-navy-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
                >
                  {loading ? "Przypisuję..." : "Przypisz"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
