"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { updatePractitioner } from "@/lib/actions/practitioner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

type PractitionerDefaults = {
  first_name: string | null
  last_name: string | null
  email?: string | null
  phone?: string | null
  practice_name?: string | null
  practice_address?: string | null
  practice_city?: string | null
  practice_postal_code?: string | null
  practice_website?: string | null
} | null

interface Props {
  defaultValues: PractitionerDefaults
}

export function PractitionerSettingsForm({ defaultValues }: Props) {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    firstName: defaultValues?.first_name ?? "",
    lastName: defaultValues?.last_name ?? "",
    phone: defaultValues?.phone ?? "",
    practiceName: defaultValues?.practice_name ?? "",
    practiceAddress: defaultValues?.practice_address ?? "",
    practiceCity: defaultValues?.practice_city ?? "",
    practicePostalCode: defaultValues?.practice_postal_code ?? "",
    practiceWebsite: defaultValues?.practice_website ?? "",
  })

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => { const next = { ...prev }; delete next[field]; return next })
    }
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    if (!form.firstName.trim()) newErrors.firstName = "Imię jest wymagane"
    if (!form.lastName.trim()) newErrors.lastName = "Nazwisko jest wymagane"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      await updatePractitioner({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        practiceName: form.practiceName.trim(),
        practiceAddress: form.practiceAddress.trim(),
        practiceCity: form.practiceCity.trim(),
        practicePostalCode: form.practicePostalCode.trim(),
        practiceWebsite: form.practiceWebsite.trim(),
      })
      toast.success("Dane zapisane")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Błąd zapisu")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Dane osobowe</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="firstName">Imię</Label>
            <Input
              id="firstName"
              value={form.firstName}
              onChange={(e) => update("firstName", e.target.value)}
              placeholder="Jan"
            />
            {errors.firstName && (
              <p className="text-xs text-red-500">{errors.firstName}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName">Nazwisko</Label>
            <Input
              id="lastName"
              value={form.lastName}
              onChange={(e) => update("lastName", e.target.value)}
              placeholder="Kowalski"
            />
            {errors.lastName && (
              <p className="text-xs text-red-500">{errors.lastName}</p>
            )}
          </div>
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
      </div>

      {/* Practice */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Dane praktyki</h2>
        <div className="space-y-1.5">
          <Label htmlFor="practiceName">Nazwa praktyki</Label>
          <Input
            id="practiceName"
            value={form.practiceName}
            onChange={(e) => update("practiceName", e.target.value)}
            placeholder="Gabinet Fizjoterapii"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="practiceAddress">Adres</Label>
          <Input
            id="practiceAddress"
            value={form.practiceAddress}
            onChange={(e) => update("practiceAddress", e.target.value)}
            placeholder="ul. Przykładowa 1"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="practiceCity">Miasto</Label>
            <Input
              id="practiceCity"
              value={form.practiceCity}
              onChange={(e) => update("practiceCity", e.target.value)}
              placeholder="Warszawa"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="practicePostalCode">Kod pocztowy</Label>
            <Input
              id="practicePostalCode"
              value={form.practicePostalCode}
              onChange={(e) => update("practicePostalCode", e.target.value)}
              placeholder="00-001"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="practiceWebsite">Strona www</Label>
          <Input
            id="practiceWebsite"
            value={form.practiceWebsite}
            onChange={(e) => update("practiceWebsite", e.target.value)}
            placeholder="https://twojagabinet.pl"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading} className="min-w-32">
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin mr-2" />
              Zapisywanie...
            </>
          ) : (
            "Zapisz zmiany"
          )}
        </Button>
      </div>
    </form>
  )
}
