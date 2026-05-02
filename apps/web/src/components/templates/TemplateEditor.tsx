"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { X, GripVertical, Dumbbell, Plus, Search, ChevronDown, ChevronUp, FileText, ExternalLink, BookOpen, Trash2 } from "lucide-react"
import { addExerciseToTemplate, removeExerciseFromTemplate, updateTemplateItem, addContentToTemplate, removeContentFromTemplate } from "@/lib/actions/templates"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

type Exercise = {
  id: string
  name: string
  body_part: string | null
  category: string | null
  difficulty: number | null
  thumbnail_url: string | null
  default_sets: number | null
  default_reps: number | null
  default_duration_seconds: number | null
  default_rest_seconds?: number | null
}

type TemplateItem = {
  id: string
  order: number
  sets: number | null
  reps: number | null
  duration_seconds: number | null
  rest_seconds: number | null
  notes: string | null
  exercises: Exercise | null
}

type ContentItem = {
  id: string
  name: string
  type: string
  file_url: string | null
  external_url: string | null
}

type TemplateContent = {
  id: string
  order: number
  content_id: string
  educational_content: ContentItem | ContentItem[] | null
}

interface Props {
  templateId: string
  items: TemplateItem[]
  exercises: Exercise[]
  allContent: ContentItem[]
  templateContent: TemplateContent[]
}

export function TemplateEditor({ templateId, items, exercises, allContent, templateContent }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [contentSearch, setContentSearch] = useState("")
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [adding, setAdding] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)
  const [addingContent, setAddingContent] = useState<string | null>(null)
  const [contentPickerOpen, setContentPickerOpen] = useState(false)

  const filteredExercises = exercises.filter((ex) =>
    ex.name.toLowerCase().includes(search.toLowerCase()) ||
    (ex.body_part?.toLowerCase().includes(search.toLowerCase()) ?? false)
  )

  const filteredContent = useMemo(() => {
    if (!contentSearch.trim()) return allContent
    const q = contentSearch.toLowerCase()
    return allContent.filter((c) => c.name.toLowerCase().includes(q))
  }, [allContent, contentSearch])

  const addedContentIds = new Set(templateContent.map((tc) => tc.content_id))

  async function handleAdd(exercise: Exercise) {
    if (adding) return
    setAdding(exercise.id)
    try {
      await addExerciseToTemplate(templateId, exercise.id, {
        sets: exercise.default_sets ?? 3,
        reps: exercise.default_reps ?? undefined,
        duration: exercise.default_duration_seconds ?? undefined,
        rest: exercise.default_rest_seconds ?? 60,
        order: items.length,
      })
      toast.success(`Dodano: ${exercise.name}`)
      router.refresh()
    } catch {
      toast.error("Nie udało się dodać ćwiczenia")
    } finally {
      setAdding(null)
    }
  }

  async function handleRemove(itemId: string) {
    if (removing) return
    setRemoving(itemId)
    try {
      await removeExerciseFromTemplate(itemId, templateId)
      toast.success("Usunięto ćwiczenie")
      router.refresh()
    } catch {
      toast.error("Nie udało się usunąć")
    } finally {
      setRemoving(null)
    }
  }

  async function handleAddContent(contentId: string) {
    setAddingContent(contentId)
    try {
      await addContentToTemplate(templateId, contentId)
      router.refresh()
    } catch {
      toast.error("Nie udało się dodać materiału")
    } finally {
      setAddingContent(null)
    }
  }

  async function handleRemoveContent(contentId: string) {
    try {
      await removeContentFromTemplate(templateId, contentId)
      router.refresh()
    } catch {
      toast.error("Nie udało się usunąć")
    }
  }

  const alreadyAdded = new Set(items.map((item) => item.exercises?.id).filter(Boolean))

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Left: current items */}
      <div className="col-span-2 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">
            Ćwiczenia w programie
            {items.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">({items.length})</span>
            )}
          </h2>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
            <Dumbbell size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Dodaj ćwiczenia z listy po prawej stronie</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item, index) => (
              <ExerciseItem
                key={item.id}
                item={item}
                index={index}
                templateId={templateId}
                expanded={expandedItem === item.id}
                onToggleExpand={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                onRemove={() => handleRemove(item.id)}
                removing={removing === item.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Right: exercise picker + content */}
      <div className="space-y-3">
        <h2 className="font-semibold text-gray-900">Biblioteka ćwiczeń</h2>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Szukaj..."
            className="pl-8 h-8 text-sm"
          />
        </div>
        <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
          {filteredExercises.map((ex) => {
            const isAdded = alreadyAdded.has(ex.id)
            return (
              <button
                key={ex.id}
                onClick={() => !isAdded && handleAdd(ex)}
                disabled={isAdded || adding === ex.id}
                className={`w-full text-left flex items-center gap-2.5 p-2.5 rounded-lg border transition-colors ${
                  isAdded
                    ? "border-navy-100 bg-navy-50 cursor-default"
                    : "border-gray-200 bg-white hover:border-navy-100 hover:bg-navy-50/50 cursor-pointer"
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Dumbbell size={14} className="text-gray-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-900 leading-tight truncate">{ex.name}</p>
                  {ex.body_part && <p className="text-xs text-gray-400">{ex.body_part}</p>}
                </div>
                {isAdded ? (
                  <span className="text-xs text-navy-500 font-medium flex-shrink-0">✓</span>
                ) : (
                  <Plus size={14} className="text-gray-400 flex-shrink-0" />
                )}
              </button>
            )
          })}
        </div>

        {/* Educational content */}
        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
              <BookOpen size={14} className="text-gray-400" />
              Materiały edukacyjne
            </h3>
            <button
              onClick={() => setContentPickerOpen(!contentPickerOpen)}
              className="text-xs text-navy-500 hover:text-navy-700 flex items-center gap-1"
            >
              <Plus size={12} /> Dodaj
            </button>
          </div>

          {/* Already added content */}
          {templateContent.length > 0 && (
            <div className="space-y-1 mb-2">
              {templateContent.map((tc) => {
                const ec = Array.isArray(tc.educational_content) ? tc.educational_content[0] : tc.educational_content
                if (!ec) return null
                return (
                  <div key={tc.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100">
                    <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${ec.type === "pdf" ? "bg-red-50" : "bg-blue-50"}`}>
                      {ec.type === "pdf" ? <FileText size={11} className="text-red-500" /> : <ExternalLink size={11} className="text-blue-500" />}
                    </div>
                    <span className="text-xs text-gray-700 flex-1 truncate">{ec.name}</span>
                    <button onClick={() => handleRemoveContent(tc.content_id)} className="p-0.5 hover:text-red-500 text-gray-300 transition-colors shrink-0">
                      <Trash2 size={12} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Picker */}
          {contentPickerOpen && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="p-2 border-b border-gray-100">
                <div className="relative">
                  <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={contentSearch} onChange={(e) => setContentSearch(e.target.value)}
                    placeholder="Szukaj..." autoFocus
                    className="w-full h-7 pl-6 pr-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-400" />
                </div>
              </div>
              <div className="max-h-40 overflow-y-auto">
                {filteredContent.map((c) => {
                  const isAdded = addedContentIds.has(c.id)
                  return (
                    <button key={c.id} onClick={() => !isAdded && handleAddContent(c.id)}
                      disabled={isAdded || addingContent === c.id}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 text-left border-b border-gray-50 last:border-0 transition-colors ${isAdded ? "bg-navy-50 cursor-default" : "hover:bg-gray-50"}`}>
                      <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${c.type === "pdf" ? "bg-red-50" : "bg-blue-50"}`}>
                        {c.type === "pdf" ? <FileText size={10} className="text-red-500" /> : <ExternalLink size={10} className="text-blue-500" />}
                      </div>
                      <span className="text-xs text-gray-800 flex-1 truncate">{c.name}</span>
                      {isAdded ? <span className="text-xs text-navy-500">✓</span> : <Plus size={11} className="text-gray-400 shrink-0" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ExerciseItem({
  item,
  index,
  templateId,
  expanded,
  onToggleExpand,
  onRemove,
  removing,
}: {
  item: TemplateItem
  index: number
  templateId: string
  expanded: boolean
  onToggleExpand: () => void
  onRemove: () => void
  removing: boolean
}) {
  const router = useRouter()
  const [params, setParams] = useState({
    sets: item.sets ?? "",
    reps: item.reps ?? "",
    duration: item.duration_seconds ?? "",
    rest: item.rest_seconds ?? "",
    notes: item.notes ?? "",
  })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await updateTemplateItem(item.id, templateId, {
        sets: params.sets ? Number(params.sets) : null,
        reps: params.reps ? Number(params.reps) : null,
        duration: params.duration ? Number(params.duration) : null,
        rest: params.rest ? Number(params.rest) : null,
        notes: params.notes || null,
      })
      toast.success("Zapisano")
      router.refresh()
    } catch {
      toast.error("Błąd zapisu")
    } finally {
      setSaving(false)
    }
  }

  const summary = [
    params.sets && `${params.sets} serie`,
    params.reps && `${params.reps} powt.`,
    params.duration && `${params.duration}s`,
    params.rest && `przerwa ${params.rest}s`,
  ].filter(Boolean).join(" · ")

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="text-xs font-medium text-gray-400 w-5 text-center">{index + 1}</span>
        <GripVertical size={16} className="text-gray-300 cursor-grab flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{item.exercises?.name ?? "Nieznane"}</p>
          {summary && <p className="text-xs text-gray-400 mt-0.5">{summary}</p>}
        </div>
        <button
          onClick={onToggleExpand}
          className="p-1 rounded hover:bg-gray-100 text-gray-400 transition-colors"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        <button
          onClick={onRemove}
          disabled={removing}
          className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Serie", key: "sets" as const, placeholder: "3" },
              { label: "Powt.", key: "reps" as const, placeholder: "12" },
              { label: "Czas (s)", key: "duration" as const, placeholder: "—" },
              { label: "Przerwa (s)", key: "rest" as const, placeholder: "60" },
            ].map(({ label, key, placeholder }) => (
              <div key={key} className="space-y-1">
                <label className="text-xs text-gray-500">{label}</label>
                <Input
                  type="number"
                  min="1"
                  value={params[key]}
                  onChange={(e) => setParams((p) => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="h-8 text-sm"
                />
              </div>
            ))}
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Notatka dla pacjenta</label>
            <Input
              value={params.notes}
              onChange={(e) => setParams((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Dodatkowe wskazówki..."
              className="h-8 text-sm"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="h-8 px-3 rounded-lg bg-navy-500 hover:bg-navy-600 disabled:opacity-50 text-white text-xs font-medium transition-colors"
            >
              {saving ? "Zapisywanie..." : "Zapisz"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
