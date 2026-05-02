import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getPatient } from "@/lib/actions/patients"
import { getTemplates } from "@/lib/actions/templates"
import { getProtocols, getPatientProtocols } from "@/lib/actions/protocols"
import { getPatientAdherence } from "@/lib/actions/adherence"
import { getSurveys, getPatientSurveys, getPatientSurveyResponses } from "@/lib/actions/surveys"
import { AssignProgramModal } from "@/components/patients/AssignProgramModal"
import { AssignProtocolModal } from "@/components/protocols/AssignProtocolModal"
import { PatientProtocolCard } from "@/components/protocols/PatientProtocolCard"
import { AdherenceSection } from "@/components/patients/AdherenceSection"
import { PatientProgramsSection } from "@/components/patients/PatientProgramsSection"
import { PatientArchiveButton } from "@/components/patients/PatientArchiveButton"
import { EditPatientModal } from "@/components/patients/EditPatientModal"
import { CopyPatientLink } from "@/components/patients/CopyPatientLink"
import { AssignSurveyModal } from "@/components/surveys/AssignSurveyModal"
import { PatientSurveysSection } from "@/components/surveys/PatientSurveysSection"

export default async function PatientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [patient, templates, protocols, patientProtocols, adherence, surveys, patientSurveys, surveyResponses] = await Promise.all([
    getPatient(id),
    getTemplates(),
    getProtocols(),
    getPatientProtocols(id),
    getPatientAdherence(id),
    getSurveys(),
    getPatientSurveys(id),
    getPatientSurveyResponses(id),
  ])

  if (!patient) notFound()

  const fullName = `${patient.first_name} ${patient.last_name}`

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/pacjenci"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft size={14} />
        Wszyscy pacjenci
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {fullName}
            {patient.birth_year && (
              <span className="text-gray-400 font-normal ml-2">({patient.birth_year})</span>
            )}
          </h1>
          {patient.last_seen_at ? (
            <p className="text-sm text-gray-500 mt-1">
              Ostatnio widziany: {new Date(patient.last_seen_at).toLocaleDateString("pl-PL")}
            </p>
          ) : (
            <p className="text-sm text-gray-400 mt-1">Jeszcze nie otwierał aplikacji</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <AssignProgramModal patientId={id} templates={templates} />
          <EditPatientModal patient={patient} />
          <PatientArchiveButton patientId={id} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main */}
        <div className="col-span-2 space-y-4">
          {/* Protokoły rehabilitacyjne */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Protokoły rehabilitacyjne</h2>
              <AssignProtocolModal patientId={id} protocols={protocols} />
            </div>
            {patientProtocols.length > 0 ? (
              <div className="space-y-3">
                {patientProtocols.map((pp) => (
                  <PatientProtocolCard key={pp.id} patientProtocol={pp} patientId={id} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">Brak przypisanych protokołów</p>
              </div>
            )}
          </div>

          {/* Programy ćwiczeń */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Programy ćwiczeń</h2>
              <AssignProgramModal patientId={id} templates={templates} />
            </div>

            <PatientProgramsSection
              programs={patient.patient_programs ?? []}
              patientId={id}
            />
          </div>

          {/* Adherence */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Zaangażowanie pacjenta</h2>
            <AdherenceSection data={adherence} />
          </div>

          {/* Kwestionariusze */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Kwestionariusze</h2>
              <AssignSurveyModal
                patientId={id}
                surveys={surveys}
                programs={(patient.patient_programs ?? []).map((p: { id: string; name: string }) => ({ id: p.id, name: p.name }))}
              />
            </div>
            <PatientSurveysSection
              assignments={patientSurveys}
              responses={surveyResponses}
            />
          </div>
        </div>

        {/* Sidebar — dane pacjenta */}
        <div className="space-y-4">
          {/* Dostęp */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Dostęp pacjenta</h3>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-500 mb-1">Kod dostępu</p>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono font-semibold tracking-widest text-navy-600 bg-navy-50 px-3 py-1.5 rounded-lg">
                    {patient.access_code}
                  </code>
                  <CopyPatientLink accessCode={patient.access_code} />
                </div>
              </div>
            </div>
          </div>

          {/* Dane kontaktowe */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Dane kontaktowe</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">E-mail</span>
                <span className="text-gray-900">{patient.email || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Telefon</span>
                <span className="text-gray-900">{patient.phone || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Rok ur.</span>
                <span className="text-gray-900">{patient.birth_year || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Płeć</span>
                <span className="text-gray-900">
                  {patient.gender === "male" ? "Mężczyzna" : patient.gender === "female" ? "Kobieta" : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Notatki */}
          {patient.notes && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Notatki</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{patient.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
