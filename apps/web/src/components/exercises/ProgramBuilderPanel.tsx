"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  X, Trash2, Dumbbell, ChevronDown, ChevronUp, Send, FileText, ExternalLink,
  BookOpen, Search, Plus, ClipboardList, ArrowLeft, Save, Printer, Eye,
  UserPlus, Loader2, Pencil,
} from "lucide-react"
import { useProgramBuilder, type BuilderExercise } from "@/store/programBuilder"
import { createTemplate, addExerciseToTemplate, addSurveyToTemplate } from "@/lib/actions/templates"
import { createQuickProgram } from "@/lib/actions/patient-programs"
import { assignSurveyToProgram, getSurveys, type Survey, type SurveySchedule } from "@/lib/actions/surveys"
import { getPatientsList, createPatient } from "@/lib/actions/patients"
import { getEducationalContent } from "@/lib/actions/education"
import { toast } from "sonner"

type Patient = { id: string; first_name: string; last_name: string }
type ContentItem = { id: string; name: string; type: string; file_url: string | null; external_url: string | null; body_part: string | null }

// ── Mini card inside builder ──────────────────────────────────────────────────

function BuilderCard({ item, onPreview }: { item: BuilderExercise; onPreview: (item: BuilderExercise) => void }) {
  const { removeExercise, updateExercise } = useProgramBuilder()
  const [expanded, setExpanded] = useState(false)

  const mediaSrc = item.thumbnailUrl ?? item.animatedGifUrl

  return (
    <div className="relative bg-white rounded-xl border border-gray-200 overflow-hidden group/card">
      {/* Remove button */}
      <button
        onClick={(e) => { e.stopPropagation(); removeExercise(item.itemId) }}
        className="absolute top-2 left-2 z-10 w-6 h-6 bg-white/90 shadow-sm rounded-full flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover/card:opacity-100"
      >
        <X size={12} />
      </button>

      {/* Preview button */}
      <button
        onClick={() => onPreview(item)}
        className="absolute top-2 right-2 z-10 w-6 h-6 bg-white/90 shadow-sm rounded-full flex items-center justify-center text-gray-500 hover:text-navy-600 hover:bg-navy-50 transition-all opacity-0 group-hover/card:opacity-100"
        title="Podgląd"
      >
        <Eye size={11} />
      </button>

      {/* Thumbnail / GIF */}
      <div
        className="w-full aspect-[4/3] bg-gray-100 overflow-hidden cursor-pointer"
        onClick={() => onPreview(item)}
      >
        {mediaSrc ? (
          <img src={mediaSrc} alt={item.name} className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Dumbbell size={20} className="text-gray-300" />
          </div>
        )}
      </div>

      {/* Info row — click to expand params */}
      <div className="p-2 cursor-pointer select-none" onClick={() => setExpanded(!expanded)}>
        <p className="text-xs font-medium text-gray-900 leading-tight line-clamp-2">{item.name}</p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-[11px] text-gray-400 truncate">
            {item.sets} {item.sets === 1 ? "seria" : item.sets < 5 ? "serie" : "serii"}
            {item.reps ? ` · ${item.reps} powt.` : ""}
            {item.durationSeconds ? ` · ${item.durationSeconds}s` : ""}
          </p>
          {expanded
            ? <ChevronUp size={11} className="text-gray-400 shrink-0 ml-1" />
            : <ChevronDown size={11} className="text-gray-400 shrink-0 ml-1" />
          }
        </div>
      </div>

      {/* Expanded params */}
      {expanded && (
        <div className="px-2 pb-2 border-t border-gray-100 pt-2 grid grid-cols-3 gap-1.5">
          <div>
            <p className="text-[10px] text-gray-500 mb-0.5">Serie</p>
            <input
              type="number" min="1" value={item.sets}
              onChange={(e) => updateExercise(item.itemId, { sets: Number(e.target.value) || 1 })}
              className="w-full h-6 px-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-navy-400"
            />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 mb-0.5">Powt.</p>
            <input
              type="number" min="1" value={item.reps ?? ""}
              onChange={(e) => updateExercise(item.itemId, { reps: e.target.value ? Number(e.target.value) : null })}
              className="w-full h-6 px-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-navy-400"
              placeholder="—"
            />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 mb-0.5">Czas (s)</p>
            <input
              type="number" min="1" value={item.durationSeconds ?? ""}
              onChange={(e) => updateExercise(item.itemId, { durationSeconds: e.target.value ? Number(e.target.value) : null })}
              className="w-full h-6 px-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-navy-400"
              placeholder="—"
            />
          </div>
          <div className="col-span-3">
            <p className="text-[10px] text-gray-500 mb-0.5">Notatka dla pacjenta</p>
            <input
              type="text" value={item.notes}
              onChange={(e) => updateExercise(item.itemId, { notes: e.target.value })}
              className="w-full h-6 px-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-navy-400"
              placeholder="np. Wykonuj powoli, trzymaj 3s"
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ── GIF preview modal ─────────────────────────────────────────────────────────

function ExercisePreviewModal({ item, onClose }: { item: BuilderExercise; onClose: () => void }) {
  const isVideo = item.animatedGifUrl?.endsWith(".mp4") || item.animatedGifUrl?.endsWith(".webm")
  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl overflow-hidden w-full max-w-sm shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-black aspect-video">
          {isVideo ? (
            <video
              src={item.animatedGifUrl!}
              className="w-full h-full object-contain"
              autoPlay loop controls playsInline
            />
          ) : item.animatedGifUrl ? (
            <img src={item.animatedGifUrl} alt={item.name} className="w-full h-full object-contain" />
          ) : item.thumbnailUrl ? (
            <img src={item.thumbnailUrl} alt={item.name} className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Dumbbell size={40} className="text-gray-600" />
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
          >
            <X size={15} className="text-white" />
          </button>
        </div>
        <div className="p-4">
          <p className="font-semibold text-gray-900">{item.name}</p>
          <p className="text-sm text-gray-500 mt-1">
            {item.sets} {item.sets === 1 ? "seria" : item.sets < 5 ? "serie" : "serii"}
            {item.reps ? ` · ${item.reps} powt.` : ""}
            {item.durationSeconds ? ` · ${item.durationSeconds}s` : ""}
            {item.notes && <span className="block text-xs text-gray-400 mt-1 italic">"{item.notes}"</span>}
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────

export function ProgramBuilderPanel() {
  const router = useRouter()
  const {
    isOpen, close,
    exercises, contentItems, addContent, removeContent, hasContent,
    surveyItems, addSurvey, removeSurvey, hasSurvey,
    programName, setProgramName, clearAll,
  } = useProgramBuilder()

  const [saving, setSaving] = useState(false)
  const [view, setView] = useState<"editor" | "assign">("editor")
  const [previewItem, setPreviewItem] = useState<BuilderExercise | null>(null)

  // Patients
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState("")
  const [patientSearch, setPatientSearch] = useState("")
  const [patientDropOpen, setPatientDropOpen] = useState(false)

  // New patient inline form
  const [showNewPatient, setShowNewPatient] = useState(false)
  const [newFirst, setNewFirst] = useState("")
  const [newLast, setNewLast] = useState("")
  const [creatingPatient, setCreatingPatient] = useState(false)

  // Date / duration
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0])
  const [durationWeeks, setDurationWeeks] = useState("4")
  const [saveAsTemplate, setSaveAsTemplate] = useState(false)

  // Content picker
  const [allContent, setAllContent] = useState<ContentItem[]>([])
  const [contentPickerOpen, setContentPickerOpen] = useState(false)
  const [contentSearch, setContentSearch] = useState("")

  // Survey picker
  const [allSurveys, setAllSurveys] = useState<Survey[]>([])
  const [surveyPickerOpen, setSurveyPickerOpen] = useState(false)
  const [surveySearch, setSurveySearch] = useState("")
  const [surveySchedules, setSurveySchedules] = useState<Record<string, string>>({})

  // Exercise list in assign view
  const [showExerciseList, setShowExerciseList] = useState(false)

  const filteredContent = useMemo(() => {
    const q = contentSearch.toLowerCase()
    return q ? allContent.filter((c) => c.name.toLowerCase().includes(q) || c.body_part?.toLowerCase().includes(q)) : allContent
  }, [allContent, contentSearch])

  const filteredSurveys = useMemo(() => {
    const q = surveySearch.toLowerCase()
    return q ? allSurveys.filter((s) => s.name.toLowerCase().includes(q)) : allSurveys
  }, [allSurveys, surveySearch])

  const filteredPatients = useMemo(() => {
    const q = patientSearch.toLowerCase()
    return q ? patients.filter((p) => `${p.first_name} ${p.last_name}`.toLowerCase().includes(q)) : patients
  }, [patients, patientSearch])

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
      if (allSurveys.length === 0) getSurveys().then(setAllSurveys)
    }
  }, [isOpen])

  if (!isOpen) return null

  const hasItems = exercises.length > 0 || contentItems.length > 0 || surveyItems.length > 0
  const selectedPatientObj = patients.find((p) => p.id === selectedPatient)

  async function handleAssign() {
    if (!exercises.length || !selectedPatient) return
    setSaving(true)
    try {
      const program = await createQuickProgram({
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
      for (const s of surveyItems) {
        await assignSurveyToProgram(program.id, s.surveyId, s.schedule as SurveySchedule)
      }
      toast.success(`Program wysłany do ${selectedPatientObj?.first_name} ${selectedPatientObj?.last_name}`)
      clearAll()
      close()
      router.push(`/pacjenci/${selectedPatient}`)
    } catch {
      toast.error("Nie udało się przypisać programu")
    } finally {
      setSaving(false)
    }
  }

  function handlePrint() {
    const data = {
      programName,
      exercises: exercises.map((ex) => ({
        exerciseId: ex.exerciseId,
        name: ex.name,
        thumbnailUrl: ex.thumbnailUrl,
        sets: ex.sets,
        reps: ex.reps,
        durationSeconds: ex.durationSeconds,
        notes: ex.notes,
      })),
      contentItems: contentItems.map((c) => ({
        contentId: c.contentId,
        name: c.name,
        type: c.type,
        fileUrl: c.fileUrl,
        externalUrl: c.externalUrl,
      })),
    }
    sessionStorage.setItem("builderPrint", JSON.stringify(data))
    window.open("/drukuj/builder", "_blank")
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
      for (const s of surveyItems) {
        await addSurveyToTemplate(template.id, s.surveyId, s.schedule)
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

  async function handleCreatePatient() {
    if (!newFirst.trim() || !newLast.trim()) return
    setCreatingPatient(true)
    try {
      const patient = await createPatient({ firstName: newFirst.trim(), lastName: newLast.trim() })
      const entry = { id: patient.id, first_name: patient.first_name, last_name: patient.last_name }
      setPatients((prev) => [...prev, entry].sort((a, b) => a.last_name.localeCompare(b.last_name, "pl")))
      setSelectedPatient(patient.id)
      setShowNewPatient(false)
      setNewFirst("")
      setNewLast("")
      toast.success(`Pacjent ${patient.first_name} ${patient.last_name} dodany`)
    } catch {
      toast.error("Nie udało się dodać pacjenta")
    } finally {
      setCreatingPatient(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="bg-gray-50 w-full sm:max-w-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-screen sm:max-h-[90vh]">

          {/* ── EDITOR VIEW ──────────────────────────────────────── */}
          {view === "editor" && (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 bg-white sm:rounded-t-2xl border-b border-gray-200">
                <div className="flex items-center gap-3 min-w-0">
                  <button onClick={close} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors shrink-0">
                    <X size={16} />
                  </button>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <input
                      value={programName}
                      onChange={(e) => setProgramName(e.target.value)}
                      className="font-semibold text-gray-900 bg-transparent focus:outline-none focus:bg-gray-100 focus:px-2 rounded text-sm min-w-0 w-44 transition-all"
                      placeholder="Nazwa programu"
                    />
                    <Pencil size={12} className="text-gray-300 shrink-0" />
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={clearAll}
                    className="h-8 px-3 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Wyczyść
                  </button>
                  <button
                    onClick={handlePrint}
                    disabled={!exercises.length}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                    title="Drukuj / PDF"
                  >
                    <Printer size={13} />
                    PDF
                  </button>
                  <button
                    onClick={handleSaveTemplate}
                    disabled={saving || !exercises.length}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                  >
                    <Save size={13} />
                    Szablon
                  </button>
                  <button
                    onClick={() => setView("assign")}
                    disabled={!hasItems}
                    className="inline-flex items-center gap-1.5 h-8 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white text-xs font-medium transition-colors"
                  >
                    <Send size={13} />
                    Przypisz
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {!hasItems ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Dumbbell size={32} className="text-gray-300 mb-3" />
                    <p className="text-sm text-gray-400">Zaznacz ćwiczenia z biblioteki</p>
                    <p className="text-xs text-gray-300 mt-1">lub kliknij ćwiczenie → "Dodaj do programu"</p>
                  </div>
                ) : (
                  <>
                    {/* Exercise grid */}
                    {exercises.length > 0 && (
                      <div className="grid grid-cols-3 gap-3">
                        {exercises.map((item) => (
                          <BuilderCard key={item.itemId} item={item} onPreview={setPreviewItem} />
                        ))}
                      </div>
                    )}

                    {/* Educational materials */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <BookOpen size={12} className="text-gray-400" />
                          <span className="text-xs font-medium text-gray-500">
                            Materiały edukacyjne {contentItems.length > 0 && `(${contentItems.length})`}
                          </span>
                        </div>
                        <button
                          onClick={() => setContentPickerOpen(!contentPickerOpen)}
                          className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors ${contentPickerOpen ? "bg-navy-100 text-navy-700" : "text-navy-500 hover:bg-navy-50"}`}
                        >
                          <Plus size={11} /> Dodaj materiał
                        </button>
                      </div>

                      {contentItems.length > 0 && (
                        <div className="space-y-1 mb-2">
                          {contentItems.map((c) => (
                            <div key={c.contentId} className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-3 py-2">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${c.type === "pdf" ? "bg-red-50" : "bg-blue-50"}`}>
                                {c.type === "pdf" ? <FileText size={13} className="text-red-500" /> : <ExternalLink size={13} className="text-blue-500" />}
                              </div>
                              <span className="text-xs text-gray-800 flex-1 truncate">{c.name}</span>
                              <button onClick={() => removeContent(c.contentId)} className="p-1 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

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
                                  {selected ? <span className="text-xs text-navy-500 shrink-0">✓</span> : <Plus size={11} className="text-gray-400 shrink-0" />}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Surveys */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <ClipboardList size={12} className="text-gray-400" />
                          <span className="text-xs font-medium text-gray-500">
                            Kwestionariusze {surveyItems.length > 0 && `(${surveyItems.length})`}
                          </span>
                        </div>
                        <button
                          onClick={() => setSurveyPickerOpen(!surveyPickerOpen)}
                          className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors ${surveyPickerOpen ? "bg-navy-100 text-navy-700" : "text-navy-500 hover:bg-navy-50"}`}
                        >
                          <Plus size={11} /> Dodaj kwestionariusz
                        </button>
                      </div>

                      {surveyItems.length > 0 && (
                        <div className="space-y-1 mb-2">
                          {surveyItems.map((s) => {
                            const scheduleLabel = s.schedule === "on_start" ? "Na start" : s.schedule === "on_end" ? "Na koniec" : s.schedule === "weekly" ? "Co tydzień" : s.schedule
                            return (
                              <div key={s.surveyId} className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-3 py-2">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-purple-50">
                                  <ClipboardList size={13} className="text-purple-500" />
                                </div>
                                <span className="text-xs text-gray-800 flex-1 truncate">{s.name}</span>
                                <span className="text-xs text-gray-400 shrink-0">{scheduleLabel}</span>
                                <button onClick={() => removeSurvey(s.surveyId)} className="p-1 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {surveyPickerOpen && (
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                          <div className="p-2 border-b border-gray-100">
                            <div className="relative">
                              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                              <input
                                value={surveySearch}
                                onChange={(e) => setSurveySearch(e.target.value)}
                                placeholder="Szukaj kwestionariuszy..."
                                className="w-full h-7 pl-7 pr-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-400"
                                autoFocus
                              />
                            </div>
                          </div>
                          <div className="max-h-48 overflow-y-auto">
                            {filteredSurveys.length === 0 ? (
                              <p className="text-xs text-gray-400 text-center py-4">Brak wyników</p>
                            ) : filteredSurveys.map((s) => {
                              const selected = hasSurvey(s.id)
                              return (
                                <div key={s.id} className={`flex items-center gap-2.5 px-3 py-2 border-b border-gray-50 last:border-0 ${selected ? "bg-navy-50" : ""}`}>
                                  <div className="w-6 h-6 rounded flex items-center justify-center shrink-0 bg-purple-50">
                                    <ClipboardList size={11} className="text-purple-500" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span className="text-xs text-gray-800 truncate block">{s.name}</span>
                                    {s.question_count !== undefined && (
                                      <span className="text-xs text-gray-400">{s.question_count} {s.question_count === 1 ? "pytanie" : s.question_count < 5 ? "pytania" : "pytań"}</span>
                                    )}
                                  </div>
                                  {selected ? (
                                    <span className="text-xs text-navy-500 shrink-0">✓</span>
                                  ) : (
                                    <div className="flex items-center gap-1 shrink-0">
                                      <select
                                        value={surveySchedules[s.id] ?? "on_start"}
                                        onChange={(e) => setSurveySchedules((prev) => ({ ...prev, [s.id]: e.target.value }))}
                                        className="h-6 text-xs border border-gray-200 rounded px-1 bg-white focus:outline-none"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <option value="on_start">Na start programu</option>
                                        <option value="on_end">Na koniec programu</option>
                                        <option value="weekly">Co tydzień</option>
                                      </select>
                                      <button
                                        onClick={() => addSurvey({ surveyId: s.id, name: s.name, schedule: surveySchedules[s.id] ?? "on_start" })}
                                        className="h-6 px-2 text-xs bg-navy-500 hover:bg-navy-600 text-white rounded transition-colors"
                                      >
                                        Dodaj
                                      </button>
                                    </div>
                                  )}
                                </div>
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
              {hasItems && (
                <div className="px-5 py-3 bg-white sm:rounded-b-2xl border-t border-gray-200 flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    {exercises.length} {exercises.length === 1 ? "ćwiczenie" : exercises.length < 5 ? "ćwiczenia" : "ćwiczeń"}
                    {contentItems.length > 0 && ` · ${contentItems.length} materiałów`}
                    {surveyItems.length > 0 && ` · ${surveyItems.length} kwestionariuszy`}
                  </p>
                  <button
                    onClick={() => setView("assign")}
                    className="inline-flex items-center gap-1.5 h-8 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium transition-colors sm:hidden"
                  >
                    <Send size={13} />
                    Przypisz
                  </button>
                </div>
              )}
            </>
          )}

          {/* ── ASSIGN VIEW ──────────────────────────────────────── */}
          {view === "assign" && (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-3.5 bg-white sm:rounded-t-2xl border-b border-gray-200">
                <button
                  onClick={() => setView("editor")}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors shrink-0"
                >
                  <ArrowLeft size={16} />
                </button>
                <h2 className="text-sm font-semibold text-gray-900">Przypisz program pacjentowi</h2>
              </div>

              {/* Form */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">

                {/* Program name — editable before sending */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Nazwa programu</label>
                  <input
                    value={programName}
                    onChange={(e) => setProgramName(e.target.value)}
                    placeholder="Nazwa programu"
                    className="w-full h-10 px-3 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400"
                  />
                </div>

                {/* Patient picker */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Wybierz pacjenta</label>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      value={patientSearch}
                      onChange={(e) => { setPatientSearch(e.target.value); setPatientDropOpen(true) }}
                      onFocus={() => setPatientDropOpen(true)}
                      placeholder={selectedPatientObj ? `${selectedPatientObj.first_name} ${selectedPatientObj.last_name}` : "Szukaj pacjenta..."}
                      className="w-full h-10 pl-9 pr-3 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400"
                    />
                    {selectedPatientObj && !patientDropOpen && (
                      <button
                        onClick={() => { setSelectedPatient(""); setPatientSearch(""); setPatientDropOpen(true) }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Dropdown */}
                  {patientDropOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => { setPatientDropOpen(false); if (!selectedPatient) setPatientSearch("") }} />
                      <div className="relative z-20">
                        <div className="bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto -mt-1">
                          {filteredPatients.length === 0 ? (
                            <p className="px-4 py-3 text-sm text-gray-400">Brak wyników</p>
                          ) : filteredPatients.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onMouseDown={() => { setSelectedPatient(p.id); setPatientSearch(""); setPatientDropOpen(false) }}
                              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-teal-50 transition-colors ${selectedPatient === p.id ? "bg-teal-50 text-teal-700 font-medium" : "text-gray-700"}`}
                            >
                              {p.first_name} {p.last_name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Add new patient */}
                  {!showNewPatient ? (
                    <button
                      onClick={() => setShowNewPatient(true)}
                      className="flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 hover:underline mt-1 transition-colors"
                    >
                      <UserPlus size={12} />
                      Dodaj nowego pacjenta
                    </button>
                  ) : (
                    <div className="mt-2 p-3 rounded-xl border border-teal-200 bg-teal-50/40 space-y-2">
                      <p className="text-xs font-medium text-gray-700">Nowy pacjent</p>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          value={newFirst}
                          onChange={(e) => setNewFirst(e.target.value)}
                          placeholder="Imię *"
                          className="h-9 px-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-teal-400"
                          autoFocus
                        />
                        <input
                          value={newLast}
                          onChange={(e) => setNewLast(e.target.value)}
                          placeholder="Nazwisko *"
                          onKeyDown={(e) => e.key === "Enter" && handleCreatePatient()}
                          className="h-9 px-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-teal-400"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setShowNewPatient(false); setNewFirst(""); setNewLast("") }}
                          className="flex-1 h-8 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Anuluj
                        </button>
                        <button
                          onClick={handleCreatePatient}
                          disabled={!newFirst.trim() || !newLast.trim() || creatingPatient}
                          className="flex-1 h-8 text-xs bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                        >
                          {creatingPatient ? <Loader2 size={11} className="animate-spin" /> : <UserPlus size={11} />}
                          Utwórz i wybierz
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Date + duration */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Data rozpoczęcia</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full h-10 px-3 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Czas trwania</label>
                    <select
                      value={durationWeeks}
                      onChange={(e) => setDurationWeeks(e.target.value)}
                      className="w-full h-10 px-3 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400"
                    >
                      <option value="0">Bez ograniczenia</option>
                      {[1, 2, 3, 4, 6, 8, 12, 16, 24].map((w) => (
                        <option key={w} value={String(w)}>
                          {w} {w === 1 ? "tydzień" : w < 5 ? "tygodnie" : "tygodni"}
                        </option>
                      ))}
                    </select>
                    {durationWeeks !== "0" && (
                      <p className="text-xs text-gray-400">Koniec: {endDateLabel(startDate, durationWeeks)}</p>
                    )}
                  </div>
                </div>

                {/* Summary with exercise list */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setShowExerciseList(!showExerciseList)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="text-xs font-medium text-gray-500">Program zawiera</p>
                      <p className="text-sm text-gray-700 mt-0.5">
                        {exercises.length} {exercises.length === 1 ? "ćwiczenie" : exercises.length < 5 ? "ćwiczenia" : "ćwiczeń"}
                        {contentItems.length > 0 && ` · ${contentItems.length} materiałów`}
                        {surveyItems.length > 0 && ` · ${surveyItems.length} kwestionariuszy`}
                      </p>
                    </div>
                    {exercises.length > 0 && (
                      showExerciseList
                        ? <ChevronUp size={14} className="text-gray-400 shrink-0" />
                        : <ChevronDown size={14} className="text-gray-400 shrink-0" />
                    )}
                  </button>

                  {showExerciseList && exercises.length > 0 && (
                    <div className="border-t border-gray-100 divide-y divide-gray-50 max-h-48 overflow-y-auto">
                      {exercises.map((ex, i) => {
                        const mediaSrc = ex.thumbnailUrl ?? ex.animatedGifUrl
                        return (
                          <div key={ex.itemId} className="flex items-center gap-2.5 px-4 py-2">
                            <span className="text-xs text-gray-400 w-4 shrink-0">{i + 1}.</span>
                            {mediaSrc ? (
                              <img src={mediaSrc} alt={ex.name} className="w-8 h-8 rounded object-contain bg-gray-50 shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded bg-gray-100 shrink-0 flex items-center justify-center">
                                <Dumbbell size={12} className="text-gray-300" />
                              </div>
                            )}
                            <span className="text-xs text-gray-800 flex-1 truncate">{ex.name}</span>
                            <span className="text-xs text-gray-400 shrink-0">
                              {ex.sets}×{ex.reps ? ex.reps : ex.durationSeconds ? `${ex.durationSeconds}s` : "—"}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Save as template */}
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={saveAsTemplate}
                    onChange={(e) => setSaveAsTemplate(e.target.checked)}
                    className="w-4 h-4 accent-teal-600"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">Zapisz jako szablon</span>
                </label>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 bg-white sm:rounded-b-2xl border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  onClick={() => setView("editor")}
                  className="h-9 px-4 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Wróć
                </button>
                <button
                  onClick={handleAssign}
                  disabled={saving || !selectedPatient || exercises.length === 0}
                  className="inline-flex items-center gap-1.5 h-9 px-5 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
                >
                  {saving ? <><Loader2 size={14} className="animate-spin" /> Wysyłam...</> : <><Send size={14} /> Wyślij</>}
                </button>
              </div>
            </>
          )}

        </div>
      </div>

      {/* GIF preview modal — above the builder panel */}
      {previewItem && (
        <ExercisePreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />
      )}
    </>
  )
}
