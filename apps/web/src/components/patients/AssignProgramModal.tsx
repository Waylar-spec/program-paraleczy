"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search } from "lucide-react"
import { assignTemplateToPatient } from "@/lib/actions/patient-programs"
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

type Template = {
  id: string
  name: string
  body_part: string | null
  program_template_items: { id: string }[]
}

interface Props {
  patientId: string
  templates: Template[]
}

export function AssignProgramModal({ patientId, templates }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0])
  const [durationWeeks, setDurationWeeks] = useState("4")
  const [search, setSearch] = useState("")

  const filteredTemplates = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return templates
    return templates.filter(t =>
      t.name.toLowerCase().includes(q) ||
      (t.body_part ?? "").toLowerCase().includes(q)
    )
  }, [templates, search])

  function calcEndDate(weeks: string): string | undefined {
    if (!weeks || weeks === "0") return undefined
    const d = new Date(startDate)
    d.setDate(d.getDate() + Number(weeks) * 7)
    return d.toISOString().split("T")[0]
  }

  function endLabel(weeks: string): string {
    const end = calcEndDate(weeks)
    if (!end) return ""
    return new Date(end).toLocaleDateString("pl-PL", { day: "numeric", month: "short" })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedTemplate || !startDate) return
    setLoading(true)
    try {
      await assignTemplateToPatient(patientId, selectedTemplate, {
        startDate,
        endDate: calcEndDate(durationWeeks),
      })
      const tpl = templates.find((t) => t.id === selectedTemplate)
      toast.success(`Program "${tpl?.name}" został przypisany`)
      setOpen(false)
      setSelectedTemplate("")
      setDurationWeeks("4")
      router.refresh()
    } catch (err) {
      toast.error("Nie udało się przypisać programu")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-navy-500 hover:bg-navy-600 text-white text-sm font-medium transition-colors">
        <Plus size={15} />
        Przypisz program
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Przypisz program</DialogTitle>
        </DialogHeader>
        {templates.length === 0 ? (
          <div className="py-6 text-center text-sm text-gray-500">
            Brak szablonów programów.{" "}
            <a href="/biblioteka/szablony" className="text-navy-500 hover:underline">
              Utwórz pierwszy szablon
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Szablon programu *</Label>
              <div className="relative mb-2">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Szukaj szablonu..."
                  className="w-full h-9 pl-8 pr-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-400 bg-white"
                />
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {filteredTemplates.length === 0 && (
                  <p className="text-sm text-gray-400 py-2 text-center">Brak wyników</p>
                )}
                {filteredTemplates.map((tpl) => {
                  const count = tpl.program_template_items?.length ?? 0
                  return (
                    <label
                      key={tpl.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedTemplate === tpl.id
                          ? "border-navy-500 bg-navy-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="template"
                        value={tpl.id}
                        checked={selectedTemplate === tpl.id}
                        onChange={() => setSelectedTemplate(tpl.id)}
                        className="accent-navy-500"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">{tpl.name}</p>
                        <p className="text-xs text-gray-400">
                          {tpl.body_part && `${tpl.body_part} · `}
                          {count} {count === 1 ? "ćwiczenie" : count < 5 ? "ćwiczenia" : "ćwiczeń"}
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
                <Label htmlFor="ap-dur">Czas trwania</Label>
                <select
                  id="ap-dur"
                  value={durationWeeks}
                  onChange={(e) => setDurationWeeks(e.target.value)}
                  className="w-full h-9 px-3 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="0">Bez ograniczenia</option>
                  {[1, 2, 3, 4, 6, 8, 12, 16, 24].map((w) => (
                    <option key={w} value={String(w)}>
                      {w} {w === 1 ? "tydzień" : w < 5 ? "tygodnie" : "tygodni"}
                      {durationWeeks === String(w) ? ` (koniec ${endLabel(String(w))})` : ""}
                    </option>
                  ))}
                </select>
                {durationWeeks !== "0" && (
                  <p className="text-xs text-gray-400">Koniec: {endLabel(durationWeeks)}</p>
                )}
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
                disabled={loading || !selectedTemplate || !startDate}
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
