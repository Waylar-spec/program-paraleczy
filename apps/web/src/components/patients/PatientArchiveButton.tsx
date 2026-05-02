"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Archive } from "lucide-react"
import { archivePatient } from "@/lib/actions/patients"
import { toast } from "sonner"

interface Props {
  patientId: string
}

export function PatientArchiveButton({ patientId }: Props) {
  const router = useRouter()
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (!confirm) {
      setConfirm(true)
      setTimeout(() => setConfirm(false), 3000)
      return
    }
    setLoading(true)
    try {
      await archivePatient(patientId)
      toast.success("Pacjent zarchiwizowany")
      router.push("/pacjenci")
    } catch {
      toast.error("Nie udało się zarchiwizować")
      setLoading(false)
      setConfirm(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`inline-flex items-center gap-2 h-9 px-3 rounded-lg border text-sm font-medium transition-colors ${
        confirm
          ? "border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
          : "border-gray-200 text-gray-500 hover:bg-gray-50"
      }`}
    >
      <Archive size={14} />
      {confirm ? "Potwierdź archiwizację" : "Archiwizuj"}
    </button>
  )
}
