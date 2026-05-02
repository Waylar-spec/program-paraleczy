"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { createPatient } from "@/lib/actions/patients"
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
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    birthYear: "",
    gender: "" as "male" | "female" | "other" | "",
    notes: "",
  })

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
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
        phone: form.phone || undefined,
        birthYear: form.birthYear ? parseInt(form.birthYear) : undefined,
        gender: (form.gender as "male" | "female" | "other") || undefined,
        notes: form.notes || undefined,
      })
      toast.success(`Pacjent ${form.firstName} ${form.lastName} został dodany`)
      setOpen(false)
      setForm({ firstName: "", lastName: "", email: "", phone: "", birthYear: "", gender: "", notes: "" })
      router.push(`/pacjenci/${patient.id}`)
    } catch (err) {
      toast.error("Nie udało się dodać pacjenta")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-navy-500 hover:bg-navy-600 text-white text-sm font-medium transition-colors">
        <Plus size={16} />
        Nowy pacjent
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="birthYear">Rok urodzenia</Label>
              <Input
                id="birthYear"
                type="number"
                min="1900"
                max={new Date().getFullYear()}
                value={form.birthYear}
                onChange={(e) => update("birthYear", e.target.value)}
                placeholder="1990"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gender">Płeć</Label>
              <select
                id="gender"
                value={form.gender}
                onChange={(e) => update("gender", e.target.value)}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-ring/50"
              >
                <option value="">— wybierz —</option>
                <option value="male">Mężczyzna</option>
                <option value="female">Kobieta</option>
                <option value="other">Inne</option>
              </select>
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
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Telefon</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="+48 600 000 000"
            />
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
