"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Archive, ArchiveRestore, Trash2, MessageCircle } from "lucide-react"
import { archiveConversation, unarchiveConversation, deleteConversation } from "@/lib/actions/adherence"
import { toast } from "sonner"

type Conversation = {
  patient: { id: string; first_name: string; last_name: string }
  lastMessage: { content: string; sender_type: string; created_at: string } | null
  unreadCount: number
}

interface Props {
  active: Conversation[]
  archived: Conversation[]
}

export function ConversationList({ active, archived }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<"active" | "archived">("active")
  const [pending, startTransition] = useTransition()

  const conversations = tab === "active" ? active : archived

  function handleArchive(patientId: string, name: string) {
    startTransition(async () => {
      try {
        await archiveConversation(patientId)
        toast.success(`Rozmowa z ${name} zarchiwizowana`)
        router.refresh()
      } catch {
        toast.error("Nie udało się zarchiwizować")
      }
    })
  }

  function handleUnarchive(patientId: string, name: string) {
    startTransition(async () => {
      try {
        await unarchiveConversation(patientId)
        toast.success(`Rozmowa z ${name} przywrócona`)
        router.refresh()
      } catch {
        toast.error("Nie udało się przywrócić rozmowy")
      }
    })
  }

  function handleDelete(patientId: string, name: string) {
    if (!confirm(`Usunąć całą historię rozmowy z ${name}? Tej operacji nie można cofnąć.`)) return
    startTransition(async () => {
      try {
        await deleteConversation(patientId)
        toast.success("Historia rozmowy usunięta")
        router.refresh()
      } catch {
        toast.error("Nie udało się usunąć rozmowy")
      }
    })
  }

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        <button
          onClick={() => setTab("active")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            tab === "active"
              ? "border-navy-500 text-navy-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Aktywne
          {active.length > 0 && (
            <span className="ml-2 text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
              {active.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("archived")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            tab === "archived"
              ? "border-navy-500 text-navy-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Zarchiwizowane
          {archived.length > 0 && (
            <span className="ml-2 text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
              {archived.length}
            </span>
          )}
        </button>
      </div>

      {/* List */}
      {conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            {tab === "archived"
              ? <Archive size={22} className="text-gray-400" />
              : <MessageCircle size={22} className="text-gray-400" />}
          </div>
          <p className="text-sm text-gray-500">
            {tab === "archived" ? "Brak zarchiwizowanych rozmów" : "Brak aktywnych wiadomości"}
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {conversations.map(({ patient, lastMessage, unreadCount }) => {
            const name = `${patient.first_name} ${patient.last_name}`
            return (
              <div key={patient.id} className="group relative flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-navy-200 hover:shadow-sm transition-all">
                {/* Clickable area */}
                <Link
                  href={`/komunikacja/${patient.id}`}
                  className="absolute inset-0 rounded-xl"
                  aria-label={`Otwórz rozmowę z ${name}`}
                />

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center shrink-0 relative z-10 pointer-events-none">
                  <span className="text-navy-700 font-semibold text-sm">
                    {patient.first_name[0]}{patient.last_name[0]}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 relative z-10 pointer-events-none">
                  <p className="text-sm font-semibold text-gray-900">{name}</p>
                  {lastMessage ? (
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {lastMessage.sender_type === "practitioner" ? "Ty: " : ""}{lastMessage.content}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-0.5">Brak wiadomości</p>
                  )}
                </div>

                {/* Right side: date + unread + actions */}
                <div className="shrink-0 flex flex-col items-end gap-1 relative z-10">
                  {/* Date — visible by default, hidden when actions appear */}
                  <div className="flex items-center gap-1.5 group-hover:hidden">
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

                  {/* Action buttons — appear on hover */}
                  <div className="hidden group-hover:flex items-center gap-1">
                    {tab === "active" ? (
                      <button
                        onClick={(e) => { e.preventDefault(); handleArchive(patient.id, name) }}
                        disabled={pending}
                        title="Archiwizuj rozmowę"
                        className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50 transition-colors"
                      >
                        <Archive size={14} />
                      </button>
                    ) : (
                      <button
                        onClick={(e) => { e.preventDefault(); handleUnarchive(patient.id, name) }}
                        disabled={pending}
                        title="Przywróć rozmowę"
                        className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-colors"
                      >
                        <ArchiveRestore size={14} />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.preventDefault(); handleDelete(patient.id, name) }}
                      disabled={pending}
                      title="Usuń historię rozmowy"
                      className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
