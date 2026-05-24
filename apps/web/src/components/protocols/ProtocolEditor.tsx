"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, ChevronDown, ChevronUp, Clock, Layers, User } from "lucide-react"
import { addPhase, updatePhase, deletePhase } from "@/lib/actions/protocols"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

type Template = {
  id: string
  name: string
  body_part: string | null
  program_template_items: { id: string }[]
}

type Phase = {
  id: string
  order: number
  name: string
  description: string | null
  goals: string | null
  patient_intro: string | null
  rules: string | null
  duration_weeks: number
  template_id: string | null
  program_templates?: { id: string; name: string } | { id: string; name: string }[] | null
}

interface Props {
  protocolId: string
  phases: Phase[]
  templates: Template[]
}

export function ProtocolEditor({ protocolId, phases, templates }: Props) {
  const [showAddForm, setShowAddForm] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">
          Fazy protokołu
          {phases.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-400">({phases.length})</span>
          )}
        </h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 h-8 px-3 rounded-lg bg-navy-500 hover:bg-navy-600 text-white text-xs font-medium transition-colors"
        >
          <Plus size={13} />
          Dodaj fazę
        </button>
      </div>

      {phases.length === 0 && !showAddForm && (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <Layers size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400 mb-3">Protokół nie ma jeszcze żadnych faz</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="text-sm text-navy-500 hover:text-navy-600 font-medium"
          >
            + Dodaj pierwszą fazę
          </button>
        </div>
      )}

      <div className="space-y-3">
        {phases.map((phase, index) => (
          <PhaseCard
            key={phase.id}
            phase={phase}
            index={index}
            protocolId={protocolId}
            templates={templates}
          />
        ))}

        {showAddForm && (
          <AddPhaseForm
            protocolId={protocolId}
            templates={templates}
            phaseNumber={phases.length + 1}
            onCancel={() => setShowAddForm(false)}
            onSuccess={() => setShowAddForm(false)}
          />
        )}
      </div>
    </div>
  )
}

function PhaseCard({
  phase,
  index,
  protocolId,
  templates,
}: {
  phase: Phase
  index: number
  protocolId: string
  templates: Template[]
}) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: phase.name,
    description: phase.description ?? "",
    goals: phase.goals ?? "",
    patientIntro: phase.patient_intro ?? "",
    rules: phase.rules ?? "",
    durationWeeks: String(phase.duration_weeks),
    templateId: phase.template_id ?? "",
  })

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updatePhase(phase.id, protocolId, {
        name: form.name,
        description: form.description,
        goals: form.goals,
        patientIntro: form.patientIntro,
        rules: form.rules,
        durationWeeks: Number(form.durationWeeks),
        templateId: form.templateId || null,
      })
      toast.success("Faza zapisana")
      setEditing(false)
      router.refresh()
    } catch {
      toast.error("Błąd zapisu")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`Usunąć fazę "${phase.name}"?`)) return
    setDeleting(true)
    try {
      await deletePhase(phase.id, protocolId)
      toast.success("Faza usunięta")
      router.refresh()
    } catch {
      toast.error("Błąd usuwania")
      setDeleting(false)
    }
  }

  const assignedTemplate = templates.find((t) => t.id === phase.template_id)

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-7 h-7 rounded-full bg-navy-50 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-semibold text-navy-600">{index + 1}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{phase.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock size={11} />
              {phase.duration_weeks} {phase.duration_weeks === 1 ? "tydzień" : phase.duration_weeks < 5 ? "tygodnie" : "tygodni"}
            </span>
            {assignedTemplate && (
              <span className="text-xs text-navy-600 bg-navy-50 px-2 py-0.5 rounded-full">
                {assignedTemplate.name}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
        >
          <Trash2 size={14} />
        </button>
        <button
          onClick={() => { setExpanded(!expanded); if (!expanded) setEditing(false) }}
          className="p-1 rounded hover:bg-gray-100 text-gray-400 transition-colors"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3">
          {!editing ? (
            <div className="space-y-3">
              {phase.goals && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Cele fazy</p>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{phase.goals}</p>
                </div>
              )}
              {phase.description && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Opis wewnętrzny</p>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{phase.description}</p>
                </div>
              )}
              {(phase.patient_intro || phase.rules) && (
                <div className="rounded-lg bg-navy-50 border border-navy-100 p-3 space-y-2">
                  <p className="text-xs font-semibold text-navy-600 flex items-center gap-1.5">
                    <User size={11} /> Treść dla pacjenta
                  </p>
                  {phase.patient_intro && (
                    <div>
                      <p className="text-xs font-medium text-navy-500 mb-0.5">Wstęp fazy</p>
                      <p className="text-sm text-navy-800 whitespace-pre-line">{phase.patient_intro}</p>
                    </div>
                  )}
                  {phase.rules && (
                    <div>
                      <p className="text-xs font-medium text-navy-500 mb-0.5">Zasady</p>
                      <p className="text-sm text-navy-800 whitespace-pre-line">{phase.rules}</p>
                    </div>
                  )}
                </div>
              )}
              {!phase.goals && !phase.description && !phase.patient_intro && !phase.rules && (
                <p className="text-sm text-gray-400">Brak opisu fazy</p>
              )}
              <button
                onClick={() => setEditing(true)}
                className="text-sm text-navy-500 hover:text-navy-600 font-medium"
              >
                Edytuj fazę
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-xs">Nazwa fazy</Label>
                  <Input value={form.name} onChange={(e) => update("name", e.target.value)} className="h-8 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Czas trwania (tygodnie)</Label>
                  <Input type="number" min="1" value={form.durationWeeks} onChange={(e) => update("durationWeeks", e.target.value)} className="h-8 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Szablon ćwiczeń</Label>
                  <select
                    value={form.templateId}
                    onChange={(e) => update("templateId", e.target.value)}
                    className="w-full h-8 text-sm border border-gray-200 rounded-lg px-2 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 bg-white"
                  >
                    <option value="">— brak —</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Cele fazy</Label>
                <Textarea value={form.goals} onChange={(e) => update("goals", e.target.value)} placeholder="np. Redukcja bólu i obrzęku, pełen wyprost..." className="text-sm min-h-[60px] resize-none" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Opis wewnętrzny</Label>
                <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Notatki dla fizjoterapeuty..." className="text-sm min-h-[60px] resize-none" />
              </div>
              <div className="rounded-lg bg-navy-50 border border-navy-100 p-3 space-y-3">
                <p className="text-xs font-semibold text-navy-600 flex items-center gap-1.5">
                  <User size={11} /> Treść dla pacjenta (opcjonalne)
                </p>
                <div className="space-y-1.5">
                  <Label className="text-xs text-navy-700">Wstęp fazy</Label>
                  <Textarea
                    value={form.patientIntro}
                    onChange={(e) => update("patientIntro", e.target.value)}
                    placeholder="Co pacjent może spodziewać się w tej fazie... np. 'W tej fazie skupiamy się na zmniejszeniu bólu i obrzęku. Ćwiczenia są łagodne – nie forsuj się.'"
                    className="text-sm min-h-[80px] resize-none bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-navy-700">Zasady fazy</Label>
                  <Textarea
                    value={form.rules}
                    onChange={(e) => update("rules", e.target.value)}
                    placeholder="np. 'Nie zginaj kolana powyżej 90°. Ćwicz co drugi dzień. Zatrzymaj się gdy ból przekracza 4/10.'"
                    className="text-sm min-h-[80px] resize-none bg-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditing(false)}
                  className="h-8 px-3 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Anuluj
                </button>
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
      )}
    </div>
  )
}

function AddPhaseForm({
  protocolId,
  templates,
  phaseNumber,
  onCancel,
  onSuccess,
}: {
  protocolId: string
  templates: Template[]
  phaseNumber: number
  onCancel: () => void
  onSuccess: () => void
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: `Faza ${phaseNumber}`,
    description: "",
    goals: "",
    patientIntro: "",
    rules: "",
    durationWeeks: "2",
    templateId: "",
  })

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.durationWeeks) return
    setLoading(true)
    try {
      await addPhase(protocolId, {
        name: form.name.trim(),
        description: form.description || undefined,
        goals: form.goals || undefined,
        patientIntro: form.patientIntro || undefined,
        rules: form.rules || undefined,
        durationWeeks: Number(form.durationWeeks),
        templateId: form.templateId || undefined,
      })
      toast.success("Faza dodana")
      onSuccess()
      router.refresh()
    } catch {
      toast.error("Błąd dodawania fazy")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border-2 border-dashed border-navy-100 p-4">
      <p className="text-sm font-semibold text-gray-900 mb-3">Nowa faza</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 col-span-2">
            <Label className="text-xs">Nazwa fazy *</Label>
            <Input value={form.name} onChange={(e) => update("name", e.target.value)} className="h-8 text-sm" required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Czas trwania (tygodnie) *</Label>
            <Input type="number" min="1" value={form.durationWeeks} onChange={(e) => update("durationWeeks", e.target.value)} className="h-8 text-sm" required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Szablon ćwiczeń</Label>
            <select
              value={form.templateId}
              onChange={(e) => update("templateId", e.target.value)}
              className="w-full h-8 text-sm border border-gray-200 rounded-lg px-2 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 bg-white"
            >
              <option value="">— brak —</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Cele fazy</Label>
          <Textarea value={form.goals} onChange={(e) => update("goals", e.target.value)} placeholder="np. Pełen zakres ruchu, chód bez kul..." className="text-sm min-h-[60px] resize-none" />
        </div>
        <div className="rounded-lg bg-navy-50 border border-navy-100 p-3 space-y-3">
          <p className="text-xs font-semibold text-navy-600 flex items-center gap-1.5">
            <User size={11} /> Treść dla pacjenta (opcjonalne)
          </p>
          <div className="space-y-1.5">
            <Label className="text-xs text-navy-700">Wstęp fazy</Label>
            <Textarea
              value={form.patientIntro}
              onChange={(e) => update("patientIntro", e.target.value)}
              placeholder="Co pacjent może spodziewać się w tej fazie..."
              className="text-sm min-h-[70px] resize-none bg-white"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-navy-700">Zasady fazy</Label>
            <Textarea
              value={form.rules}
              onChange={(e) => update("rules", e.target.value)}
              placeholder="np. Ćwicz co drugi dzień. Zatrzymaj się gdy ból > 4/10."
              className="text-sm min-h-[70px] resize-none bg-white"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="h-8 px-3 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Anuluj
          </button>
          <button type="submit" disabled={loading} className="h-8 px-3 rounded-lg bg-navy-500 hover:bg-navy-600 disabled:opacity-50 text-white text-xs font-medium transition-colors">
            {loading ? "Dodawanie..." : "Dodaj fazę"}
          </button>
        </div>
      </form>
    </div>
  )
}
