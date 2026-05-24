import { notFound } from "next/navigation"
import { getPatientByCode, getPatientPrograms, getTodayLogs, getPatientProtocolsForPortal } from "@/lib/actions/patient-portal"
import { PatientProgramView } from "@/components/patient/PatientProgramView"

export default async function PatientProgramPage({
  params,
}: {
  params: Promise<{ kod: string; programId: string }>
}) {
  const { kod, programId } = await params
  const patient = await getPatientByCode(kod)
  if (!patient) notFound()

  const [programs, patientProtocols] = await Promise.all([
    getPatientPrograms(patient.id),
    getPatientProtocolsForPortal(patient.id),
  ])

  const program = programs.find((p) => p.id === programId)
  if (!program) notFound()

  const doneTodayIds = await getTodayLogs(patient.id, programId)
  const items = [...(program.patient_program_items ?? [])].sort((a, b) => a.order - b.order)

  // Find the protocol phase linked to this program
  const programTemplateId = (program as any).template_id
  let phaseInfo: {
    name: string
    description: string | null
    goals: string | null
    patient_intro: string | null
    rules: string | null
    duration_weeks: number
    protocolName: string
  } | null = null

  if (programTemplateId) {
    for (const pp of patientProtocols) {
      const phase = pp.phases.find((ph: any) => ph.template_id === programTemplateId) as any
      if (phase) {
        phaseInfo = {
          name: phase.name,
          description: phase.description ?? null,
          goals: phase.goals ?? null,
          patient_intro: phase.patient_intro ?? null,
          rules: phase.rules ?? null,
          duration_weeks: phase.duration_weeks,
          protocolName: (pp.protocol as any)?.name ?? "",
        }
        break
      }
    }
  }

  return (
    <PatientProgramView
      program={{ ...program, patient_program_items: items }}
      patientId={patient.id}
      patientName={patient.first_name}
      kod={kod}
      doneTodayIds={doneTodayIds}
      phaseInfo={phaseInfo}
    />
  )
}
