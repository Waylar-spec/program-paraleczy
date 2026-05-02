"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { X, Trash2, Dumbbell, ChevronDown, ChevronUp, Send, FileText, ExternalLink, BookOpen, Search, Plus } from "lucide-react"
import { useProgramBuilder, type BuilderExercise } from "@/store/programBuilder"
import { createTemplate, addExerciseToTemplate } from "@/lib/actions/templates"
import { createQuickProgram } from "@/lib/actions/patient-programs"
import { getPatientsList } from "@/lib/actions/patients"
import { getEducationalContent } from "@/lib/actions/education"
import { toast } from "sonner"

type Patient = { id: string; first_name: string; last_name: string }
type ContentItem = { id: string; name: string; type: string; file_url: string | null; external_url: string | null; body_part: string | null }

function ExerciseItem({ item }: { item: BuilderExercise }) {
  const { removeExercise, updateExercise } = useProgramBuilder()
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        <div className="w-16 h-12 rounded-lg bg-gray-100 shrink-0 overflow-hidden flex items-center justify-center">
          {item.thumbnailUrl ? (
            <img src={item.thumbnailUrl} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <Dumbbell size={18} className="text-gray-300" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {item.sets} {item.sets === 1 ? "seria" : item.sets < 5 ? "serie" : "serii"}
            {item.reps && ` · ${item.reps} powt.`}
            {item.durationSeconds && ` · ${item.durationSeconds}s`}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            onClick={() => removeExercise(item.itemId)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-gray-50 grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Serie</label>
            <input
              type="number" min="1" value={item.sets}
              onChange={(e) => updateExercise(item.itemId, { sets: Number(e.target.value) || 1 })}
              className="w-full h-7 px-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-navy-400"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Powtórzenia</label>
            <input
              type="number" min="1" value={item.reps ?? ""}
              onChange={(e) => updateExercise(item.itemId, { reps: e.target.value ? Number(e.target.value) : null })}
              className="w-full h-7 px-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-navy-400"
              placeholder="—"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Czas (s)</label>
            <input
              type="number" min="1" value={item.durationSeconds ?? ""}
              onChange={(e) => updateExercise(item.itemId, { durationSeconds: e.target.value ? Number(e.target.value) : null })}
              className="w-full h-7 px-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-navy-400"
              placeholder="—"
            />
          </div>
          <div className="col-span-3 space-y-1">
            <label className="text-xs text-gray-500">Notatka dla pacjenta</label>
            <input
              type="text" value={item.notes}
              onChange={(e) => updateExercise(item.itemId, { notes: e.target.value })}
              className="w-full h-7 px-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-navy-400"
              placeholder="np. Wykonuj powoli, trzymaj 3 sekundy"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export function ProgramBuilderPanel() {
  const router = useRouter()
  const { isOpen, close, exercises, contentItems, addContent, removeContent, hasContent, programName, setProgramName, clearAll } = useProgramBuilder()
  const [saving, setSaving] = useState(false)
  const [saveAsTemplate, setSaveAsTemplate] = useState(false)
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState("")
  const [patientSearch, setPatientSearch] = useState("")
  const [patientDropOpen, setPatientDropOpen] = useState(false)
  const patientRef = useRef<HTMLDivElement>(null)
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0])
  const [durationWeeks, setDurationWeeks] = useState<string>("4")
  const [mode, setMode] = useState<"assign" | "template">("assign")
  const [allContent, setAllContent] = useState<ContentItem[]>([])
  const [contentPickerOpen, setContentPickerOpen] = useState(false)
  const [contentSearch, setContentSearch] = useState("")

  const filteredContent = useMemo(() => {
    if (!contentSearch.trim()) return allContent
    const q = contentSearch.toLowerCase()
    return allContent.filter((c) => c.name.toLowerCase().includes(q) || c.body_part?.toLowerCase().includes(q))
  }, [allContent, contentSearch])

  function calcEndDate(start: string, weeks: string): string | undefined {
    if (!weeks || weeks === "0") return undefined
    const d = new Date(start)
    d.setDate(d.getDate() + Number(weeks) * 7)
    return d.toISOString().split("T")[0]
  }

  function endDateLabel(start: string, weeks: string): string {
    const end = calcEndDate(start, weeks)
    if (!end) return ""
    return new Date(end).toLocaleDateString("pl-PL", { day: "numeric", month: "short" })
  }

  useEffect(() => {
    if (isOpen) {
      if (patients.length === 0) getPatientsList().then(setPatients)
      if (allContent.length === 0) getEducationalContent().then((data) => setAllContent(data as ContentItem[]))
    }
  }, [isOpen])

  if (!isOpen) return null

  async function handleAssign() {
    if (!exercises.length || !selectedPatient) return
    setSaving(true)
    try {
      await createQuickProgram({
        patientId: selectedPatient,
        name: programName,
        startDate,
        endDate: calcEndDate(startDate, durationWeeks),
        saveAsTemplate,
        contentIds: contentItems.map((c) => c.contentId),
        exercises: exercises.map((ex, i) => ({
          exerciseId: ex.exerciseId,
          order: i + 1,
          sets: ex.sets,
          reps: ex.reps,
          durationSeconds: ex.durationSeconds,
          notes: ex.notes,
        })),
      })
      const pat = patients.find((p) => p.id === selectedPatient)
      toast.success(`Program wysłany do ${pat?.first_name} ${pat?.last_name}`)
      clearAll()
      close()
      router.push(`/pacjenci/${selectedPatient}`)
    } catch {
      toast.error("Nie udało się przypisać programu")
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveTemplate() {
    if (!exercises.length) return
    setSaving(true)
    try {
      const template = await createTemplate({ name: programName })
      for (let i = 0; i < exercises.length; i++) {
        const ex = exercises[i]
        await addExerciseToTemplate(template.id, ex.exerciseId, {
          order: i + 1,
          sets: ex.sets,
          reps: ex.reps ?? undefined,
          duration: ex.durationSeconds ?? undefined,
          notes: ex.notes || undefined,
        })
      }
      toast.success(`Szablon "${programName}" zapisany`)
      clearAll()
      close()
      router.push(`/biblioteka/szablony/${template.id}`)
    } catch {
      toast.error("Nie udało się zapisać szablonu")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-gray-50 w-full sm:max-w-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-screen sm:max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-white sm:rounded-t-2xl border-b border-gray-200">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={close} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors shrink-0">
              <X size={16} />
            </button>
            <input
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              className="font-semibold text-gray-900 bg-transparent focus:outline-none min-w-0 text-sm w-48"
              placeholder="Nazwa programu"
            />
          </div>
          <button
            onClick={clearAll}
            className="h-8 px-3 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors shrink-0"
          >
            Wyczyść
          </button>
        </div>

        {/* Mode tabs */}
        <div className="flex bg-white border-b border-gray-200 px-5">
          <button
            onClick={() => setMode("assign")}
            className={`py-2.5 px-1 mr-6 text-xs font-medium border-b-2 transition-colors ${
              mode === "assign" ? "border-navy-500 text-navy-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Wyślij do pacjenta
          </button>
          <button
            onClick={() => setMode("template")}
            className={`py-2.5 px-1 text-xs font-medium border-b-2 transition-colors ${
              mode === "template" ? "border-navy-500 text-navy-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Zapisz jako szablon
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {exercises.length === 0 && contentItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Dumbbell size={32} className="text-gray-300 mb-3" />
              <p className="text-sm text-gray-400">Zaznacz ćwiczenia z biblioteki</p>
              <p className="text-xs text-gray-300 mt-1">lub kliknij ćwiczenie → "Dodaj do programu"</p>
            </div>
          ) : (
            <>
              {exercises.map((item) => <ExerciseItem key={item.itemId} item={item} />)}

              {/* Educational materials section */}
              <div className="mt-1">
                <div className="flex items-center justify-between px-1 mb-1">
                  <div className="flex items-center gap-2">
                    <BookOpen size={12} className="text-gray-400" />
                    <span className="text-xs font-medium text-gray-500">
                      Materiały edukacyjne {contentItems.length > 0 && `(${contentItems.length})`}
                    </span>
                  </div>
                  <button
                    onClick={() => setContentPickerOpen(!contentPickerOpen)}
                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors ${
                      contentPickerOpen ? "bg-navy-100 text-navy-700" : "text-navy-500 hover:bg-navy-50"
                    }`}
                  >
                    <Plus size={11} />
                    Dodaj materiał
                  </button>
                </div>

                {/* Selected items */}
                {contentItems.length > 0 && (
                  <div className="space-y-1 mb-2">
                    {contentItems.map((c) => (
                      <div key={c.contentId} className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-3 py-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${c.type === "pdf" ? "bg-red-50" : "bg-blue-50"}`}>
                          {c.type === "pdf" ? <FileText size={13} className="text-red-500" /> : <ExternalLink size={13} className="text-blue-500" />}
                        </div>
                        <span className="text-xs text-gray-800 flex-1 truncate">{c.name}</span>
                        <button onClick={() => removeContent(c.contentId)} className="p-1 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors shrink-0">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Inline picker */}
                {contentPickerOpen && (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="p-2 border-b border-gray-100">
                      <div className="relative">
                        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          value={contentSearch}
                          onChange={(e) => setContentSearch(e.target.value)}
                          placeholder="Szukaj materiałów..."
                          className="w-full h-7 pl-7 pr-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-400"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredContent.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-4">Brak wyników</p>
                      ) : filteredContent.map((c) => {
                        const selected = hasContent(c.id)
                        return (
                          <button
                            key={c.id}
                            onClick={() => selected ? removeContent(c.id) : addContent({ contentId: c.id, name: c.name, type: c.type, fileUrl: c.file_url, externalUrl: c.external_url })}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-left border-b border-gray-50 last:border-0 transition-colors ${selected ? "bg-navy-50" : "hover:bg-gray-50"}`}
                          >
                            <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${c.type === "pdf" ? "bg-red-50" : "bg-blue-50"}`}>
                              {c.type === "pdf" ? <FileText size={11} className="text-red-500" /> : <ExternalLink size={11} className="text-blue-500" />}
                            </div>
                            <span className="text-xs text-gray-800 flex-1 truncate">{c.name}</span>
                            {selected
                              ? <span className="text-xs text-navy-500 shrink-0">✓</span>
                              : <Plus size={11} className="text-gray-400 shrink-0" />
                            }
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {(exercises.length > 0 || contentItems.length > 0) && (
          <div className="px-5 py-4 bg-white sm:rounded-b-2xl border-t border-gray-200">
            {mode === "assign" ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  {/* Patient combobox */}
                  <div className="relative flex-1" ref={patientRef}>
                    <div
                      className="flex items-center h-9 px-3 text-sm border border-gray-200 rounded-lg bg-white cursor-text focus-within:ring-1 focus-within:ring-navy-400"
                      onClick={() => { setPatientDropOpen(true) }}
                    >
                      {selectedPatient && !patientDropOpen ? (
                        <span className="flex-1 truncate text-gray-900">
                          {patients.find(p => p.id === selectedPatient)
                            ? `${patients.find(p => p.id === selectedPatient)!.first_name} ${patients.find(p => p.id === selectedPatient)!.last_name}`
                            : ""}
                        </span>
                      ) : (
                        <input
                          autoFocus={patientDropOpen}
                          value={patientSearch}
                          onChange={e => { setPatientSearch(e.target.value); setPatientDropOpen(true) }}
                          onFocus={() => setPatientDropOpen(true)}
                          placeholder={selectedPatient ? patients.find(p => p.id === selectedPatient) ? `${patients.find(p => p.id === selectedPatient)!.first_name} ${patients.find(p => p.id === selectedPatient)!.last_name}` : "Szukaj pacjenta..." : "Szukaj pacjenta..."}
                          className="flex-1 bg-transparent outline-none text-gray-900 placeholder:text-gray-400"
                        />
                      )}
                    </div>
                    {patientDropOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => { setPatientDropOpen(false); setPatientSearch("") }} />
                        <div className="absolute z-20 top-10 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                          {patients
                            .filter(p => {
                              const q = patientSearch.toLowerCase()
                              return !q || `${p.first_name} ${p.last_name}`.toLowerCase().includes(q)
                            })
                            .map(p => (
                              <button
                                key={p.id}
                                type="button"
                                onMouseDown={() => {
                                  setSelectedPatient(p.id)
                                  setPatientDropOpen(false)
                                  setPatientSearch("")
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-navy-50 transition-colors ${selectedPatient === p.id ? "bg-navy-50 text-navy-700 font-medium" : "text-gray-700"}`}
                              >
                                {p.first_name} {p.last_name}
                              </button>
                            ))}
                          {patients.filter(p => {
                            const q = patientSearch.toLowerCase()
                            return !q || `${p.first_name} ${p.last_name}`.toLowerCase().includes(q)
                          }).length === 0 && (
                            <p className="px-3 py-2 text-sm text-gray-400">Brak wyników</p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-400"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={durationWeeks}
                    onChange={(e) => setDurationWeeks(e.target.value)}
                    className="flex-1 h-9 px-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-navy-400"
                  >
                    <option value="0">Bez ograniczenia czasu</option>
                    <option value="1">1 tydzień{durationWeeks === "1" ? ` (koniec ${endDateLabel(startDate, "1")})` : ""}</option>
                    <option value="2">2 tygodnie{durationWeeks === "2" ? ` (koniec ${endDateLabel(startDate, "2")})` : ""}</option>
                    <option value="3">3 tygodnie{durationWeeks === "3" ? ` (koniec ${endDateLabel(startDate, "3")})` : ""}</option>
                    <option value="4">4 tygodnie{durationWeeks === "4" ? ` (koniec ${endDateLabel(startDate, "4")})` : ""}</option>
                    <option value="6">6 tygodni{durationWeeks === "6" ? ` (koniec ${endDateLabel(startDate, "6")})` : ""}</option>
                    <option value="8">8 tygodni{durationWeeks === "8" ? ` (koniec ${endDateLabel(startDate, "8")})` : ""}</option>
                    <option value="12">12 tygodni{durationWeeks === "12" ? ` (koniec ${endDateLabel(startDate, "12")})` : ""}</option>
                    <option value="16">16 tygodni{durationWeeks === "16" ? ` (koniec ${endDateLabel(startDate, "16")})` : ""}</option>
                    <option value="24">24 tygodnie{durationWeeks === "24" ? ` (koniec ${endDateLabel(startDate, "24")})` : ""}</option>
                  </select>
                  <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer whitespace-nowrap shrink-0">
                    <input
                      type="checkbox"
                      checked={saveAsTemplate}
                      onChange={(e) => setSaveAsTemplate(e.target.checked)}
                      className="accent-navy-500"
                    />
                    Zapisz szablon
                  </label>
                  <button
                    onClick={handleAssign}
                    disabled={saving || !selectedPatient || exercises.length === 0}
                    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-navy-500 hover:bg-navy-600 disabled:opacity-50 text-white text-xs font-medium transition-colors shrink-0"
                  >
                    <Send size={13} />
                    {saving ? "Wysyłam..." : "Wyślij"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  {exercises.length} {exercises.length === 1 ? "ćwiczenie" : exercises.length < 5 ? "ćwiczenia" : "ćwiczeń"}
                  {contentItems.length > 0 && ` · ${contentItems.length} materiałów`}
                </p>
                <button
                  onClick={handleSaveTemplate}
                  disabled={saving || exercises.length === 0}
                  className="h-9 px-4 rounded-lg bg-navy-500 hover:bg-navy-600 disabled:opacity-50 text-white text-xs font-medium transition-colors"
                >
                  {saving ? "Zapisuję..." : "Zapisz szablon"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
