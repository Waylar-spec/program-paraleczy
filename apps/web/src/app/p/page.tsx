"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { getPatientByCode } from "@/lib/actions/patient-portal"

export default function PatientLoginPage() {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (trimmed.length !== 8) {
      setError("Kod dostępu ma 8 znaków")
      return
    }
    setLoading(true)
    setError("")
    try {
      const patient = await getPatientByCode(trimmed)
      if (!patient) {
        setError("Nie znaleziono pacjenta. Sprawdź kod.")
        setLoading(false)
        return
      }
      router.push(`/p/${trimmed}`)
    } catch {
      setError("Błąd połączenia. Spróbuj ponownie.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image src="/logo.png" alt="Para Leczy" width={48} height={48} className="rounded-xl mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900">Para Leczy</h1>
          <p className="text-sm text-gray-500 mt-1">Twój program rehabilitacyjny</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Wpisz kod dostępu</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={8}
              placeholder="np. AB3X7Y9Z"
              autoFocus
              className="w-full h-12 px-4 text-center text-xl font-mono font-semibold tracking-widest border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-400 uppercase"
            />
            {error && <p className="text-xs text-red-500 text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading || code.trim().length < 8}
              className="w-full h-11 rounded-xl bg-navy-500 hover:bg-navy-600 disabled:opacity-50 text-white font-medium transition-colors"
            >
              {loading ? "Sprawdzam..." : "Wejdź"}
            </button>
          </form>
          <p className="text-xs text-center text-gray-400 mt-4">
            Kod znajdziesz u swojego fizjoterapeuty
          </p>
        </div>
      </div>
    </div>
  )
}
