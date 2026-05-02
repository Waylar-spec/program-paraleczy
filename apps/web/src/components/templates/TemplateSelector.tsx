"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LayoutTemplate, X, Dumbbell, Search, ArrowRight, Pencil } from "lucide-react"
import { useProgramBuilder } from "@/store/programBuilder"
import { updateTemplate } from "@/lib/actions/templates"
import { toast } from "sonner"

const BODY_PARTS = ["Kolano", "Bark", "Biodro", "Kręgosłup lędźwiowy", "Kręgosłup szyjny", "Łokieć", "Nadgarstek", "Stopa/Skokowy", "Całe ciało", "Inne"]

type TemplateItem = {
  id: string
  order: number | null
  sets: number | null
  reps: number | null
  duration_seconds: number | null
  rest_seconds: number | null
  notes: string | null
  exercises: { id: string; name: string; thumbnail_url: string | null } | { id: string; name: string; thumbnail_url: string | null }[] | null
}

type Template = {
  id: string
  name: string
  description: string | null
  body_part: string | null
  program_template_items: TemplateItem[]
}

interface QuickEditProps {
  template: Template
  onClose: () => void
  onLoad: (t: Template) => void
}

function QuickEditModal({ template, onClose, onLoad }: QuickEditProps) {
  const [name, setName] = useState(template.name)
  const [bodyPart, setBodyPart] = useState(template.body_part ?? "")
  const [description, setDescription] = useState(template.description ?? "")
  const [saving, setSaving] = useState(false)

  async function handleLoad() {
    setSaving(true)
    try {
      if (name !== template.name || bodyPart !== template.body_part || description !== template.description) {
        await updateTemplate(template.id, {
          name: name || template.name,
          bodyPart: bodyPart || undefined,
          description: description || undefined,
        })
      }
      onLoad({ ...template, name: name || template.name, body_part: bodyPart || null, description: description || null })
    } catch {
      toast.error("Nie udało się zapisać zmian")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-sm text-gray-900">Edytuj przed załadowaniem</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={15} className="text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">Nazwa szablonu</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-400"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">Okolica ciała</label>
            <select
              value={bodyPart}
              onChange={e => setBodyPart(e.target.value)}
              className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-400 bg-white"
            >
              <option value="">— wybierz —</option>
              {BODY_PARTS.map(bp => <option key={bp} value={bp}>{bp}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">Opis (opcjonalnie)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-400 resize-none"
              placeholder="Krótki opis szablonu..."
            />
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Anuluj
          </button>
          <button
            onClick={handleLoad}
            disabled={saving || !name}
            className="flex-1 h-10 rounded-xl bg-navy-500 hover:bg-navy-600 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {saving ? "Zapisuję..." : <><ArrowRight size={14} /> Załaduj do buildera</>}
          </button>
        </div>
      </div>
    </div>
  )
}

export function TemplateSelector({ templates }: { templates: Template[] }) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [editing, setEditing] = useState<Template | null>(null)
  const { clearAll, addExercise, setProgramName, open } = useProgramBuilder()

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return templates
    return templates.filter(t =>
      t.name.toLowerCase().includes(q) ||
      (t.body_part ?? "").toLowerCase().includes(q) ||
      (t.description ?? "").toLowerCase().includes(q)
    )
  }, [templates, search])

  function loadTemplate(template: Template) {
    clearAll()
    setProgramName(template.name)
    const items = [...(template.program_template_items ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    for (const item of items) {
      const ex = Array.isArray(item.exercises) ? item.exercises[0] : item.exercises
      if (!ex) continue
      addExercise({
        exerciseId: ex.id,
        name: ex.name,
        thumbnailUrl: ex.thumbnail_url,
        sets: item.sets ?? 3,
        reps: item.reps ?? null,
        durationSeconds: item.duration_seconds ?? null,
        notes: item.notes ?? "",
      })
    }
    open()
    setEditing(null)
    toast.success(`Załadowano „${template.name}"`, { description: "Edytor programów jest gotowy — możesz teraz wysłać program pacjentowi." })
    router.push("/biblioteka")
  }

  return (
    <div>
      {/* Search bar */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Szukaj szablonu po nazwie, okolicy ciała..."
          className="w-full h-10 pl-9 pr-4 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-navy-400 bg-white"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 && (
          <div className="col-span-3 py-16 text-center text-sm text-gray-400">
            Brak szablonów pasujących do „{search}"
          </div>
        )}
        {filtered.map((template) => {
          const itemCount = template.program_template_items?.length ?? 0
          const thumbs = (template.program_template_items ?? []).slice(0, 4).map((item) => {
            const ex = Array.isArray(item.exercises) ? item.exercises[0] : item.exercises
            return ex?.thumbnail_url ?? null
          })

          return (
            <div key={template.id} className="group bg-white rounded-xl border border-gray-200 hover:border-navy-300 hover:shadow-md overflow-hidden transition-all flex flex-col">
              {/* Thumbnail strip — klikalny do podglądu */}
              <Link href={`/biblioteka/szablony/${template.id}`} className="block">
                {thumbs.some(Boolean) ? (
                  <div className="flex h-20 bg-gray-100">
                    {thumbs.map((url, i) => (
                      <div key={i} className="flex-1 overflow-hidden">
                        {url
                          ? <img src={url} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full bg-gray-100 flex items-center justify-center"><Dumbbell size={14} className="text-gray-300" /></div>
                        }
                      </div>
                    ))}
                    {itemCount > 4 && (
                      <div className="w-10 bg-gray-800/60 flex items-center justify-center shrink-0">
                        <span className="text-white text-xs font-medium">+{itemCount - 4}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-20 bg-navy-50 flex items-center justify-center">
                    <LayoutTemplate size={24} className="text-navy-300" />
                  </div>
                )}
              </Link>

              {/* Info */}
              <div className="p-4 flex flex-col flex-1">
                <p className="font-semibold text-gray-900 leading-tight">{template.name}</p>
                {template.description && (
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{template.description}</p>
                )}
                <div className="flex items-center gap-2 mt-2 mb-3">
                  {template.body_part
                    ? <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{template.body_part}</span>
                    : <span className="text-xs text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">Brak okolicy</span>
                  }
                  <span className="text-xs text-gray-400">
                    {itemCount === 0 ? "Brak ćwiczeń" : `${itemCount} ćwiczenie${itemCount === 1 ? "" : itemCount < 5 ? "a" : "ń"}`}
                  </span>
                </div>

                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => setEditing(template)}
                    className="flex-1 h-8 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center justify-center gap-1"
                  >
                    <Pencil size={11} /> Edytuj i użyj
                  </button>
                  <button
                    onClick={() => loadTemplate(template)}
                    className="flex-1 h-8 rounded-lg bg-navy-500 hover:bg-navy-600 text-xs font-medium text-white transition-colors flex items-center justify-center gap-1"
                  >
                    Użyj <ArrowRight size={11} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {editing && (
        <QuickEditModal
          template={editing}
          onClose={() => setEditing(null)}
          onLoad={loadTemplate}
        />
      )}
    </div>
  )
}
