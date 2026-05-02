"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, X, Loader2 } from "lucide-react"
import { updatePatient } from "@/lib/actions/patients"
import { toast } from "sonner"

type Patient = {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  birth_year: number | null
  gender: string | null
  notes: string | null
}

interface Props {
  patient: Patient
}

export function EditPatientModal({ patient }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    firstName: patient.first_name,
    lastName: patient.last_name,
    email: patient.email ?? "",
    phone: patient.phone ?? "",
    birthYear: patient.birth_year?.toString() ?? "",
    gender: patient.gender ?? "",
    notes: patient.notes ?? "",
  })

  function set(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.firstName.trim() || !form.lastName.trim()) return
    setSaving(true)
    try {
      await updatePatient(patient.id, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email || undefined,
        phone: form.phone || undefined,
        birthYear: form.birthYear ? Number(form.birthYear) : undefined,
        gender: form.gender as "male" | "female" | "other" | undefined || undefined,
        notes: form.notes || undefined,
      })
      toast.success("Dane zaktualizowane")
      setOpen(false)
      router.refresh()
    } catch {
      toast.error("Nie udało się zapisać")
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
      >
        <Pencil size={13} />
        Edytuj
      </button>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Edytuj dane pacjenta</h2>
          <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Imię *</label>
              <input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} required
                className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-400" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Nazwisko *</label>
              <input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} required
                className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-400" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">E-mail</label>
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
              className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-400" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Telefon</label>
              <input value={form.phone} onChange={(e) => set("phone", e.target.value)}
                className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-400" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Rok urodzenia</label>
              <input type="number" value={form.birthYear} onChange={(e) => set("birthYear", e.target.value)}
                placeholder="np. 1985"
                className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-400" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Płeć</label>
            <select value={form.gender} onChange={(e) => set("gender", e.target.value)}
              className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-navy-400">
              <option value="">Nie podano</option>
              <option value="male">Mężczyzna</option>
              <option value="female">Kobieta</option>
              <option value="other">Inne</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Notatki</label>
            <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-400 resize-none" />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={() => setOpen(false)}
              className="h-9 px-4 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Anuluj
            </button>
            <button type="submit" disabled={saving}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-navy-500 hover:bg-navy-600 disabled:opacity-50 text-white text-sm font-medium">
              {saving && <Loader2 size={13} className="animate-spin" />}
              {saving ? "Zapisuję..." : "Zapisz"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
