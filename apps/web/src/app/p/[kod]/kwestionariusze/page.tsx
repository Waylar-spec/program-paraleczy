import { notFound } from "next/navigation"
import Link from "next/link"
import { ClipboardList, CheckCircle2, Clock, ChevronRight } from "lucide-react"
import { getPatientByCode } from "@/lib/actions/patient-portal"
import { getPatientSurveysForPortal } from "@/lib/actions/surveys"

const SCHEDULE_LABELS: Record<string, string> = {
  on_start: "Na początku programu",
  on_end: "Na końcu programu",
  weekly: "Co tydzień",
  custom: "Indywidualnie",
}

export default async function PatientSurveysPage({
  params,
}: {
  params: Promise<{ kod: string }>
}) {
  const { kod } = await params
  const patient = await getPatientByCode(kod)
  if (!patient) notFound()

  const assignments = await getPatientSurveysForPortal(patient.id)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Kwestionariusze</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Wypełnij kwestionariusze zlecone przez fizjoterapeutę
        </p>
      </div>

      {assignments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <ClipboardList size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Brak przypisanych kwestionariuszy</p>
          <p className="text-xs text-gray-400 mt-1">
            Fizjoterapeuta wkrótce przypisze Ci kwestionariusze do wypełnienia
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((assignment) => {
            const lastFilled = assignment.last_response_at
              ? new Date(assignment.last_response_at).toLocaleDateString("pl-PL", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : null

            return (
              <Link
                key={assignment.id}
                href={`/p/${kod}/kwestionariusze/${assignment.id}`}
                className="block bg-white rounded-2xl border border-gray-200 p-4 hover:border-navy-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-navy-50 flex items-center justify-center shrink-0">
                    <ClipboardList size={20} className="text-navy-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{assignment.surveys.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {SCHEDULE_LABELS[assignment.schedule] ?? assignment.schedule}
                      {" · "}
                      {assignment.program_name}
                    </p>
                    {lastFilled ? (
                      <div className="flex items-center gap-1 mt-1.5">
                        <CheckCircle2 size={12} className="text-green-500" />
                        <span className="text-xs text-green-600">Ostatnio: {lastFilled}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 mt-1.5">
                        <Clock size={12} className="text-amber-400" />
                        <span className="text-xs text-amber-500">Do wypełnienia</span>
                      </div>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-gray-300 shrink-0" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
