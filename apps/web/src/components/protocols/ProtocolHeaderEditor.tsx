"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, X, Check } from "lucide-react"
import { updateProtocol } from "@/lib/actions/protocols"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

const BODY_PARTS = [
  "Bark",
  "Biodro",
  "Całe ciało",
  "Kolano",
  "Kręgosłup lędźwiowy",
  "Kręgosłup piersiowy",
  "Kręgosłup szyjny",
  "Łokieć",
  "Ręka / Nadgarstek",
  "Stopa / Kostka",
  "Inne",
]

interface Props {
  protocolId: string
  name: string
  indication: string | null
  bodyPart: string | null
  totalWeeks: number | null
  description: string | null
}

export function ProtocolHeaderEditor({
  protocolId,
  name,
  indication,
  bodyPart,
  totalWeeks,
  description,
}: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name,
    indication: indication ?? "",
    bodyPart: bodyPart ?? "",
    totalWeeks: totalWeeks ? String(totalWeeks) : "",
    description: description ?? "",
  })

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setLoading(true)
    try {
      await updateProtocol(protocolId, {
        name: form.name.trim(),
        indication: form.indication,
        bodyPart: form.bodyPart,
        totalWeeks: form.totalWeeks ? Number(form.totalWeeks) : undefined,
        description: form.description,
      })
      toast.success("Protokół zaktualizowany")
      setEditing(false)
      router.refresh()
    } catch {
      toast.error("Nie udało się zapisać zmian")
    } finally {
      setLoading(false)
    }
  }

  function handleCancel() {
    setForm({
      name,
      indication: indication ?? "",
      bodyPart: bodyPart ?? "",
      totalWeeks: totalWeeks ? String(totalWeeks) : "",
      description: description ?? "",
    })
    setEditing(false)
  }

  if (!editing) {
    return (
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-gray-900">{name}</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {indication && (
              <p className="text-sm text-gray-500">{indication}</p>
            )}
            {bodyPart && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {bodyPart}
              </span>
            )}
            {totalWeeks && (
              <span className="text-xs text-gray-500">{totalWeeks} tygodni łącznie</span>
            )}
            {description && (
              <p className="text-xs text-gray-400 w-full mt-1">{description}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors shrink-0 mt-1"
        >
          <Pencil size={12} />
          Edytuj
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white border border-navy-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-medium text-gray-700">Edytuj protokół</p>
        <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>

      <div className="space-y-1.5">
        <Label>Nazwa *</Label>
        <Input
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="Nazwa protokołu"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label>Wskazanie kliniczne</Label>
        <Input
          value={form.indication}
          onChange={(e) => update("indication", e.target.value)}
          placeholder="np. Rekonstrukcja więzadła krzyżowego"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Okolica ciała</Label>
          <select
            value={form.bodyPart}
            onChange={(e) => update("bodyPart", e.target.value)}
            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring/50"
          >
            <option value="">— wybierz —</option>
            {BODY_PARTS.map((bp) => (
              <option key={bp} value={bp}>{bp}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Łączny czas (tyg.)</Label>
          <Input
            type="number"
            min="1"
            value={form.totalWeeks}
            onChange={(e) => update("totalWeeks", e.target.value)}
            placeholder="np. 12"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Opis</Label>
        <Textarea
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="Krótki opis protokołu..."
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={handleCancel}
          className="h-8 px-4 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Anuluj
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={loading || !form.name.trim()}
          className="inline-flex items-center gap-1.5 h-8 px-4 rounded-lg bg-navy-500 hover:bg-navy-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
        >
          <Check size={13} />
          {loading ? "Zapisywanie..." : "Zapisz"}
        </button>
      </div>
    </div>
  )
}
