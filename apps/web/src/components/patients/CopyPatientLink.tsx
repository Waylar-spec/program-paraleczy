"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"

interface Props {
  accessCode: string
}

export function CopyPatientLink({ accessCode }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const url = `${window.location.origin}/p/${accessCode}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
      title="Kopiuj link pacjenta"
    >
      {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
    </button>
  )
}
