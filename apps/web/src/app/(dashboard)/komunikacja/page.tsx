import { getAllConversations } from "@/lib/actions/adherence"
import { getPatientsList } from "@/lib/actions/patients"
import { ConversationList } from "@/components/chat/ConversationList"
import { NewMessageModal } from "@/components/chat/NewMessageModal"

export default async function KomunikacjaPage() {
  const [active, archived, patients] = await Promise.all([
    getAllConversations(false),
    getAllConversations(true),
    getPatientsList(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Komunikacja</h1>
        <NewMessageModal patients={patients} />
      </div>
      <ConversationList active={active} archived={archived} />
    </div>
  )
}
