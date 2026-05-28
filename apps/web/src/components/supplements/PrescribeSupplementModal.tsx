"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, ShoppingCart } from "lucide-react"
import { prescribeSupplement } from "@/lib/actions/supplements"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import type { Supplement } from "@/lib/actions/supplements"

interface Props {
  patientId: string
  supplements: Supplement[]
  prescribedIds: string[]
}

export function PrescribeSupplementModal({ patientId, supplements, prescribedIds }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  // multi-select: map of id → note
  const [selected, setSelected] = useState<Record<string, string>>({})

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return supplements.filter((s) => {
      if (q && !s.name.toLowerCase().includes(q) && !(s.product_type ?? "").toLowerCase().includes(q)) return false
      return true
    })
  }, [supplements, search])

  function toggle(id: string) {
    setSelected((prev) => {
      if (id in prev) {
        const next = { ...prev }
        delete next[id]
        return next
      }
      return { ...prev, [id]: "" }
    })
  }

  function setNote(id: string, note: string) {
    setSelected((prev) => ({ ...prev, [id]: note }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const ids = Object.keys(selected)
    if (ids.length === 0) return
    setLoading(true)
    try {
      await Promise.all(ids.map((id) => prescribeSupplement(patientId, id, selected[id] || undefined)))
      toast.success(`Przepisano ${ids.length} ${ids.length === 1 ? "suplement" : ids.length < 5 ? "suplementy" : "suplementów"}`)
      setOpen(false)
      setSelected({})
      setSearch("")
      router.refresh()
    } catch {
      toast.error("Nie udało się przepisać suplementów")
    } finally {
      setLoading(false)
    }
  }

  const selectedIds = Object.keys(selected)

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setSelected({}); setSearch("") } }}>
      <DialogTrigger className="h-8 px-3 rounded-lg bg-navy-500 hover:bg-navy-600 text-white text-xs font-medium flex items-center gap-1.5 transition-colors">
        <Plus size={13} />
        Przepisz suplement
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Przepisz suplementy</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Szukaj suplementu..."
              className="w-full pl-9 pr-3 h-9 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-navy-300"
            />
          </div>

          {/* List */}
          <div className="max-h-64 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">Brak wyników</div>
            ) : (
              filtered.map((s) => {
                const alreadyPrescribed = prescribedIds.includes(s.id)
                const isSelected = s.id in selected
                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={alreadyPrescribed}
                    onClick={() => !alreadyPrescribed && toggle(s.id)}
                    className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${
                      isSelected
                        ? "bg-navy-50"
                        : alreadyPrescribed
                        ? "bg-gray-50 opacity-50 cursor-not-allowed"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-gray-100">
                      {s.image_url ? (
                        <img src={s.image_url} alt={s.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingCart size={14} className="text-gray-300" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{s.name}</p>
                      <p className="text-xs text-gray-400">
                        {s.product_type ?? "Suplement"}
                        {s.price !== null && ` · ${s.price.toFixed(2)} zł`}
                        {alreadyPrescribed && " · już przepisany"}
                      </p>
                    </div>

                    {/* Checkbox */}
                    <div className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      isSelected ? "bg-navy-500 border-navy-500" : "border-gray-300"
                    }`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Notes per selected item */}
          {selectedIds.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Notatki (opcjonalnie)</p>
              {selectedIds.map((id) => {
                const s = supplements.find((x) => x.id === id)
                if (!s) return null
                return (
                  <div key={id} className="flex items-center gap-2">
                    <div className="shrink-0 w-7 h-7 rounded overflow-hidden bg-gray-100">
                      {s.image_url
                        ? <img src={s.image_url} alt={s.name} className="w-full h-full object-cover" />
                        : <ShoppingCart size={12} className="text-gray-300 m-auto" />}
                    </div>
                    <span className="text-xs text-gray-700 w-28 truncate shrink-0">{s.name}</span>
                    <input
                      type="text"
                      value={selected[id]}
                      onChange={(e) => setNote(id, e.target.value)}
                      placeholder="np. Rano z posiłkiem"
                      className="flex-1 h-7 px-2 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-navy-300"
                    />
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-gray-400">
              {selectedIds.length > 0 ? `Wybrano: ${selectedIds.length}` : "Wybierz suplementy"}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-9 px-4 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Anuluj
              </button>
              <button
                type="submit"
                disabled={loading || selectedIds.length === 0}
                className="h-9 px-4 rounded-lg bg-navy-500 hover:bg-navy-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
              >
                {loading ? "Przepisuję..." : `Przepisz${selectedIds.length > 1 ? ` (${selectedIds.length})` : ""}`}
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
