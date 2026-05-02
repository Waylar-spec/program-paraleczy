"use client"

import { Printer } from "lucide-react"

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="h-9 px-4 rounded-lg bg-navy-500 hover:bg-navy-600 text-white text-sm font-medium transition-colors inline-flex items-center gap-2"
    >
      <Printer size={15} />
      Drukuj / PDF
    </button>
  )
}
