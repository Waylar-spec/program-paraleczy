"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Activity } from "lucide-react"
import { assignProtocolToPatient } from "@/lib/actions/protocols"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"

type Phase = {
  id: string
  order: number
  name: string
  duration_weeks: number
}

type Protocol = {
  id: string
  name: string
  indication: string | null
  body_part: string | null
  total_weeks: number | null
  protocol_phases: Phase[]
}

interface Props {
  patientId: string
  protocols: Protocol[]
}

export function AssignProtocolModal({ patientId, protocols }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedProtocol, setSelectedProtocol] = useState("")
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0])
  const [startWeek, setStartWeek] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedProtocol || !startDate) return
    setLoading(true)
    try {
      await assignProtocolToPatient(patientId, selectedProtocol, startDate, startWeek ? Number(startWeek) : undefined)
      const proto = protocols.find((p) => p.id === selectedProtocol)
      toast.success(`Protokół "${proto?.name}" przypisany`)
      setOpen(false)
      setSelectedProtocol("")
      router.refresh()
    } catch {
      toast.error("Nie udało się przypisać protokołu")
    } finally {
      setLoading(false)
    }
  }

  const selectedProto = protocols.find((p) => p.id === selectedProtocol)
  const sortedPhases = selectedProto
    ? [...selectedProto.protocol_phases].sort((a, b) => a.order - b.order)
    : []

  function getPhaseForWeek(week: number): Phase | null {
    let cumulative = 0
    for (const phase of sortedPhases) {
      cumulative += phase.duration_weeks
      if (week <= cumulative) return phase
    }
    return sortedPhases[sortedPhases.length - 1] ?? null
  }

  const weekNum = startWeek ? Number(startWeek) : null
  const detectedPhase = weekNum && weekNum > 0 ? getPhaseForWeek(weekNum) : null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center gap-2 h-8 px-3 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
        <Activity size={13} />
        Przypisz protokół
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Przypisz protokół rehabilitacyjny</DialogTitle>
        </DialogHeader>
        {protocols.length === 0 ? (
          <div className="py-6 text-center text-sm text-gray-500">
            Brak protokołów.{" "}
            <a href="/biblioteka/protokoly" className="text-navy-500 hover:underline">
              Utwórz pierwszy protokół
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Protokół *</Label>
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {protocols.map((proto) => {
                  const phaseCount = proto.protocol_phases?.length ?? 0
                  return (
                    <label
                      key={proto.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedProtocol === proto.id
                          ? "border-navy-500 bg-navy-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="protocol"
                        value={proto.id}
                        checked={selectedProtocol === proto.id}
                        onChange={() => setSelectedProtocol(proto.id)}
                        className="accent-navy-500"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">{proto.name}</p>
                        <p className="text-xs text-gray-400">
                          {proto.body_part && `${proto.body_part} · `}
                          {phaseCount} {phaseCount === 1 ? "faza" : phaseCount < 5 ? "fazy" : "faz"}
                          {proto.total_weeks && ` · ${proto.total_weeks} tyg.`}
                        </p>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ap-start">Data rozpoczęcia *</Label>
                <Input
                  id="ap-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ap-week">Tydzień od operacji</Label>
                <Input
                  id="ap-week"
                  type="number"
                  min="1"
                  value={startWeek}
                  onChange={(e) => setStartWeek(e.target.value)}
                  placeholder="np. 3"
                />
              </div>
            </div>
            {detectedPhase && (
              <p className="text-xs text-navy-600 bg-navy-50 px-3 py-2 rounded-lg">
                Tydzień {weekNum} → start od fazy <strong>{detectedPhase.order}. {detectedPhase.name}</strong>
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex items-center h-9 px-4 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Anuluj
              </button>
              <button
                type="submit"
                disabled={loading || !selectedProtocol || !startDate}
                className="inline-flex items-center h-9 px-4 rounded-lg bg-navy-500 hover:bg-navy-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
              >
                {loading ? "Przypisywanie..." : "Przypisz"}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
