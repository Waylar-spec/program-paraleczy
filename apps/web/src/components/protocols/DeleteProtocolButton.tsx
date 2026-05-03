"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { deleteProtocol } from "@/lib/actions/protocols"
import { toast } from "sonner"

interface Props {
  protocolId: string
  protocolName: string
  isOwn: boolean
}

export function DeleteProtocolButton({ protocolId, protocolName, isOwn }: Props) {
  const router = useRouter()
  const [confirm, setConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  if (!isOwn) return null

  if (confirm) {
    return (
      <div className="flex gap-1">
        <button
          onClick={async () => {
            setDeleting(true)
            try {
              await deleteProtocol(protocolId)
              toast.success(`Protokół "${protocolName}" usunięty`)
              router.refresh()
            } catch {
              toast.error("Nie udało się usunąć protokołu")
              setDeleting(false)
              setConfirm(false)
            }
          }}
          disabled={deleting}
          className="h-8 px-2.5 rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-50 text-xs font-medium text-white transition-colors"
        >
          {deleting ? "Usuwam…" : "Tak, usuń"}
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="h-8 px-2.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Anuluj
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="h-8 w-8 rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors flex items-center justify-center shrink-0"
      title="Usuń protokół"
    >
      <Trash2 size={13} />
    </button>
  )
}
