"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { UserPlus } from "lucide-react"
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
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && patients.length === 0) {
      getPatientsList().then(setPatients)
    }
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPatient) return
    setLoading(true)
    try {
      await assignProtocolToPatient(selectedPatient, protocol.id, startDate)
      const pat = patients.find((p) => p.id === selectedPatient)
      toast.success(`Protokół przypisany do ${pat?.first_name} ${pat?.last_name}`)
      setOpen(false)
      setSelectedPatient("")
      router.refresh()
    } catch {
      toast.error("Nie udało się przypisać protokołu")
    } finally {
      setLoading(false)
    }
  }

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
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-sm text-gray-900">Przypisz do pacjenta</h3>
              <p className="text-xs text-gray-500 mt-0.5">{protocol.name}</p>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700">Pacjent *</label>
                <select
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                  className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-navy-400"
                  required
                >
                  <option value="">— wybierz pacjenta —</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name}
                    </option>
                  ))}
                </select>
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
                  onClick={() => setOpen(false)}
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
