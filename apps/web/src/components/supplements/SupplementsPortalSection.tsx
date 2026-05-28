"use client"

import { useState } from "react"
import { ExternalLink, ShoppingCart, Tag, Copy, Check } from "lucide-react"

type PortalSupplement = {
  id: string
  notes: string | null
  name: string
  product_type: string | null
  image_url: string | null
  price: number | null
  affiliate_url: string
}

interface Props {
  supplements: PortalSupplement[]
}

const CODES = [
  {
    code: "PARALECZY20",
    label: "-20% na wszystko",
    description: "Bez łączenia z innymi promocjami",
    color: "bg-navy-500",
  },
  {
    code: "PARALECZY",
    label: "Darmowa dostawa",
    description: "Łączy się z promocjami i zestawami",
    color: "bg-emerald-600",
  },
]

function CouponCard({ code, label, description, color }: typeof CODES[0]) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl border border-gray-200 p-4">
      <div className={`shrink-0 w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
        <Tag size={18} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base font-bold tracking-widest text-gray-900">{code}</p>
        <p className="text-xs font-medium text-gray-700">{label}</p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
      <button
        onClick={copy}
        className={`shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold transition-all ${
          copied
            ? "bg-green-50 text-green-600 border border-green-200"
            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
        }`}
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
        {copied ? "Skopiowano!" : "Kopiuj"}
      </button>
    </div>
  )
}

export function SupplementsPortalSection({ supplements }: Props) {
  return (
    <div className="space-y-3">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Przepisane suplementy
      </h2>

      {/* Supplement list */}
      <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-50 overflow-hidden">
        {supplements.map((s) => (
          <a
            key={s.id}
            href={s.affiliate_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-gray-100">
              {s.image_url ? (
                <img src={s.image_url} alt={s.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingCart size={20} className="text-gray-300" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 leading-snug">{s.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="text-xs text-gray-400">{s.product_type ?? "Suplement"}</span>
                {s.price !== null && (
                  <>
                    <span className="text-gray-200">·</span>
                    <span className="text-xs text-gray-300 line-through">{s.price.toFixed(2)} zł</span>
                    <span className="text-xs font-semibold text-emerald-600">{(s.price * 0.8).toFixed(2)} zł</span>
                    <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">-20%</span>
                  </>
                )}
              </div>
              {s.notes && (
                <p className="text-xs text-gray-500 mt-1 italic">{s.notes}</p>
              )}
            </div>
            <div className="shrink-0 flex items-center gap-1 text-xs text-navy-600 font-medium">
              <ExternalLink size={13} />
              Kup
            </div>
          </a>
        ))}
      </div>

      {/* Discount codes */}
      <div className="space-y-2">
        <p className="text-xs text-gray-400 flex items-center gap-1.5">
          <Tag size={11} />
          Twoje kody rabatowe na formeds.pl
        </p>
        {CODES.map((c) => (
          <CouponCard key={c.code} {...c} />
        ))}
      </div>
    </div>
  )
}
