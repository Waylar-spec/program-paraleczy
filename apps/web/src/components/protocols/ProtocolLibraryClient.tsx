"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  Activity, Clock, Layers, ChevronRight, LayoutGrid, List,
  Footprints, Hand, User, Bone, Zap, BrainCircuit, Dumbbell,
} from "lucide-react"
import type { getProtocols } from "@/lib/actions/protocols"
import { AssignProtocolFromLibraryButton } from "@/components/protocols/AssignProtocolFromLibraryButton"
import { DeleteProtocolButton } from "@/components/protocols/DeleteProtocolButton"
import { EditProtocolModal } from "@/components/protocols/EditProtocolModal"
import { NewProtocolModal } from "@/components/protocols/NewProtocolModal"

type ProtocolItem = Awaited<ReturnType<typeof getProtocols>>[number]

interface Props {
  protocols: ProtocolItem[]
}

// ── body_part → icon + color ──────────────────────────────────────────────────
function getBodyPartMeta(part: string | null): { Icon: React.ElementType; bg: string; text: string } {
  const s = (part ?? "").toLowerCase()
  if (s.includes("stopa") || s.includes("kostka"))
    return { Icon: Footprints, bg: "bg-green-50", text: "text-green-600" }
  if (s.includes("kolano"))
    return { Icon: Bone, bg: "bg-blue-50", text: "text-blue-600" }
  if (s.includes("biodro"))
    return { Icon: Activity, bg: "bg-violet-50", text: "text-violet-600" }
  if (s.includes("bark"))
    return { Icon: Zap, bg: "bg-orange-50", text: "text-orange-600" }
  if (s.includes("kręgosłup"))
    return { Icon: BrainCircuit, bg: "bg-teal-50", text: "text-teal-600" }
  if (s.includes("łokieć"))
    return { Icon: Dumbbell, bg: "bg-amber-50", text: "text-amber-600" }
  if (s.includes("ręka") || s.includes("nadgarstek") || s.includes("kciuk"))
    return { Icon: Hand, bg: "bg-pink-50", text: "text-pink-600" }
  if (s.includes("całe") || s.includes("neurolog"))
    return { Icon: User, bg: "bg-sky-50", text: "text-sky-600" }
  return { Icon: Activity, bg: "bg-navy-50", text: "text-navy-500" }
}

export function ProtocolLibraryClient({ protocols }: Props) {
  const [bodyPart, setBodyPart] = useState<string | null>(null)
  const [view, setView] = useState<"grid" | "list">("grid")

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
      {/* Toolbar: filters + view toggle */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-2 flex-1">
          <button
            onClick={() => setBodyPart(null)}
            className={`h-7 px-3 rounded-full text-xs font-medium transition-colors ${
              bodyPart === null ? "bg-navy-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
                  active ? "bg-navy-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {part}
                <span className={`ml-1.5 text-[10px] ${active ? "opacity-70" : "opacity-50"}`}>{count}</span>
              </button>
            )
          })}
        </div>

        {/* View toggle */}
        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden shrink-0">
          <button
            onClick={() => setView("grid")}
            title="Siatka"
            className={`p-1.5 transition-colors ${view === "grid" ? "bg-navy-500 text-white" : "text-gray-400 hover:bg-gray-50"}`}
          >
            <LayoutGrid size={15} />
          </button>
          <button
            onClick={() => setView("list")}
            title="Lista"
            className={`p-1.5 transition-colors ${view === "list" ? "bg-navy-500 text-white" : "text-gray-400 hover:bg-gray-50"}`}
          >
            <List size={15} />
          </button>
        </div>
      </div>

      {/* Empty filter state */}
      {filtered.length === 0 && (
        <p className="text-sm text-gray-500 py-8 text-center">
          Brak protokołów dla części ciała: <strong>{bodyPart}</strong>
        </p>
      )}

      {/* ── GRID VIEW ── */}
      {view === "grid" && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((protocol) => {
            const phaseCount = protocol.protocol_phases?.length ?? 0
            const isOwn = !!protocol.practitioner_id
            const { Icon, bg, text } = getBodyPartMeta(protocol.body_part)
            return (
              <div
                key={protocol.id}
                className="group bg-white rounded-xl border border-gray-200 hover:border-navy-200 hover:shadow-sm transition-all flex flex-col"
              >
                <div className="p-5 flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                      <Icon size={18} className={text} />
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
                      <span className={`text-xs px-2 py-0.5 rounded-full ${bg} ${text} font-medium`}>
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

      {/* ── LIST VIEW ── */}
      {view === "list" && filtered.length > 0 && (
        <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
          {filtered.map((protocol) => {
            const phaseCount = protocol.protocol_phases?.length ?? 0
            const isOwn = !!protocol.practitioner_id
            const { Icon, bg, text } = getBodyPartMeta(protocol.body_part)
            return (
              <div
                key={protocol.id}
                className="flex items-center gap-4 px-4 py-3 bg-white hover:bg-gray-50/50 transition-colors"
              >
                <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                  <Icon size={15} className={text} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">{protocol.name}</p>
                    {!isOwn && (
                      <span className="text-[10px] bg-navy-50 text-navy-600 px-1.5 py-0.5 rounded-full font-medium shrink-0">
                        Systemowy
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {protocol.body_part && <span className="text-xs text-gray-400">{protocol.body_part}</span>}
                    <span className="text-xs text-gray-400">
                      {phaseCount} {phaseCount === 1 ? "faza" : phaseCount < 5 ? "fazy" : "faz"}
                    </span>
                    {protocol.total_weeks && (
                      <span className="text-xs text-gray-400">{protocol.total_weeks} tyg.</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <AssignProtocolFromLibraryButton protocol={protocol} />
                  <Link
                    href={`/biblioteka/protokoly/${protocol.id}`}
                    className="h-8 px-3 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center gap-1 whitespace-nowrap"
                  >
                    Edytuj <ChevronRight size={11} />
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
