"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, ShoppingCart, Trash2 } from "lucide-react"
import { addSupplementToProtocol, removeSupplementFromProtocol } from "@/lib/actions/protocols"
import { toast } from "sonner"

type SupplementOption = {
  id: string
  formeds_handle: string
  name: string
  product_type: string | null
  image_url: string | null
  price: number | null
}

type ProtocolSupplement = {
  id: string
  supplement_id: string
  notes: string | null
  supplements: SupplementOption | SupplementOption[] | null
}

interface Props {
  protocolId: string
  allSupplements: SupplementOption[]
  protocolSupplements: ProtocolSupplement[]
}

export function ProtocolSupplementsSection({ protocolId, allSupplements, protocolSupplements }: Props) {
  const router = useRouter()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [adding, setAdding] = useState<string | null>(null)

  const addedIds = new Set(protocolSupplements.map((ps) => ps.supplement_id))

  const filtered = useMemo(() => {
    if (!search.trim()) return allSupplements
    const q = search.toLowerCase()
    return allSupplements.filter((s) =>
      s.name.toLowerCase().includes(q) || (s.product_type ?? "").toLowerCase().includes(q)
    )
  }, [allSupplements, search])

  async function handleAdd(supplementId: string) {
    setAdding(supplementId)
    try {
      await addSupplementToProtocol(protocolId, supplementId)
      router.refresh()
    } catch {
      toast.error("Nie udało się dodać suplementu")
    } finally {
      setAdding(null)
    }
  }

  async function handleRemove(supplementId: string) {
    try {
      await removeSupplementFromProtocol(protocolId, supplementId)
      router.refresh()
    } catch {
      toast.error("Nie udało się usunąć suplementu")
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <ShoppingCart size={16} className="text-gray-400" />
            Suplementacja protokołu
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Automatycznie przepisywane pacjentowi przy przypisaniu protokołu
          </p>
        </div>
        <button
          onClick={() => setPickerOpen(!pickerOpen)}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-navy-500 hover:bg-navy-600 text-white text-xs font-medium transition-colors"
        >
          <Plus size={13} />
          Dodaj suplement
        </button>
      </div>

      {/* Added supplements */}
      {protocolSupplements.length > 0 && (
        <div className="space-y-2 mb-4">
          {protocolSupplements.map((ps) => {
            const s = Array.isArray(ps.supplements) ? ps.supplements[0] : ps.supplements
            if (!s) return null
            return (
              <div key={ps.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50">
                <div className="shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-white border border-gray-100">
                  {s.image_url
                    ? <img src={s.image_url} alt={s.name} className="w-full h-full object-cover" />
                    : <ShoppingCart size={14} className="text-gray-300 m-auto" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{s.name}</p>
                  <p className="text-xs text-gray-400">
                    {s.product_type ?? "Suplement"}
                    {s.price !== null && ` · ${s.price} zł`}
                  </p>
                </div>
                <button
                  onClick={() => handleRemove(ps.supplement_id)}
                  className="shrink-0 h-7 w-7 rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 flex items-center justify-center transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {protocolSupplements.length === 0 && !pickerOpen && (
        <div className="text-center py-6 text-gray-400">
          <ShoppingCart size={24} className="mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Brak suplementów — kliknij "Dodaj suplement"</p>
        </div>
      )}

      {/* Picker */}
      {pickerOpen && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Szukaj suplementu..."
                autoFocus
                className="w-full h-8 pl-9 pr-3 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-navy-300"
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Brak wyników</p>
            ) : filtered.map((s) => {
              const isAdded = addedIds.has(s.id)
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={isAdded || adding === s.id}
                  onClick={() => !isAdded && handleAdd(s.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                    isAdded ? "bg-navy-50 cursor-default" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="shrink-0 w-9 h-9 rounded-lg overflow-hidden bg-gray-100">
                    {s.image_url
                      ? <img src={s.image_url} alt={s.name} className="w-full h-full object-cover" />
                      : <ShoppingCart size={12} className="text-gray-300 m-auto" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{s.name}</p>
                    <p className="text-xs text-gray-400">
                      {s.product_type ?? "Suplement"}
                      {s.price !== null && ` · ${s.price} zł`}
                    </p>
                  </div>
                  {isAdded
                    ? <span className="text-xs text-navy-500 shrink-0 font-medium">✓ Dodany</span>
                    : <Plus size={15} className="text-gray-400 shrink-0" />}
                </button>
              )
            })}
          </div>
          <div className="p-2 border-t border-gray-100 flex justify-end">
            <button
              onClick={() => { setPickerOpen(false); setSearch("") }}
              className="h-7 px-3 rounded-lg text-xs text-gray-500 hover:bg-gray-100 transition-colors"
            >
              Zamknij
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
