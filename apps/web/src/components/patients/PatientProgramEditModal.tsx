"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  X, Trash2, Plus, Search, Dumbbell, Loader2, AlertCircle,
  BookOpen, FileText, ExternalLink, Pencil, Check,
} from "lucide-react"
import {
  getPatientProgramWithItems,
  addExerciseToPatientProgram,
  removePatientProgramItem,
  updatePatientProgramItem,
  updatePatientProgramName,
  endPatientProgram,
  addContentToPatientProgram,
  removeContentFromPatientProgram,
} from "@/lib/actions/patient-programs"
import { getExercises } from "@/lib/actions/exercises"
import { getEducationalContent } from "@/lib/actions/education"
import { toast } from "sonner"

type ProgramItem = {
  id: string
  order: number
  sets: number | null
  reps: number | null
  duration_seconds: number | null
  notes: string | null
  exercises: {
    id: string
    name: string
    thumbnail_url: string | null
    body_part: string | null
  } | {
    id: string
    name: string
    thumbnail_url: string | null
    body_part: string | null
  }[] | null
}

type ContentItem = {
  id: string
  name: string
  type: string
  file_url: string | null
  external_url: string | null
}

type ProgramContent = {
  id: string
  order: number
  content_id: string
  educational_content: ContentItem | ContentItem[] | null
}

type Exercise = {
  id: string
  name: string
  thumbnail_url: string | null
  body_part: string | null
  default_sets: number | null
  default_reps: number | null
  default_duration_seconds: number | null
}

interface Props {
  programId: string
  programName: string
  patientId: string
  onClose: () => void
}

export function PatientProgramEditModal({ programId, programName, patientId, onClose }: Props) {
  const router = useRouter()
  const [items, setItems] = useState<ProgramItem[]>([])
  const [programContent, setProgramContent] = useState<ProgramContent[]>([])
  const [allContent, setAllContent] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [searchResults, setSearchResults] = useState<Exercise[]>([])
  const [searching, setSearching] = useState(false)
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [ending, setEnding] = useState(false)
  const [contentPickerOpen, setContentPickerOpen] = useState(false)
  const [contentSearch, setContentSearch] = useState("")
  const [addingContent, setAddingContent] = useState<string | null>(null)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Name editing ──────────────────────────────────────────────────────────
  const [displayName, setDisplayName] = useState(programName)
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(programName)
  const [savingName, setSavingName] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  // ── Item editing ──────────────────────────────────────────────────────────
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState({ sets: "", reps: "", duration: "", notes: "" })
  const [savingItem, setSavingItem] = useState(false)

  const isDirty = editingName || editingItemId !== null

  useEffect(() => {
    Promise.all([
      getPatientProgramWithItems(programId),
      getEducationalContent(),
    ]).then(([data, content]) => {
      if (data) {
        setItems([...(data.patient_program_items ?? [])].sort((a, b) => a.order - b.order) as ProgramItem[])
        setProgramContent([...(data.patient_program_content ?? [])].sort((a, b) => a.order - b.order) as ProgramContent[])
      }
      setAllContent(content as ContentItem[])
      setLoading(false)
    })
  }, [programId])

  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return }
    setSearching(true)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(async () => {
      const results = await getExercises({ search: search.trim() })
      setSearchResults(results as Exercise[])
      setSearching(false)
    }, 300)
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current) }
  }, [search])

  const addedContentIds = useMemo(() => new Set(programContent.map((pc) => pc.content_id)), [programContent])

  const filteredContent = useMemo(() => {
    if (!contentSearch.trim()) return allContent
    const q = contentSearch.toLowerCase()
    return allContent.filter((c) => c.name.toLowerCase().includes(q))
  }, [allContent, contentSearch])

  // ── Name handlers ─────────────────────────────────────────────────────────
  function startEditName() {
    setNameValue(displayName)
    setEditingName(true)
    setTimeout(() => nameInputRef.current?.focus(), 0)
  }

  async function handleSaveName() {
    if (!nameValue.trim()) return
    setSavingName(true)
    try {
      await updatePatientProgramName(programId, patientId, nameValue.trim())
      setDisplayName(nameValue.trim())
      setEditingName(false)
      toast.success("Nazwa zaktualizowana")
    } catch {
      toast.error("Nie udało się zmienić nazwy")
    } finally {
      setSavingName(false)
    }
  }

  // ── Item param handlers ───────────────────────────────────────────────────
  function startEditItem(item: ProgramItem) {
    setEditingItemId(item.id)
    setEditDraft({
      sets: item.sets?.toString() ?? "",
      reps: item.reps?.toString() ?? "",
      duration: item.duration_seconds?.toString() ?? "",
      notes: item.notes ?? "",
    })
  }

  function cancelEditItem() {
    setEditingItemId(null)
  }

  async function saveEditItem() {
    if (!editingItemId) return
    setSavingItem(true)
    const payload = {
      sets: editDraft.sets !== "" ? Number(editDraft.sets) : null,
      reps: editDraft.reps !== "" ? Number(editDraft.reps) : null,
      durationSeconds: editDraft.duration !== "" ? Number(editDraft.duration) : null,
      notes: editDraft.notes || null,
    }
    try {
      await updatePatientProgramItem(editingItemId, patientId, payload)
      setItems((prev) =>
        prev.map((i) =>
          i.id === editingItemId
            ? { ...i, sets: payload.sets, reps: payload.reps, duration_seconds: payload.durationSeconds, notes: payload.notes }
            : i
        )
      )
      setEditingItemId(null)
      toast.success("Zapisano zmiany")
    } catch {
      toast.error("Nie udało się zapisać")
    } finally {
      setSavingItem(false)
    }
  }

  // ── Exercise add/remove ───────────────────────────────────────────────────
  async function handleAdd(ex: Exercise) {
    try {
      const newItem = await addExerciseToPatientProgram(programId, patientId, {
        exerciseId: ex.id,
        sets: ex.default_sets ?? 3,
        reps: ex.default_reps ?? null,
        durationSeconds: ex.default_duration_seconds ?? null,
        notes: "",
      })
      setItems((prev) => [...prev, newItem as unknown as ProgramItem])
      setSearch("")
      setSearchResults([])
      toast.success(`Dodano „${ex.name}"`)
    } catch {
      toast.error("Nie udało się dodać ćwiczenia")
    }
  }

  async function handleRemove(itemId: string) {
    setItems((prev) => prev.filter((i) => i.id !== itemId))
    try {
      await removePatientProgramItem(itemId, patientId)
    } catch {
      toast.error("Nie udało się usunąć")
      getPatientProgramWithItems(programId).then((data) => {
        if (data) setItems([...(data.patient_program_items ?? [])] as ProgramItem[])
      })
    }
  }

  // ── Content add/remove ────────────────────────────────────────────────────
  async function handleAddContent(contentId: string) {
    if (addingContent) return
    setAddingContent(contentId)
    try {
      await addContentToPatientProgram(programId, patientId, contentId)
      const content = allContent.find((c) => c.id === contentId)
      if (content) {
        setProgramContent((prev) => [...prev, {
          id: crypto.randomUUID(), order: prev.length + 1,
          content_id: contentId, educational_content: content,
        }])
      }
    } catch {
      toast.error("Nie udało się dodać materiału")
    } finally {
      setAddingContent(null)
    }
  }

  async function handleRemoveContent(contentId: string) {
    setProgramContent((prev) => prev.filter((pc) => pc.content_id !== contentId))
    try {
      await removeContentFromPatientProgram(programId, patientId, contentId)
    } catch {
      toast.error("Nie udało się usunąć materiału")
      getPatientProgramWithItems(programId).then((data) => {
        if (data) setProgramContent([...(data.patient_program_content ?? [])] as ProgramContent[])
      })
    }
  }

  // ── End program ───────────────────────────────────────────────────────────
  async function handleEnd() {
    if (!confirmEnd) {
      setConfirmEnd(true)
      setTimeout(() => setConfirmEnd(false), 3000)
      return
    }
    setEnding(true)
    try {
      await endPatientProgram(programId, patientId)
      toast.success("Program zakończony")
      router.refresh()
      onClose()
    } catch {
      toast.error("Nie udało się zakończyć")
      setEnding(false)
      setConfirmEnd(false)
    }
  }

  // ── Close with dirty guard ─────────────────────────────────────────────────
  function tryClose() {
    if (isDirty) {
      toast.warning("Masz niezapisane zmiany — zapisz lub anuluj edycję przed zamknięciem")
      return
    }
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) tryClose() }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0 gap-3">
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-1.5">
                <input
                  ref={nameInputRef}
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName()
                    if (e.key === "Escape") setEditingName(false)
                  }}
                  className="flex-1 h-7 px-2 text-sm font-semibold border border-navy-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-400 min-w-0"
                />
                <button
                  onClick={handleSaveName}
                  disabled={savingName || !nameValue.trim()}
                  className="w-6 h-6 flex items-center justify-center rounded bg-navy-500 text-white disabled:opacity-50"
                >
                  {savingName ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                </button>
                <button
                  onClick={() => setEditingName(false)}
                  className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50"
                >
                  <X size={11} />
                </button>
              </div>
            ) : (
              <button
                onClick={startEditName}
                className="group flex items-center gap-1.5 max-w-full text-left"
                title="Kliknij aby zmienić nazwę"
              >
                <h2 className="font-semibold text-gray-900 truncate text-sm">{displayName}</h2>
                <Pencil size={12} className="text-gray-300 group-hover:text-navy-500 shrink-0 transition-colors" />
              </button>
            )}
            <p className="text-xs text-gray-400 mt-0.5">{items.length} ćwiczeń · {programContent.length} materiałów</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleEnd}
              disabled={ending}
              className={`h-8 px-3 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                confirmEnd
                  ? "bg-red-500 text-white"
                  : "border border-gray-200 text-gray-600 hover:border-red-200 hover:text-red-600"
              }`}
            >
              {ending ? <Loader2 size={12} className="animate-spin" /> : <AlertCircle size={12} />}
              {confirmEnd ? "Potwierdź zakończenie" : "Zakończ program"}
            </button>
            <button onClick={tryClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <X size={16} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {/* Exercise items */}
              {items.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">
                  Brak ćwiczeń. Dodaj z biblioteki poniżej.
                </div>
              ) : (
                items.map((item) => {
                  const ex = Array.isArray(item.exercises) ? item.exercises[0] : item.exercises
                  const isEditing = editingItemId === item.id

                  return (
                    <div
                      key={item.id}
                      className={`rounded-xl p-3 transition-colors ${
                        isEditing ? "bg-navy-50/60 border border-navy-100" : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Thumbnail */}
                        <div className="w-12 h-10 rounded-lg bg-gray-200 shrink-0 overflow-hidden flex items-center justify-center">
                          {ex?.thumbnail_url ? (
                            <img src={ex.thumbnail_url} alt={ex.name} className="w-full h-full object-cover" />
                          ) : (
                            <Dumbbell size={14} className="text-gray-400" />
                          )}
                        </div>

                        {/* Name + params (non-edit) */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{ex?.name ?? "Ćwiczenie"}</p>
                          {!isEditing && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {[
                                item.sets != null && `${item.sets} serii`,
                                item.reps != null && `${item.reps} powt.`,
                                item.duration_seconds != null && `${item.duration_seconds}s`,
                              ].filter(Boolean).join(" · ") || "Brak parametrów"}
                              {item.notes && (
                                <span className="ml-1.5 italic text-gray-400">· {item.notes}</span>
                              )}
                            </p>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          {!isEditing && (
                            <button
                              onClick={() => startEditItem(item)}
                              title="Edytuj parametry"
                              className="p-1.5 rounded-lg hover:bg-navy-100 text-gray-300 hover:text-navy-600 transition-colors"
                            >
                              <Pencil size={13} />
                            </button>
                          )}
                          <button
                            onClick={() => handleRemove(item.id)}
                            disabled={isEditing}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors disabled:opacity-30"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Inline edit form */}
                      {isEditing && (
                        <div className="mt-3 space-y-2">
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Serie</label>
                              <input
                                type="number"
                                min="1"
                                value={editDraft.sets}
                                onChange={(e) => setEditDraft((d) => ({ ...d, sets: e.target.value }))}
                                placeholder="–"
                                className="mt-0.5 w-full h-8 px-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-400 bg-white"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Powt.</label>
                              <input
                                type="number"
                                min="1"
                                value={editDraft.reps}
                                onChange={(e) => setEditDraft((d) => ({ ...d, reps: e.target.value }))}
                                placeholder="–"
                                className="mt-0.5 w-full h-8 px-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-400 bg-white"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Czas (s)</label>
                              <input
                                type="number"
                                min="1"
                                value={editDraft.duration}
                                onChange={(e) => setEditDraft((d) => ({ ...d, duration: e.target.value }))}
                                placeholder="–"
                                className="mt-0.5 w-full h-8 px-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-400 bg-white"
                              />
                            </div>
                          </div>
                          <input
                            type="text"
                            value={editDraft.notes}
                            onChange={(e) => setEditDraft((d) => ({ ...d, notes: e.target.value }))}
                            placeholder="Notatka dla pacjenta…"
                            className="w-full h-8 px-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-400 bg-white"
                          />
                          <div className="flex gap-1.5 pt-0.5">
                            <button
                              onClick={saveEditItem}
                              disabled={savingItem}
                              className="h-7 px-3 rounded-lg bg-navy-500 hover:bg-navy-600 text-white text-xs font-medium flex items-center gap-1 disabled:opacity-50"
                            >
                              {savingItem ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                              Zapisz
                            </button>
                            <button
                              onClick={cancelEditItem}
                              disabled={savingItem}
                              className="h-7 px-3 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50"
                            >
                              Anuluj
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}

              {/* Educational content */}
              <div className="pt-3 mt-1 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-gray-500 flex items-center gap-1.5 uppercase tracking-wide">
                    <BookOpen size={12} /> Materiały edukacyjne
                  </h3>
                  <button
                    onClick={() => { setContentPickerOpen(!contentPickerOpen); setContentSearch("") }}
                    className="text-xs text-navy-500 hover:text-navy-700 flex items-center gap-1"
                  >
                    <Plus size={12} /> Dodaj
                  </button>
                </div>

                {programContent.length === 0 && !contentPickerOpen && (
                  <p className="text-xs text-gray-400 py-1">Brak materiałów</p>
                )}

                {programContent.map((pc) => {
                  const ec = Array.isArray(pc.educational_content) ? pc.educational_content[0] : pc.educational_content
                  if (!ec) return null
                  return (
                    <div key={pc.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100 mb-1">
                      <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${ec.type === "pdf" ? "bg-red-50" : "bg-blue-50"}`}>
                        {ec.type === "pdf" ? <FileText size={11} className="text-red-500" /> : <ExternalLink size={11} className="text-blue-500" />}
                      </div>
                      <span className="text-xs text-gray-700 flex-1 truncate">{ec.name}</span>
                      <button onClick={() => handleRemoveContent(pc.content_id)} className="p-0.5 hover:text-red-500 text-gray-300 transition-colors shrink-0">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )
                })}

                {contentPickerOpen && (
                  <div className="border border-gray-200 rounded-xl overflow-hidden mt-1">
                    <div className="p-2 border-b border-gray-100">
                      <div className="relative">
                        <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          value={contentSearch}
                          onChange={(e) => setContentSearch(e.target.value)}
                          placeholder="Szukaj materiałów..."
                          autoFocus
                          className="w-full h-7 pl-6 pr-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-400"
                        />
                      </div>
                    </div>
                    <div className="max-h-40 overflow-y-auto">
                      {filteredContent.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-3">Brak wyników</p>
                      ) : (
                        filteredContent.map((c) => {
                          const isAdded = addedContentIds.has(c.id)
                          return (
                            <button
                              key={c.id}
                              onClick={() => !isAdded && handleAddContent(c.id)}
                              disabled={isAdded || addingContent === c.id}
                              className={`w-full flex items-center gap-2 px-2.5 py-2 text-left border-b border-gray-50 last:border-0 transition-colors ${isAdded ? "bg-navy-50 cursor-default" : "hover:bg-gray-50"}`}
                            >
                              <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${c.type === "pdf" ? "bg-red-50" : "bg-blue-50"}`}>
                                {c.type === "pdf" ? <FileText size={10} className="text-red-500" /> : <ExternalLink size={10} className="text-blue-500" />}
                              </div>
                              <span className="text-xs text-gray-800 flex-1 truncate">{c.name}</span>
                              {isAdded ? <span className="text-xs text-navy-500">✓</span>
                                : addingContent === c.id ? <Loader2 size={11} className="text-gray-400 animate-spin shrink-0" />
                                : <Plus size={11} className="text-gray-400 shrink-0" />}
                            </button>
                          )
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer — add exercise */}
        <div className="px-4 pb-4 pt-2 border-t border-gray-100 shrink-0 space-y-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Szukaj ćwiczenia do dodania..."
              className="w-full h-9 pl-8 pr-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-400"
            />
            {searching && <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />}
          </div>

          {searchResults.length > 0 && (
            <div className="border border-gray-200 rounded-xl overflow-hidden max-h-44 overflow-y-auto">
              {searchResults.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => handleAdd(ex)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-navy-50 transition-colors text-left border-b border-gray-100 last:border-0"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 shrink-0 overflow-hidden flex items-center justify-center">
                    {ex.thumbnail_url ? (
                      <img src={ex.thumbnail_url} alt={ex.name} className="w-full h-full object-cover" />
                    ) : (
                      <Dumbbell size={12} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{ex.name}</p>
                    {ex.body_part && <p className="text-xs text-gray-400">{ex.body_part}</p>}
                  </div>
                  <Plus size={14} className="text-navy-500 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
