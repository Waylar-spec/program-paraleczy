"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil } from "lucide-react"
import { updateProtocol } from "@/lib/actions/protocols"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
  protocol: {
    id: string
    name: string
    indication: string | null
    body_part: string | null
    total_weeks: number | null
    description: string | null
  }
}

export function EditProtocolModal({ protocol }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: protocol.name,
    indication: protocol.indication ?? "",
    bodyPart: protocol.body_part ?? "",
    totalWeeks: protocol.total_weeks ? String(protocol.total_weeks) : "",
    description: protocol.description ?? "",
  })

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setLoading(true)
    try {
      await updateProtocol(protocol.id, {
        name: form.name.trim(),
        indication: form.indication,
        bodyPart: form.bodyPart,
        totalWeeks: form.totalWeeks ? Number(form.totalWeeks) : undefined,
        description: form.description,
      })
      toast.success("Protokół zaktualizowany")
      setOpen(false)
      router.refresh()
    } catch {
      toast.error("Nie udało się zapisać zmian")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="h-8 w-8 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors flex items-center justify-center" title="Edytuj protokół">
        <Pencil size={13} />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edytuj protokół</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Nazwa *</Label>
            <Input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Nazwa protokołu"
              required
              autoFocus
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
              onClick={() => setOpen(false)}
              className="h-9 px-4 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={loading || !form.name.trim()}
              className="h-9 px-4 rounded-lg bg-navy-500 hover:bg-navy-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
            >
              {loading ? "Zapisywanie..." : "Zapisz"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
