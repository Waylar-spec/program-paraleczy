"use client"

import { useEffect, useRef, useState } from "react"
import { NotebookPen, X, Plus, Trash2, Loader2, Check } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { pl } from "date-fns/locale"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  getNotes,
  createNote,
  toggleNote,
  deleteNote,
  type PractitionerNote,
} from "@/lib/actions/notes"

const ARCHIVE_RETENTION_DAYS = 30

type Tab = "active" | "archived"

export function NotesWidget() {
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [notes, setNotes] = useState<PractitionerNote[]>([])
  const [tab, setTab] = useState<Tab>("active")
  const [text, setText] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load once on mount so the badge count is right even before the panel opens.
  useEffect(() => {
    getNotes()
      .then(setNotes)
      .finally(() => setLoaded(true))
  }, [])

  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  const active = notes.filter((n) => !n.completed_at)
  const archived = notes
    .filter((n) => n.completed_at)
    .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())

  async function handleAdd(e?: React.FormEvent) {
    e?.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || submitting) return
    setSubmitting(true)
    try {
      const note = await createNote(trimmed)
      setNotes((prev) => [note, ...prev])
      setText("")
      setTab("active")
      textareaRef.current?.focus()
    } catch {
      toast.error("Nie udało się zapisać notatki")
    } finally {
      setSubmitting(false)
    }
  }

  function handleTextareaKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleAdd()
    }
  }

  async function handleToggle(note: PractitionerNote) {
    const completing = !note.completed_at
    const prevValue = note.completed_at
    const nowIso = new Date().toISOString()
    setNotes((prev) =>
      prev.map((n) => (n.id === note.id ? { ...n, completed_at: completing ? nowIso : null } : n))
    )
    try {
      await toggleNote(note.id, completing)
    } catch {
      toast.error("Nie udało się zaktualizować notatki")
      setNotes((prev) => prev.map((n) => (n.id === note.id ? { ...n, completed_at: prevValue } : n)))
    }
  }

  async function handleDelete(id: string) {
    const prev = notes
    setNotes((cur) => cur.filter((n) => n.id !== id))
    try {
      await deleteNote(id)
    } catch {
      toast.error("Nie udało się usunąć notatki")
      setNotes(prev)
    }
  }

  function daysLeft(completedAt: string) {
    const expiresAt = new Date(completedAt).getTime() + ARCHIVE_RETENTION_DAYS * 24 * 60 * 60 * 1000
    return Math.max(0, Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000)))
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div
          ref={panelRef}
          className="absolute bottom-full right-0 mb-3 w-80 sm:w-96 bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden flex flex-col max-h-[32rem]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
            <p className="text-sm font-semibold text-gray-900">Notatnik</p>
            <button
              onClick={() => setOpen(false)}
              className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* Quick add */}
          <form onSubmit={handleAdd} className="px-4 py-3 border-b border-gray-100 shrink-0">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleTextareaKeyDown}
              placeholder='Dodaj notatkę… np. "Zadzwonić do Kowalskiego ws. suplementów"'
              rows={2}
              maxLength={2000}
              className="w-full resize-none text-sm text-gray-800 placeholder:text-gray-400 outline-none"
            />
            <div className="flex justify-end mt-1.5">
              <button
                type="submit"
                disabled={!text.trim() || submitting}
                className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg bg-navy-500 hover:bg-navy-600 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-medium transition-colors"
              >
                {submitting ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                Dodaj
              </button>
            </div>
          </form>

          {/* Tabs */}
          <div className="flex items-center gap-1 px-4 pt-2.5 shrink-0">
            <button
              onClick={() => setTab("active")}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                tab === "active" ? "bg-navy-50 text-navy-600" : "text-gray-500 hover:text-gray-800"
              )}
            >
              Do zrobienia{active.length > 0 ? ` (${active.length})` : ""}
            </button>
            <button
              onClick={() => setTab("archived")}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                tab === "archived" ? "bg-navy-50 text-navy-600" : "text-gray-500 hover:text-gray-800"
              )}
            >
              Zarchiwizowane{archived.length > 0 ? ` (${archived.length})` : ""}
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-2 py-2 min-h-32">
            {!loaded ? (
              <div className="flex items-center justify-center h-24 text-gray-300">
                <Loader2 size={18} className="animate-spin" />
              </div>
            ) : tab === "active" ? (
              active.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">Brak notatek — dodaj pierwszą powyżej.</p>
              ) : (
                active.map((note) => (
                  <div key={note.id} className="group flex items-start gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-50">
                    <button
                      onClick={() => handleToggle(note)}
                      title="Oznacz jako zrobione"
                      className="mt-0.5 w-4 h-4 rounded-full border-2 border-gray-300 hover:border-navy-500 shrink-0 transition-colors"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">{note.content}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {formatDistanceToNow(new Date(note.created_at), { addSuffix: true, locale: pl })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(note.id)}
                      title="Usuń"
                      className="mt-0.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )
            ) : archived.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">Brak zarchiwizowanych notatek.</p>
            ) : (
              archived.map((note) => (
                <div key={note.id} className="group flex items-start gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-50">
                  <button
                    onClick={() => handleToggle(note)}
                    title="Przywróć"
                    className="mt-0.5 w-4 h-4 rounded-full bg-navy-500 border-2 border-navy-500 shrink-0 flex items-center justify-center transition-colors"
                  >
                    <Check size={10} strokeWidth={3} className="text-white" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-400 line-through whitespace-pre-wrap break-words">{note.content}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Zniknie za {daysLeft(note.completed_at!)} {daysLeft(note.completed_at!) === 1 ? "dzień" : "dni"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(note.id)}
                    title="Usuń"
                    className="mt-0.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen((v) => !v)}
        title="Notatnik"
        className="relative w-12 h-12 rounded-full bg-navy-500 hover:bg-navy-600 text-white shadow-lg flex items-center justify-center transition-colors"
      >
        <NotebookPen size={20} />
        {loaded && active.length > 0 && !open && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full min-w-[18px] h-[18px] px-1 text-[10px] font-bold flex items-center justify-center leading-none">
            {active.length}
          </span>
        )}
      </button>
    </div>
  )
}
