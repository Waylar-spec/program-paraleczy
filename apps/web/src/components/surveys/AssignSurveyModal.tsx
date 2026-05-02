"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, ClipboardList } from "lucide-react"
import { assignSurveyToProgram } from "@/lib/actions/surveys"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import type { Survey, SurveySchedule } from "@/lib/actions/surveys"

type PatientProgram = {
  id: string
  name: string
}

interface Props {
  patientId: string
  surveys: Survey[]
  programs?: PatientProgram[]
}

const SCHEDULE_OPTIONS: { value: SurveySchedule; label: string }[] = [
  { value: "on_start", label: "Na początku" },
  { value: "on_end", label: "Na końcu" },
  { value: "weekly", label: "Co tydzień" },
  { value: "custom", label: "Indywidualnie" },
]

export function AssignSurveyModal({ patientId, surveys, programs = [] }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedSurvey, setSelectedSurvey] = useState("")
  const [selectedProgram, setSelectedProgram] = useState(programs[0]?.id ?? "")
  const [schedule, setSchedule] = useState<SurveySchedule>("on_start")
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return surveys
    return surveys.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.description ?? "").toLowerCase().includes(q)
    )
  }, [surveys, search])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSurvey || !selectedProgram) return
    setLoading(true)
    try {
      await assignSurveyToProgram(selectedProgram, selectedSurvey, schedule)
      const sv = surveys.find((s) => s.id === selectedSurvey)
      toast.success(`Kwestionariusz "${sv?.name}" został przypisany do programu`)
      setOpen(false)
      setSelectedSurvey("")
      setSchedule("on_start")
      setSearch("")
      router.refresh()
    } catch {
      toast.error("Nie udało się przypisać kwestionariusza")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
        <Plus size={15} />
        Przypisz kwestionariusz
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Przypisz kwestionariusz</DialogTitle>
        </DialogHeader>

        {surveys.length === 0 ? (
          <div className="py-6 text-center text-sm text-gray-500">
            Brak kwestionariuszy w bibliotece.
          </div>
        ) : programs.length === 0 ? (
          <div className="py-6 text-center text-sm text-gray-500">
            Pacjent nie ma aktywnych programów.{" "}
            <span className="text-navy-500">Najpierw przypisz program ćwiczeń.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {/* Survey selector */}
            <div className="space-y-1.5">
              <Label>Kwestionariusz *</Label>
              <div className="relative mb-2">
                <Search
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Szukaj kwestionariusza..."
                  className="w-full h-9 pl-8 pr-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-400 bg-white"
                />
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {filtered.length === 0 && (
                  <p className="text-sm text-gray-400 py-2 text-center">Brak wyników</p>
                )}
                {filtered.map((sv) => {
                  const qCount = sv.question_count ?? 0
                  const isSystem = sv.practitioner_id === null
                  return (
                    <label
                      key={sv.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedSurvey === sv.id
                          ? "border-navy-500 bg-navy-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="survey"
                        value={sv.id}
                        checked={selectedSurvey === sv.id}
                        onChange={() => setSelectedSurvey(sv.id)}
                        className="accent-navy-500"
                      />
                      <div className="w-7 h-7 rounded-md bg-navy-50 flex items-center justify-center shrink-0">
                        <ClipboardList size={14} className="text-navy-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">{sv.name}</p>
                        <p className="text-xs text-gray-400">
                          {isSystem ? "Systemowy · " : "Własny · "}
                          {qCount} {qCount === 1 ? "pytanie" : qCount < 5 ? "pytania" : "pytań"}
                        </p>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Program selector */}
            <div className="space-y-1.5">
              <Label>Program ćwiczeń *</Label>
              <select
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                required
                className="w-full h-9 px-3 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Schedule */}
            <div className="space-y-1.5">
              <Label>Harmonogram</Label>
              <div className="grid grid-cols-2 gap-2">
                {SCHEDULE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-sm transition-colors ${
                      schedule === opt.value
                        ? "border-navy-500 bg-navy-50 text-navy-700"
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="schedule"
                      value={opt.value}
                      checked={schedule === opt.value}
                      onChange={() => setSchedule(opt.value)}
                      className="accent-navy-500"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

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
                disabled={loading || !selectedSurvey || !selectedProgram}
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
