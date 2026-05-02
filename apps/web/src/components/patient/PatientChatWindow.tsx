"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { ArrowLeft, Send } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { sendPatientMessage } from "@/lib/actions/patient-chat"
import { toast } from "sonner"

type Message = {
  id: string
  sender_type: string
  content: string
  read_at: string | null
  created_at: string
}

interface Props {
  patientId: string
  patientName: string
  kod: string
  initialMessages: Message[]
}

export function PatientChatWindow({ patientId, patientName, kod, initialMessages }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`patient-chat:${patientId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `patient_id=eq.${patientId}`,
        },
        (payload) => {
          const msg = payload.new as Message
          setMessages((prev) =>
            prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
          )
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [patientId])

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setSending(true)
    setText("")
    try {
      const msg = await sendPatientMessage(patientId, trimmed)
      setMessages((prev) => [...prev, msg])
    } catch {
      toast.error("Błąd wysyłania")
      setText(trimmed)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  function formatTime(iso: string) {
    const d = new Date(iso)
    const today = new Date().toDateString()
    if (d.toDateString() === today)
      return d.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })
    return d.toLocaleDateString("pl-PL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 bg-white border-b border-gray-200 shrink-0">
        <Link href={`/p/${kod}`} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft size={16} />
        </Link>
        <div className="w-9 h-9 rounded-full bg-navy-100 flex items-center justify-center shrink-0">
          <span className="text-navy-700 font-semibold text-sm">FT</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">Fizjoterapeuta</p>
          <p className="text-xs text-gray-400">Wiadomości</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            Możesz napisać wiadomość do swojego fizjoterapeuty.
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender_type === "patient"
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-xs flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}>
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMe
                    ? "bg-navy-500 text-white rounded-br-md"
                    : "bg-white text-gray-900 border border-gray-200 rounded-bl-md"
                }`}>
                  {msg.content}
                </div>
                <span className="text-xs text-gray-400 px-1">{formatTime(msg.created_at)}</span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-center gap-3 px-4 py-4 bg-white border-t border-gray-200 shrink-0">
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Napisz wiadomość..."
          className="flex-1 h-10 px-4 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-navy-400 bg-gray-50"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() }
          }}
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="w-10 h-10 rounded-xl bg-navy-500 hover:bg-navy-600 disabled:opacity-40 text-white flex items-center justify-center transition-colors shrink-0"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
