"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { createTemplate } from "@/lib/actions/templates"
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

const BODY_PARTS = ["Kolano", "Bark", "Biodro", "Kręgosłup lędźwiowy", "Kręgosłup szyjny", "Łokieć", "Nadgarstek", "Stopa/Skokowy", "Całe ciało", "Inne"]

export function NewTemplateModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: "", description: "", bodyPart: "" })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) return
    setLoading(true)
    try {
      const template = await createTemplate({
        name: form.name,
        description: form.description || undefined,
        bodyPart: form.bodyPart || undefined,
      })
      toast.success(`Szablon "${form.name}" został utworzony`)
      setOpen(false)
      setForm({ name: "", description: "", bodyPart: "" })
      router.push(`/biblioteka/szablony/${template.id}`)
    } catch {
      toast.error("Nie udało się utworzyć szablonu")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-navy-500 hover:bg-navy-600 text-white text-sm font-medium transition-colors">
        <Plus size={16} />
        Nowy szablon
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nowy szablon programu</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="tpl-name">Nazwa *</Label>
            <Input
              id="tpl-name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="np. Rehabilitacja kolana po operacji"
              required
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tpl-desc">Opis</Label>
            <Textarea
              id="tpl-desc"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Krótki opis programu..."
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tpl-bodypart">Okolica ciała</Label>
            <select
              id="tpl-bodypart"
              value={form.bodyPart}
              onChange={(e) => setForm((p) => ({ ...p, bodyPart: e.target.value }))}
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-ring/50"
            >
              <option value="">— wybierz —</option>
              {BODY_PARTS.map((bp) => <option key={bp} value={bp}>{bp}</option>)}
            </select>
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
              disabled={loading || !form.name}
              className="inline-flex items-center h-9 px-4 rounded-lg bg-navy-500 hover:bg-navy-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
            >
              {loading ? "Tworzenie..." : "Utwórz szablon"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
