import Link from "next/link"
import { MessageCircle } from "lucide-react"
import { getAllConversations } from "@/lib/actions/adherence"
import { createClient } from "@/lib/supabase/server"

export default async function KomunikacjaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const conversations = await getAllConversations()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Komunikacja</h1>

      {conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-navy-50 flex items-center justify-center mb-4">
            <MessageCircle size={28} className="text-navy-500" />
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">Brak wiadomości</h2>
          <p className="text-sm text-gray-500 max-w-sm">
            Wiadomości od pacjentów pojawią się tutaj.
          </p>
        </div>
      ) : (
        <div className="max-w-2xl space-y-1">
          {conversations.map(({ patient, lastMessage, unreadCount }) => (
            <Link
              key={patient.id}
              href={`/komunikacja/${patient.id}`}
              className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-navy-200 hover:shadow-sm transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center shrink-0">
                <span className="text-navy-700 font-semibold text-sm">
                  {patient.first_name[0]}{patient.last_name[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{patient.first_name} {patient.last_name}</p>
                {lastMessage ? (
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {lastMessage.sender_type === "practitioner" ? "Ty: " : ""}{lastMessage.content}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 mt-0.5">Brak wiadomości</p>
                )}
              </div>
              <div className="shrink-0 flex flex-col items-end gap-1">
                {lastMessage && (
                  <p className="text-xs text-gray-400">
                    {new Date(lastMessage.created_at).toLocaleDateString("pl-PL", { day: "numeric", month: "short" })}
                  </p>
                )}
                {unreadCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-navy-500 text-white text-xs font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
