"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Search, ExternalLink, ShoppingCart, CheckSquare, Square, X, Plus } from "lucide-react"
import { useState, useCallback } from "react"
import { useProgramBuilder } from "@/store/programBuilder"
import type { Supplement } from "@/lib/actions/supplements"

const AFFILIATE_SUFFIX = "?sca_ref=11220768.wIBh3GWahK"

interface Props {
  supplements: Supplement[]
  types: string[]
  currentType?: string
  currentSearch?: string
}

export function SupplementsGrid({ supplements, types, currentType, currentSearch }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const { addSupplements, hasSupplement, open } = useProgramBuilder()

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value)
        else params.delete(key)
      }
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  function toggleCheck(id: string) {
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function clearSelection() {
    setCheckedIds(new Set())
  }

  function handleAddToEditor() {
    const selected = supplements.filter((s) => checkedIds.has(s.id))
    addSupplements(
      selected.map((s) => ({
        supplementId: s.id,
        name: s.name,
        imageUrl: s.image_url,
        price: s.price,
        formedsHandle: s.formeds_handle,
        notes: "",
      }))
    )
    clearSelection()
    open()
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            defaultValue={currentSearch}
            placeholder="Szukaj suplementu..."
            onChange={(e) => updateParams({ q: e.target.value || undefined })}
            className="w-full pl-9 pr-3 h-9 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-navy-300 bg-white"
          />
        </div>
        <select
          value={currentType ?? ""}
          onChange={(e) => updateParams({ type: e.target.value || undefined })}
          className="h-9 px-3 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-navy-300 bg-white"
        >
          <option value="">Wszystkie kategorie</option>
          {types.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Bulk add to editor bar */}
      {checkedIds.size > 0 && (
        <div className="flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-xl px-4 py-3">
          <span className="text-sm font-medium text-teal-700">
            Wybrano: {checkedIds.size} {checkedIds.size === 1 ? "suplement" : checkedIds.size < 5 ? "suplementy" : "suplementów"}
          </span>
          <button
            onClick={handleAddToEditor}
            className="ml-auto flex items-center gap-1.5 h-8 px-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium transition-colors"
          >
            <Plus size={13} />
            Dodaj do programu
          </button>
          <button onClick={clearSelection} className="p-1 text-teal-400 hover:text-teal-700 transition-colors">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Grid */}
      {supplements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <ShoppingCart size={32} className="text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">Brak suplementów spełniających kryteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {supplements.map((s) => (
            <SupplementCard
              key={s.id}
              supplement={s}
              checked={checkedIds.has(s.id)}
              onToggle={() => toggleCheck(s.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SupplementCard({
  supplement: s,
  checked,
  onToggle,
}: {
  supplement: Supplement
  checked: boolean
  onToggle: () => void
}) {
  return (
    <div
      className={`bg-white rounded-xl border transition-all flex flex-col overflow-hidden group cursor-pointer ${
        checked ? "border-navy-400 ring-2 ring-navy-200 shadow-sm" : "border-gray-200 hover:border-navy-200 hover:shadow-sm"
      }`}
      onClick={onToggle}
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {s.image_url ? (
          <img
            src={s.image_url}
            alt={s.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingCart size={28} className="text-gray-300" />
          </div>
        )}
        {/* Checkbox overlay */}
        <div className="absolute top-2 right-2">
          {checked
            ? <CheckSquare size={20} className="text-navy-500 drop-shadow" />
            : <Square size={20} className="text-gray-300 group-hover:text-gray-400 drop-shadow" />}
        </div>
      </div>

      {/* Body */}
      <div className="p-3 flex-1 flex flex-col gap-2">
        <div>
          {s.product_type && (
            <p className="text-xs text-gray-400 mb-0.5">{s.product_type}</p>
          )}
          <h3 className="text-xs font-semibold text-gray-900 leading-snug line-clamp-2">{s.name}</h3>
        </div>
        {s.price !== null && (
          <p className="text-sm font-semibold text-navy-600">{s.price.toFixed(2)} zł</p>
        )}
        <a
          href={`https://formeds.pl/products/${s.formeds_handle}${AFFILIATE_SUFFIX}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mt-auto flex items-center justify-center gap-1.5 h-7 rounded-lg bg-navy-50 hover:bg-navy-100 text-navy-600 text-xs font-medium transition-colors"
        >
          <ExternalLink size={11} />
          Formeds.pl
        </a>
      </div>
    </div>
  )
}
