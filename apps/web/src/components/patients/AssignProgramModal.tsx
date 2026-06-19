"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, ChevronDown, ChevronUp, Dumbbell, Pencil } from "lucide-react"
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

type ExerciseItem = {
  id: string
  name: string
  body_part: string | null
  thumbnail_url: string | null
  animated_gif_url?: string | null
}

type TemplateItem = {
  id: string
  order: number | null
  sets: number | null
  reps: number | null
  duration_seconds: number | null
  exercises: ExerciseItem | ExerciseItem[] | null
}

type Template = {
  id: string
  name: string
  description?: string | null
  body_part: string | null
  program_template_items: TemplateItem[]
}

interface Props {
  patientId: string
  templates: Template[]
}

function getExercise(item: TemplateItem): ExerciseItem | null {
  if (!item.exercises) return null
  return Array.isArray(item.exercises) ? item.exercises[0] ?? null : item.exercises
}

function sortItems(items: TemplateItem[]): TemplateItem[] {
  return [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

export function AssignProgramModal({ patientId, templates }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [programName, setProgramName] = useState("")
  const [editingName, setEditingName] = useState(false)
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0])
  const [durationWeeks, setDurationWeeks] = useState("4")
  const [search, setSearch] = useState("")
  const [bodyPart, setBodyPart] = useState<string | null>(null)

  const bodyParts = useMemo(() => {
    const parts = templates.map((t) => t.body_part).filter(Boolean) as string[]
    return Array.from(new Set(parts)).sort((a, b) => a.localeCompare(b, "pl"))
  }, [templates])

  const filteredTemplates = useMemo(() => {
    const q = search.trim().toLowerCase()
    return templates.filter((t) => {
      const matchSearch = !q || t.name.toLowerCase().includes(q) || (t.body_part ?? "").toLowerCase().includes(q)
      const matchPart = !bodyPart || t.body_part === bodyPart
      return matchSearch && matchPart
    })
  }, [templates, search, bodyPart])

  // Auto-fill program name when template is selected
  useEffect(() => {
    const tpl = templates.find(t => t.id === selectedTemplate)
    if (tpl && !editingName) setProgramName(tpl.name)
  }, [selectedTemplate, templates, editingName])

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

  function handleSelectTemplate(id: string) {
    setSelectedTemplate(id)
    setEditingName(false)
  }

  function handleClose() {
    setOpen(false)
    setSelectedTemplate("")
    setProgramName("")
    setEditingName(false)
    setDurationWeeks("4")
    setSearch("")
    setBodyPart(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedTemplate || !startDate) return
    setLoading(true)
    try {
      await assignTemplateToPatient(patientId, selectedTemplate, {
        startDate,
        endDate: calcEndDate(durationWeeks),
        name: programName || undefined,
      })
      toast.success(`Program "${programName}" został przypisany`)
      handleClose()
      router.refresh()
    } catch {
      toast.error("Nie udało się przypisać programu")
    } finally {
      setLoading(false)
    }
  }

  const selectedTpl = templates.find(t => t.id === selectedTemplate)

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true) }}>
      <DialogTrigger className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-navy-500 hover:bg-navy-600 text-white text-sm font-medium transition-colors">
        <Plus size={15} />
        Przypisz program
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
          <DialogTitle>Przypisz program</DialogTitle>
        </DialogHeader>

        {templates.length === 0 ? (
          <div className="py-10 px-6 text-center text-sm text-gray-500">
            Brak szablonów programów.{" "}
            <a href="/biblioteka/szablony" className="text-navy-500 hover:underline">
              Utwórz pierwszy szablon
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">

              {/* Template picker */}
              <div className="space-y-2">
                <Label>Szablon programu *</Label>
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Szukaj szablonu..."
                    className="w-full h-9 pl-8 pr-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-400 bg-white"
                  />
                </div>

                {bodyParts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setBodyPart(null)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        bodyPart === null ? "bg-navy-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
                          bodyPart === part ? "bg-navy-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {part}
                      </button>
                    ))}
                  </div>
                )}

                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-0.5">
                  {filteredTemplates.length === 0 && (
                    <p className="text-sm text-gray-400 py-2 text-center">Brak wyników</p>
                  )}
                  {filteredTemplates.map((tpl) => {
                    const isSelected = selectedTemplate === tpl.id
                    const count = tpl.program_template_items?.length ?? 0
                    const items = sortItems(tpl.program_template_items ?? [])

                    return (
                      <div
                        key={tpl.id}
                        onClick={() => handleSelectTemplate(tpl.id)}
                        className={`rounded-xl border cursor-pointer transition-all overflow-hidden ${
                          isSelected
                            ? "border-navy-400 ring-1 ring-navy-200 bg-navy-50/30"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        {/* Template header row */}
                        <div className="flex items-center gap-3 p-3">
                          <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                            isSelected ? "border-navy-500" : "border-gray-300"
                          }`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-navy-500" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 leading-tight">{tpl.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {tpl.body_part && `${tpl.body_part} · `}
                              {count} {count === 1 ? "ćwiczenie" : count < 5 ? "ćwiczenia" : "ćwiczeń"}
                            </p>
                          </div>
                          {/* Mini thumbnail strip */}
                          {items.length > 0 && !isSelected && (
                            <div className="flex gap-0.5 shrink-0">
                              {items.slice(0, 3).map((item) => {
                                const ex = getExercise(item)
                                const src = ex?.thumbnail_url ?? ex?.animated_gif_url
                                return (
                                  <div key={item.id} className="w-7 h-7 rounded bg-gray-100 overflow-hidden">
                                    {src
                                      ? <img src={src} alt="" className="w-full h-full object-cover" />
                                      : <Dumbbell size={10} className="text-gray-300 m-auto mt-1.5" />
                                    }
                                  </div>
                                )
                              })}
                              {count > 3 && (
                                <div className="w-7 h-7 rounded bg-gray-200 flex items-center justify-center">
                                  <span className="text-[9px] font-medium text-gray-500">+{count - 3}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Exercise preview — visible when selected */}
                        {isSelected && items.length > 0 && (
                          <div className="border-t border-navy-100 px-3 py-2 space-y-1 bg-white/60">
                            {items.map((item, i) => {
                              const ex = getExercise(item)
                              if (!ex) return null
                              const src = ex.thumbnail_url ?? ex.animated_gif_url
                              const params = [
                                item.sets && `${item.sets}×`,
                                item.reps && `${item.reps} powt.`,
                                item.duration_seconds && `${item.duration_seconds}s`,
                              ].filter(Boolean).join("")
                              return (
                                <div key={item.id} className="flex items-center gap-2">
                                  <span className="text-[10px] text-gray-400 w-4 shrink-0">{i + 1}.</span>
                                  <div className="w-8 h-8 rounded overflow-hidden bg-gray-100 shrink-0">
                                    {src
                                      ? <img src={src} alt={ex.name} className="w-full h-full object-contain" />
                                      : <Dumbbell size={12} className="text-gray-300 m-auto mt-2" />
                                    }
                                  </div>
                                  <span className="text-xs text-gray-800 flex-1 truncate">{ex.name}</span>
                                  {params && <span className="text-[10px] text-gray-400 shrink-0">{params}</span>}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Program name — editable, shown after selecting a template */}
              {selectedTemplate && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ap-name">Nazwa programu</Label>
                    {!editingName && (
                      <button
                        type="button"
                        onClick={() => setEditingName(true)}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-navy-600 transition-colors"
                      >
                        <Pencil size={11} /> Zmień
                      </button>
                    )}
                  </div>
                  {editingName ? (
                    <Input
                      id="ap-name"
                      value={programName}
                      onChange={(e) => setProgramName(e.target.value)}
                      placeholder="Nazwa programu dla pacjenta"
                      autoFocus
                    />
                  ) : (
                    <div
                      onClick={() => setEditingName(true)}
                      className="h-9 px-3 flex items-center text-sm text-gray-700 border border-gray-200 rounded-md bg-gray-50 cursor-text hover:border-navy-300 transition-colors"
                    >
                      {programName || <span className="text-gray-400">Kliknij aby zmienić...</span>}
                    </div>
                  )}
                </div>
              )}

              {/* Date + duration */}
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
                      </option>
                    ))}
                  </select>
                  {durationWeeks !== "0" && (
                    <p className="text-xs text-gray-400">Koniec: {endLabel(durationWeeks)}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-white shrink-0">
              <button
                type="button"
                onClick={handleClose}
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
