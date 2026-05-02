import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getMessages, markMessagesRead } from "@/lib/actions/adherence"
import { getPatient } from "@/lib/actions/patients"
import { ChatWindow } from "@/components/chat/ChatWindow"

export default async function ChatPage({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [patient, messages] = await Promise.all([
    getPatient(patientId),
    getMessages(patientId),
  ])

  if (!patient) notFound()

  await markMessagesRead(patientId)

  return (
    <ChatWindow
      patientId={patientId}
      practitionerId={user.id}
      patientName={`${patient.first_name} ${patient.last_name}`}
      initialMessages={messages}
    />
  )
}
