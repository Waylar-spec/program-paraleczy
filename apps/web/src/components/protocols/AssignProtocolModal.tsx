"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Activity, Search, Layers, Clock } from "lucide-react"
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
  const [customName, setCustomName] = useState("")
  const [search, setSearch] = useState("")
  const [bodyPart, setBodyPart] = useState<string | null>(null)

  const bodyParts = useMemo(() => {
    const parts = protocols.map((p) => p.body_part).filter(Boolean) as string[]
    return Array.from(new Set(parts)).sort((a, b) => a.localeCompare(b, "pl"))
  }, [protocols])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return protocols.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.indication ?? "").toLowerCase().includes(q) ||
        (p.body_part ?? "").toLowerCase().includes(q)
      const matchesBodyPart = !bodyPart || p.body_part === bodyPart
      return matchesSearch && matchesBodyPart
    })
  }, [protocols, search, bodyPart])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedProtocol || !startDate) return
    setLoading(true)
    try {
      await assignProtocolToPatient(patientId, selectedProtocol, startDate, startWeek ? Number(startWeek) : undefined, customName || undefined)
      const proto = protocols.find((p) => p.id === selectedProtocol)
      const displayName = customName.trim() || proto?.name
      toast.success(`Protokół "${displayName}" przypisany`)
      setOpen(false)
      setSelectedProtocol("")
      setCustomName("")
      setSearch("")
      setBodyPart(null)
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

  const hasData = !!selectedProtocol || !!customName.trim() || !!startWeek

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && hasData) {
          toast.warning("Wybierz protokół lub wyczyść formularz przed zamknięciem")
          return
        }
        setOpen(v)
      }}
    >
      <DialogTrigger className="inline-flex items-center gap-2 h-8 px-3 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
        <Activity size={13} />
        Przypisz protokół
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
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
              <div className="relative mb-2">
                <Search
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Szukaj protokołu..."
                  className="w-full h-9 pl-8 pr-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-400 bg-white"
                />
              </div>
              {bodyParts.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pb-1">
                  <button
                    type="button"
                    onClick={() => setBodyPart(null)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      bodyPart === null
                        ? "bg-navy-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Wszystkie
                  </button>
                  {bodyParts.map((part) => (
                    <button
                      key={part}
                      type="button"
                      onClick={() => setBodyPart(bodyPart === part ? null : part)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        bodyPart === part
                          ? "bg-navy-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {part}
                    </button>
                  ))}
                </div>
              )}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {filtered.length === 0 && (
                  <p className="text-sm text-gray-400 py-2 text-center">Brak wyników</p>
                )}
                {filtered.map((proto) => {
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

            <div className="space-y-1.5">
              <Label htmlFor="ap-custom-name">Nazwa dla pacjenta</Label>
              <Input
                id="ap-custom-name"
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={protocols.find(p => p.id === selectedProtocol)?.name ?? "Zostaw puste aby użyć nazwy protokołu"}
              />
              <p className="text-xs text-gray-400">Pacjent zobaczy tę nazwę zamiast domyślnej nazwy protokołu</p>
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

            {/* Summary */}
            {selectedProto && (
              <div className="bg-navy-50 rounded-xl px-4 py-3 space-y-1">
                <p className="text-xs font-semibold text-navy-700">{selectedProto.name}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-navy-600">
                  {selectedProto.body_part && <span>{selectedProto.body_part}</span>}
                  <span className="flex items-center gap-1">
                    <Layers size={11} />
                    {sortedPhases.length} {sortedPhases.length === 1 ? "faza" : sortedPhases.length < 5 ? "fazy" : "faz"}
                  </span>
                  {selectedProto.total_weeks && (
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {selectedProto.total_weeks} tyg.
                    </span>
                  )}
                  {detectedPhase ? (
                    <span className="font-medium">Start: Faza {detectedPhase.order} — {detectedPhase.name}</span>
                  ) : sortedPhases[0] ? (
                    <span>Start: Faza 1 — {sortedPhases[0].name}</span>
                  ) : null}
                </div>
              </div>
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
