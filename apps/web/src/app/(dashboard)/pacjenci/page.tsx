import Link from "next/link"
import { Users } from "lucide-react"
import { getPatients } from "@/lib/actions/patients"
import { NewPatientModal } from "@/components/patients/NewPatientModal"
import { PatientsList } from "@/components/patients/PatientsList"

export default async function PacjenciPage({
  searchParams,
}: {
  searchParams: Promise<{ archiwum?: string }>
}) {
  const { archiwum } = await searchParams
  const archived = archiwum === "1"
  const patients = await getPatients(archived)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Pacjenci</h1>
          <p className="text-sm text-gray-500 mt-1">
            {patients.length > 0
              ? `${patients.length} ${patients.length === 1 ? "pacjent" : "pacjentów"}`
              : "Zarządzaj swoimi pacjentami i ich programami"}
          </p>
        </div>
        <NewPatientModal />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        <Link
          href="/pacjenci"
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            !archived
              ? "border-navy-500 text-navy-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Aktywni
        </Link>
        <Link
          href="/pacjenci?archiwum=1"
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            archived
              ? "border-navy-500 text-navy-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Archiwum
        </Link>
      </div>

      {/* List or empty state */}
      {patients.length > 0 ? (
        <PatientsList patients={patients} />
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-navy-50 flex items-center justify-center mb-4">
            <Users size={28} className="text-navy-500" />
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            {archived ? "Brak zarchiwizowanych pacjentów" : "Brak pacjentów"}
          </h2>
          <p className="text-sm text-gray-500 mb-6 max-w-sm">
            {archived
              ? "Zarchiwizowani pacjenci pojawią się tutaj."
              : "Dodaj pierwszego pacjenta i przypisz mu program ćwiczeń."}
          </p>
          {!archived && <NewPatientModal />}
        </div>
      )}
    </div>
  )
}
