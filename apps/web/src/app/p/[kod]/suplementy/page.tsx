import { notFound } from "next/navigation"
import { getPatientByCode } from "@/lib/actions/patient-portal"
import { getPatientSupplementsForPortal } from "@/lib/actions/supplements"
import { SupplementsPortalSection } from "@/components/supplements/SupplementsPortalSection"
import { Pill } from "lucide-react"

export default async function SupplementsPage({ params }: { params: Promise<{ kod: string }> }) {
  const { kod } = await params
  const patient = await getPatientByCode(kod)
  if (!patient) notFound()

  const supplements = await getPatientSupplementsForPortal(patient.id)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-navy-100 flex items-center justify-center shrink-0">
          <Pill size={18} className="text-navy-600" />
        </div>
        <div>
          <h1 className="font-semibold text-gray-900">Suplementacja</h1>
          <p className="text-xs text-gray-400">Rekomendowane przez fizjoterapeutę</p>
        </div>
      </div>

      {supplements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
          <Pill size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Brak przepisanych suplementów</p>
          <p className="text-xs text-gray-300 mt-1">Fizjoterapeuta wkrótce doda rekomendacje</p>
        </div>
      ) : (
        <SupplementsPortalSection supplements={supplements} />
      )}
    </div>
  )
}
