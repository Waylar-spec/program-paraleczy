import { notFound } from "next/navigation"
import { getPatientByCode, getPatientPrograms, getTodayLogs } from "@/lib/actions/patient-portal"
import { PatientProgramView } from "@/components/patient/PatientProgramView"

export default async function PatientProgramPage({
  params,
}: {
  params: Promise<{ kod: string; programId: string }>
}) {
  const { kod, programId } = await params
  const patient = await getPatientByCode(kod)
  if (!patient) notFound()

  const programs = await getPatientPrograms(patient.id)
  const program = programs.find((p) => p.id === programId)
  if (!program) notFound()

  const doneTodayIds = await getTodayLogs(patient.id, programId)

  const items = [...(program.patient_program_items ?? [])].sort((a, b) => a.order - b.order)

  return (
    <PatientProgramView
      program={{ ...program, patient_program_items: items }}
      patientId={patient.id}
      patientName={patient.first_name}
      kod={kod}
      doneTodayIds={doneTodayIds}
    />
  )
}
