"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { createProtocol } from "@/lib/actions/protocols"
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

export function NewProtocolModal() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: "",
    indication: "",
    bodyPart: "",
    totalWeeks: "",
    description: "",
  })

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setLoading(true)
    try {
      await createProtocol({
        name: form.name.trim(),
        description: form.description || undefined,
        indication: form.indication || undefined,
        bodyPart: form.bodyPart || undefined,
        totalWeeks: form.totalWeeks ? Number(form.totalWeeks) : undefined,
      })
      // redirect() in server action throws NEXT_REDIRECT — that's normal, ignore it
    } catch (err: unknown) {
      if (err && typeof err === "object" && "digest" in err && String((err as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")) {
        return // redirect is in progress
      }
      toast.error("Nie udało się utworzyć protokołu")
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-navy-500 hover:bg-navy-600 text-white text-sm font-medium transition-colors">
        <Plus size={15} />
        Nowy protokół
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nowy protokół rehabilitacyjny</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="np-name">Nazwa *</Label>
            <Input
              id="np-name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="np. Powrót po operacji ACL"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="np-indication">Wskazanie kliniczne</Label>
            <Input
              id="np-indication"
              value={form.indication}
              onChange={(e) => update("indication", e.target.value)}
              placeholder="np. Rekonstrukcja więzadła krzyżowego"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="np-part">Okolica ciała</Label>
              <Input
                id="np-part"
                value={form.bodyPart}
                onChange={(e) => update("bodyPart", e.target.value)}
                placeholder="np. Kolano"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="np-weeks">Łączny czas (tyg.)</Label>
              <Input
                id="np-weeks"
                type="number"
                min="1"
                value={form.totalWeeks}
                onChange={(e) => update("totalWeeks", e.target.value)}
                placeholder="np. 24"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="np-desc">Opis</Label>
            <Input
              id="np-desc"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Krótki opis protokołu..."
            />
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
              disabled={loading || !form.name.trim()}
              className="inline-flex items-center h-9 px-4 rounded-lg bg-navy-500 hover:bg-navy-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
            >
              {loading ? "Tworzenie..." : "Utwórz i edytuj"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
