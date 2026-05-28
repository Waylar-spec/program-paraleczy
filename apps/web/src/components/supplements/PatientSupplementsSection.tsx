"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ShoppingCart, ExternalLink, Trash2 } from "lucide-react"
import { removePatientSupplement } from "@/lib/actions/supplements"
import { toast } from "sonner"
import type { PatientSupplement } from "@/lib/actions/supplements"

const AFFILIATE_SUFFIX = "?sca_ref=11220768.wIBh3GWahK"

interface Props {
  supplements: PatientSupplement[]
  patientId: string
}

export function PatientSupplementsSection({ supplements, patientId }: Props) {
  const router = useRouter()

  async function handleRemove(id: string, name: string) {
    if (!confirm(`Usunąć "${name}" z listy przepisanych suplementów?`)) return
    try {
      await removePatientSupplement(id, patientId)
      toast.success("Suplement usunięty")
      router.refresh()
    } catch {
      toast.error("Nie udało się usunąć suplementu")
    }
  }

  if (supplements.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-sm">Brak przepisanych suplementów</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {supplements.map((ps) => {
        const s = ps.supplements
        return (
          <div
            key={ps.id}
            className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"
          >
            {/* Thumbnail */}
            <div className="shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
              {s.image_url ? (
                <img src={s.image_url} alt={s.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingCart size={16} className="text-gray-300" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{s.name}</p>
              <p className="text-xs text-gray-400">
                {s.product_type ?? "Suplement"}
                {s.price !== null && ` · ${s.price.toFixed(2)} zł`}
              </p>
              {ps.notes && (
                <p className="text-xs text-gray-500 mt-0.5 italic">{ps.notes}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <a
                href={`https://formeds.pl/products/${s.formeds_handle}${AFFILIATE_SUFFIX}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-7 px-2.5 rounded-lg border border-gray-200 text-gray-500 hover:text-navy-600 hover:border-navy-200 text-xs flex items-center gap-1 transition-colors"
              >
                <ExternalLink size={11} />
                Formeds.pl
              </a>
              <button
                onClick={() => handleRemove(ps.id, s.name)}
                className="h-7 w-7 rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 flex items-center justify-center transition-colors"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
