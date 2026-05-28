"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Plus, AlertTriangle, ArrowRight } from "lucide-react"
import { createPatient, findPatientByEmail } from "@/lib/actions/patients"
import { Button } from "@/components/ui/button"
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

export function NewPatientModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", notes: "" })
  const [duplicate, setDuplicate] = useState<{ id: string; first_name: string; last_name: string } | null>(null)
  const emailCheckRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (field === "email") {
      setDuplicate(null)
      if (emailCheckRef.current) clearTimeout(emailCheckRef.current)
      if (value.includes("@")) {
        emailCheckRef.current = setTimeout(async () => {
          const found = await findPatientByEmail(value)
          setDuplicate(found)
        }, 500)
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.firstName || !form.lastName) return
    setLoading(true)
    try {
      const patient = await createPatient({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email || undefined,
        notes: form.notes || undefined,
      })
      toast.success(`Pacjent ${form.firstName} ${form.lastName} dodany`)
      setOpen(false)
      setForm({ firstName: "", lastName: "", email: "", notes: "" })
      setDuplicate(null)
      router.push(`/pacjenci/${patient.id}`)
    } catch {
      toast.error("Nie udało się dodać pacjenta")
    } finally {
      setLoading(false)
    }
  }

  function handleOpenChange(v: boolean) {
    setOpen(v)
    if (!v) {
      setForm({ firstName: "", lastName: "", email: "", notes: "" })
      setDuplicate(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-navy-500 hover:bg-navy-600 text-white text-sm font-medium transition-colors">
        <Plus size={16} />
        Nowy pacjent
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nowy pacjent</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">Imię *</Label>
              <Input
                id="firstName"
                value={form.firstName}
                onChange={(e) => update("firstName", e.target.value)}
                placeholder="Jan"
                required
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Nazwisko *</Label>
              <Input
                id="lastName"
                value={form.lastName}
                onChange={(e) => update("lastName", e.target.value)}
                placeholder="Kowalski"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="pacjent@email.com"
              className={duplicate ? "border-amber-400 focus-visible:ring-amber-300" : ""}
            />
            {duplicate && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm">
                <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-amber-800 font-medium">
                    Ten e-mail jest już przypisany do pacjenta:
                  </p>
                  <button
                    type="button"
                    onClick={() => { setOpen(false); router.push(`/pacjenci/${duplicate.id}`) }}
                    className="flex items-center gap-1 text-amber-700 hover:text-amber-900 font-semibold mt-0.5 hover:underline"
                  >
                    {duplicate.first_name} {duplicate.last_name}
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notatki</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Dodatkowe informacje o pacjencie..."
              rows={3}
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
              disabled={loading || !form.firstName || !form.lastName}
              className="inline-flex items-center h-9 px-4 rounded-lg bg-navy-500 hover:bg-navy-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
            >
              {loading ? "Dodawanie..." : "Dodaj pacjenta"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
