"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { UserPlus, Search, Check } from "lucide-react"
import { assignProtocolToPatient } from "@/lib/actions/protocols"
import { getPatientsList } from "@/lib/actions/patients"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
  const [startWeek, setStartWeek] = useState("")
  const [customName, setCustomName] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && patients.length === 0) {
      getPatientsList().then(setPatients)
    }
  }, [open, patients.length])

  const filteredPatients = useMemo(() => {
    const q = patientSearch.trim().toLowerCase()
    if (!q) return patients
    return patients.filter((p) =>
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(q)
    )
  }, [patients, patientSearch])

  // Sorted phases for week → phase detection
  const sortedPhases = useMemo(
    () => [...protocol.protocol_phases].sort((a, b) => a.order - b.order),
    [protocol.protocol_phases]
  )

  function getPhaseForWeek(week: number) {
    let cumulative = 0
    for (const phase of sortedPhases) {
      cumulative += phase.duration_weeks
      if (week <= cumulative) return phase
    }
    return sortedPhases[sortedPhases.length - 1] ?? null
  }

  const weekNum = startWeek ? Number(startWeek) : null
  const detectedPhase = weekNum && weekNum > 0 ? getPhaseForWeek(weekNum) : null

  function handleClose() {
    setOpen(false)
    setSelectedPatient("")
    setPatientSearch("")
    setStartWeek("")
    setCustomName("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPatient) return
    setLoading(true)
    try {
      await assignProtocolToPatient(
        selectedPatient,
        protocol.id,
        startDate,
        startWeek ? Number(startWeek) : undefined,
        customName.trim() || undefined,
      )
      const pat = patients.find((p) => p.id === selectedPatient)
      const displayName = customName.trim() || protocol.name
      toast.success(`„${displayName}" przypisany do ${pat?.first_name} ${pat?.last_name}`)
      handleClose()
      router.refresh()
    } catch {
      toast.error("Nie udało się przypisać protokołu")
    } finally {
      setLoading(false)
    }
  }

  const selectedPat = patients.find((p) => p.id === selectedPatient)
  const hasData = !!selectedPatient || !!customName.trim() || !!startWeek

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && hasData) {
          toast.warning("Wybierz pacjenta lub wyczyść formularz przed zamknięciem")
          return
        }
        if (!v) handleClose()
        else setOpen(true)
      }}
    >
      <DialogTrigger
        onClick={() => setOpen(true)}
        className="flex-1 h-8 rounded-lg bg-navy-500 hover:bg-navy-600 text-xs font-medium text-white transition-colors flex items-center justify-center gap-1"
      >
        <UserPlus size={11} /> Przypisz
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Przypisz do pacjenta</DialogTitle>
          <p className="text-xs text-gray-500">{protocol.name}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-1">
          {/* Patient picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">Pacjent *</label>
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
            <div className="max-h-44 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100">
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
                        isSelected ? "bg-navy-50 text-navy-700" : "hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <span className="text-sm font-medium">{p.first_name} {p.last_name}</span>
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

          {/* Custom name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">Nazwa dla pacjenta</label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={protocol.name}
              className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-400"
            />
            <p className="text-xs text-gray-400">Zostaw puste aby użyć domyślnej nazwy</p>
          </div>

          {/* Date + start week */}
          <div className="grid grid-cols-2 gap-3">
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
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700">Tydzień od op.</label>
              <input
                type="number"
                min="1"
                value={startWeek}
                onChange={(e) => setStartWeek(e.target.value)}
                placeholder="np. 3"
                className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-400"
              />
            </div>
          </div>
          {detectedPhase && (
            <p className="text-xs text-navy-600 bg-navy-50 px-3 py-2 rounded-lg">
              Tydzień {weekNum} → start od fazy{" "}
              <strong>{detectedPhase.order}. {detectedPhase.name}</strong>
            </p>
          )}

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
      </DialogContent>
    </Dialog>
  )
}
