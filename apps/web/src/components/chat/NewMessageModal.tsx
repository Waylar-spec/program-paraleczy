"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Send, Search, MessageCirclePlus, X } from "lucide-react"
import { sendMessage } from "@/lib/actions/adherence"
import { toast } from "sonner"

type Patient = { id: string; first_name: string; last_name: string }

interface Props {
  patients: Patient[]
}

export function NewMessageModal({ patients }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Patient | null>(null)
  const [content, setContent] = useState("")
  const [sending, setSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return patients.slice(0, 8)
    return patients.filter(
      (p) =>
        p.first_name.toLowerCase().includes(q) ||
        p.last_name.toLowerCase().includes(q)
    ).slice(0, 8)
  }, [patients, search])

  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50)
    } else {
      setSearch("")
      setSelected(null)
      setContent("")
    }
  }, [open])

  useEffect(() => {
    if (selected) {
      setTimeout(() => textareaRef.current?.focus(), 50)
    }
  }, [selected])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!selected || !content.trim()) return
    setSending(true)
    try {
      await sendMessage(selected.id, content.trim())
      toast.success(`Wiadomość do ${selected.first_name} ${selected.last_name} wysłana`)
      setOpen(false)
      router.push(`/komunikacja/${selected.id}`)
      router.refresh()
    } catch {
      toast.error("Nie udało się wysłać wiadomości")
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-navy-500 hover:bg-navy-600 text-white text-sm font-medium transition-colors"
      >
        <MessageCirclePlus size={15} />
        Nowa wiadomość
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Nowa wiadomość</h2>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={16} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSend} className="p-5 space-y-4">
              {/* Patient search */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700">Do:</label>
                {selected ? (
                  <div className="flex items-center gap-2 h-9 px-3 rounded-lg border border-navy-300 bg-navy-50">
                    <div className="w-5 h-5 rounded-full bg-navy-200 flex items-center justify-center shrink-0">
                      <span className="text-navy-700 font-bold text-xs leading-none">
                        {selected.first_name[0]}{selected.last_name[0]}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-navy-800 flex-1">
                      {selected.first_name} {selected.last_name}
                    </span>
                    <button
                      type="button"
                      onClick={() => { setSelected(null); setSearch(""); setTimeout(() => searchRef.current?.focus(), 50) }}
                      className="text-navy-400 hover:text-navy-700 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        ref={searchRef}
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Szukaj pacjenta..."
                        className="w-full pl-9 pr-3 h-9 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-navy-300"
                      />
                    </div>
                    {filtered.length > 0 && (
                      <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50 shadow-sm">
                        {filtered.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setSelected(p)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
                          >
                            <div className="w-7 h-7 rounded-full bg-navy-100 flex items-center justify-center shrink-0">
                              <span className="text-navy-700 font-semibold text-xs">
                                {p.first_name[0]}{p.last_name[0]}
                              </span>
                            </div>
                            <span className="text-sm text-gray-900">
                              {p.first_name} {p.last_name}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    {search.trim() && filtered.length === 0 && (
                      <p className="text-xs text-gray-400 px-1 py-2">Brak wyników</p>
                    )}
                  </div>
                )}
              </div>

              {/* Message */}
              {selected && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-700">Wiadomość:</label>
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e as any) }
                    }}
                    placeholder="Napisz wiadomość..."
                    rows={4}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-navy-300 resize-none"
                  />
                  <p className="text-xs text-gray-400">Enter — wyślij · Shift+Enter — nowa linia</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="h-9 px-4 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={!selected || !content.trim() || sending}
                  className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-navy-500 hover:bg-navy-600 disabled:opacity-40 text-white text-sm font-medium transition-colors"
                >
                  <Send size={13} />
                  {sending ? "Wysyłanie..." : "Wyślij"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
