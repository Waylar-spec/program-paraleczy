import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { CheckCircle2, Clock, Dumbbell } from "lucide-react"
import { getPatientByCode, getPatientPrograms, getTodayLogs, getPatientProtocolsForPortal } from "@/lib/actions/patient-portal"
import { getPatientSurveysForPortal } from "@/lib/actions/surveys"
import { SurveyPopup } from "@/components/patient/SurveyPopup"
import { ProtocolJourney } from "@/components/patient/ProtocolJourney"

export default async function PatientDashboard({ params }: { params: Promise<{ kod: string }> }) {
  const { kod } = await params
  const patient = await getPatientByCode(kod)
  if (!patient) notFound()

  const [programs, allSurveys, patientProtocols] = await Promise.all([
    getPatientPrograms(patient.id),
    getPatientSurveysForPortal(patient.id),
    getPatientProtocolsForPortal(patient.id),
  ])
  // Collect all template_ids used by protocol phases so we can hide those programs from the standalone list
  const protocolTemplateIds = new Set(
    patientProtocols.flatMap((pp) => pp.phases.map((ph: any) => ph.template_id).filter(Boolean))
  )

  const active = programs.filter(
    (p) => p.status === "active" && !protocolTemplateIds.has((p as any).template_id)
  )
  const completed = programs.filter(
    (p) => p.status !== "active" && !protocolTemplateIds.has((p as any).template_id)
  )

  // Surveys that are pending: on_start never filled, or weekly not filled this week
  const today = new Date()
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  const pendingSurveys = allSurveys
    .filter((s) => {
      if (s.schedule === "on_start" && !s.last_response_at) return true
      if (s.schedule === "weekly") {
        if (!s.last_response_at) return true
        return new Date(s.last_response_at) < weekAgo
      }
      return false
    })
    .map((s) => ({
      id: s.id,
      surveyName: s.surveys.name,
      programName: s.program_name,
      schedule: s.schedule,
    }))

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <SurveyPopup pending={pendingSurveys} kod={kod} />

      {/* Header */}
      <div className="flex items-center gap-3">
        <Image src="/logo.png" alt="Para Leczy" width={40} height={40} className="rounded-xl shrink-0" />
        <div className="flex-1">
          <h1 className="font-semibold text-gray-900">Cześć, {patient.first_name}!</h1>
          <p className="text-xs text-gray-500">Twoje programy ćwiczeń</p>
        </div>
      </div>

      {/* Protocol journey */}
      {patientProtocols.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Twoja droga rehabilitacji
          </h2>
          <ProtocolJourney protocols={patientProtocols} kod={kod} />
        </div>
      )}

      {/* Active programs */}
      {active.length === 0 && patientProtocols.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <Dumbbell size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Brak aktywnych programów</p>
          <p className="text-xs text-gray-400 mt-1">Fizjoterapeuta wkrótce przypisze Ci ćwiczenia</p>
        </div>
      ) : active.length > 0 ? (
        <div>
          {patientProtocols.length === 0 && (
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Programy ćwiczeń
            </h2>
          )}
          <div className="space-y-3">
            {active.map((program) => (
              <ProgramCard key={program.id} program={program} patientId={patient.id} kod={kod} />
            ))}
          </div>
        </div>
      ) : null}

      {/* Completed */}
      {completed.length > 0 && (
        <div>
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Zakończone</h2>
          <div className="space-y-2">
            {completed.map((program) => (
              <div key={program.id} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center justify-between">
                <p className="text-sm text-gray-500">{program.name}</p>
                <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Zakończony</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

type Program = Awaited<ReturnType<typeof getPatientPrograms>>[0]

async function ProgramCard({ program, patientId, kod }: { program: Program; patientId: string; kod: string }) {
  const doneTodayIds = await getTodayLogs(patientId, program.id)
  const items = [...(program.patient_program_items ?? [])].sort((a, b) => a.order - b.order)
  const doneCount = items.filter((item) => doneTodayIds.includes(item.id)).length

  return (
    <Link href={`/p/${kod}/program/${program.id}`} className="block">
      <div className="bg-white rounded-2xl border border-gray-200 p-4 hover:border-navy-300 hover:shadow-sm transition-all">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="font-semibold text-gray-900 text-sm">{program.name}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {items.length} {items.length === 1 ? "ćwiczenie" : items.length < 5 ? "ćwiczenia" : "ćwiczeń"}
            </p>
          </div>
          {doneCount === items.length && items.length > 0 ? (
            <span className="text-xs bg-green-50 text-green-600 font-medium px-2 py-1 rounded-full flex items-center gap-1">
              <CheckCircle2 size={11} /> Dziś zrobione!
            </span>
          ) : doneCount > 0 ? (
            <span className="text-xs bg-yellow-50 text-yellow-600 font-medium px-2 py-1 rounded-full flex items-center gap-1">
              <Clock size={11} /> {doneCount}/{items.length}
            </span>
          ) : (
            <span className="text-xs bg-navy-50 text-navy-600 font-medium px-2 py-1 rounded-full">
              Do zrobienia
            </span>
          )}
        </div>

        {/* Exercise thumbnails */}
        <div className="flex gap-2 overflow-x-auto">
          {items.slice(0, 5).map((item) => {
            const done = doneTodayIds.includes(item.id)
            const ex = Array.isArray(item.exercises) ? item.exercises[0] : item.exercises
            return (
              <div key={item.id} className={`shrink-0 relative w-14 h-14 rounded-lg overflow-hidden border-2 ${done ? "border-green-400" : "border-gray-100"}`}>
                {ex?.thumbnail_url ? (
                  <img src={ex.thumbnail_url} alt={ex.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <Dumbbell size={16} className="text-gray-300" />
                  </div>
                )}
                {done && (
                  <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                    <CheckCircle2 size={16} className="text-green-600" />
                  </div>
                )}
              </div>
            )
          })}
          {items.length > 5 && (
            <div className="shrink-0 w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center">
              <span className="text-xs text-gray-400 font-medium">+{items.length - 5}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
