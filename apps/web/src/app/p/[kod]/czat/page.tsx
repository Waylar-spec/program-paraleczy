import { notFound } from "next/navigation"
import { getPatientByCode } from "@/lib/actions/patient-portal"
import { getPatientMessages } from "@/lib/actions/patient-chat"
import { PatientChatWindow } from "@/components/patient/PatientChatWindow"

export default async function PatientChatPage({ params }: { params: Promise<{ kod: string }> }) {
  const { kod } = await params
  const patient = await getPatientByCode(kod)
  if (!patient) notFound()

  const messages = await getPatientMessages(patient.id)

  return (
    <PatientChatWindow
      patientId={patient.id}
      patientName={patient.first_name}
      kod={kod}
      initialMessages={messages}
    />
  )
}
