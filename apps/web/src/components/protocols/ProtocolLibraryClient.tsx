"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Activity, Clock, Layers, ChevronRight } from "lucide-react"
import type { getProtocols } from "@/lib/actions/protocols"
import { AssignProtocolFromLibraryButton } from "@/components/protocols/AssignProtocolFromLibraryButton"
import { DeleteProtocolButton } from "@/components/protocols/DeleteProtocolButton"
import { EditProtocolModal } from "@/components/protocols/EditProtocolModal"
import { NewProtocolModal } from "@/components/protocols/NewProtocolModal"

type ProtocolItem = Awaited<ReturnType<typeof getProtocols>>[number]

interface Props {
  protocols: ProtocolItem[]
}

export function ProtocolLibraryClient({ protocols }: Props) {
  const [bodyPart, setBodyPart] = useState<string | null>(null)

  const bodyParts = useMemo(() => {
    const parts = protocols.map((p) => p.body_part).filter(Boolean) as string[]
    return Array.from(new Set(parts)).sort((a, b) => a.localeCompare(b, "pl"))
  }, [protocols])

  const filtered = useMemo(() => {
    if (!bodyPart) return protocols
    return protocols.filter((p) => p.body_part === bodyPart)
  }, [protocols, bodyPart])

  if (protocols.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-navy-50 flex items-center justify-center mb-4">
          <Activity size={28} className="text-navy-500" />
        </div>
        <h2 className="text-lg font-medium text-gray-900 mb-2">Brak protokołów</h2>
        <p className="text-sm text-gray-500 mb-6 max-w-sm">
          Utwórz wielofazowy protokół rehabilitacyjny — np. "Powrót po operacji ACL" — i przypisuj go do pacjentów.
        </p>
        <NewProtocolModal />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setBodyPart(null)}
          className={`h-7 px-3 rounded-full text-xs font-medium transition-colors ${
            bodyPart === null
              ? "bg-navy-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Wszystkie
          <span className={`ml-1.5 text-[10px] ${bodyPart === null ? "opacity-70" : "opacity-50"}`}>
            {protocols.length}
          </span>
        </button>

        {bodyParts.map((part) => {
          const count = protocols.filter((p) => p.body_part === part).length
          const active = bodyPart === part
          return (
            <button
              key={part}
              onClick={() => setBodyPart(active ? null : part)}
              className={`h-7 px-3 rounded-full text-xs font-medium transition-colors ${
                active
                  ? "bg-navy-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {part}
              <span className={`ml-1.5 text-[10px] ${active ? "opacity-70" : "opacity-50"}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center">
          Brak protokołów dla części ciała: <strong>{bodyPart}</strong>
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((protocol) => {
            const phaseCount = protocol.protocol_phases?.length ?? 0
            const isOwn = !!protocol.practitioner_id
            return (
              <div
                key={protocol.id}
                className="group bg-white rounded-xl border border-gray-200 hover:border-navy-200 hover:shadow-sm transition-all flex flex-col"
              >
                <div className="p-5 flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-navy-50 flex items-center justify-center shrink-0">
                      <Activity size={18} className="text-navy-500" />
                    </div>
                    {!isOwn && (
                      <span className="text-xs bg-navy-50 text-navy-600 px-2 py-0.5 rounded-full font-medium">
                        Systemowy
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-gray-900 leading-snug mb-1">
                    {protocol.name}
                  </h3>
                  {protocol.indication && (
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3">{protocol.indication}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Layers size={12} />
                      {phaseCount} {phaseCount === 1 ? "faza" : phaseCount < 5 ? "fazy" : "faz"}
                    </span>
                    {protocol.total_weeks && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock size={12} />
                        {protocol.total_weeks} tyg.
                      </span>
                    )}
                    {protocol.body_part && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {protocol.body_part}
                      </span>
                    )}
                  </div>
                </div>

                <div className="px-4 pb-4 flex gap-2">
                  <AssignProtocolFromLibraryButton protocol={protocol} />
                  <Link
                    href={`/biblioteka/protokoly/${protocol.id}`}
                    className="flex-1 h-8 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center justify-center gap-1"
                  >
                    Edytuj fazy <ChevronRight size={11} />
                  </Link>
                  <EditProtocolModal protocol={protocol} />
                  <DeleteProtocolButton
                    protocolId={protocol.id}
                    protocolName={protocol.name}
                    isOwn={true}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
