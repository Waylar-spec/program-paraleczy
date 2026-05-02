import Link from "next/link"
import { Activity, Clock, ChevronRight, Layers } from "lucide-react"
import { getProtocols } from "@/lib/actions/protocols"
import { NewProtocolModal } from "@/components/protocols/NewProtocolModal"

const TABS = [
  { label: "Ćwiczenia", href: "/biblioteka" },
  { label: "Szablony", href: "/biblioteka/szablony" },
  { label: "Protokoły", href: "/biblioteka/protokoly" },
  { label: "Edukacja", href: "/biblioteka/edukacja" },
  { label: "Kwestionariusze", href: "/biblioteka/kwestionariusze" },
]

export default async function ProtocolyPage() {
  const protocols = await getProtocols()

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200 -mb-0">
        <nav className="flex gap-6">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab.href === "/biblioteka/protokoly"
                  ? "border-navy-600 text-navy-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Protokoły rehabilitacyjne</h1>
          <p className="text-sm text-gray-500 mt-1">
            {protocols.length > 0
              ? `${protocols.length} ${protocols.length === 1 ? "protokół" : protocols.length < 5 ? "protokoły" : "protokołów"}`
              : "Twórz wielofazowe programy powrotu do zdrowia"}
          </p>
        </div>
        <NewProtocolModal />
      </div>

      {protocols.length === 0 ? (
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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {protocols.map((protocol) => {
            const phaseCount = protocol.protocol_phases?.length ?? 0
            const isOwn = !!protocol.practitioner_id
            return (
              <Link
                key={protocol.id}
                href={`/biblioteka/protokoly/${protocol.id}`}
                className="group bg-white rounded-xl border border-gray-200 p-5 hover:border-navy-100 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-navy-50 flex items-center justify-center flex-shrink-0">
                    <Activity size={18} className="text-navy-500" />
                  </div>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-navy-500 transition-colors mt-1" />
                </div>

                <h3 className="text-sm font-semibold text-gray-900 leading-tight mb-1">{protocol.name}</h3>

                {protocol.indication && (
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{protocol.indication}</p>
                )}

                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
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
                  {!isOwn && (
                    <span className="ml-auto text-xs bg-navy-50 text-navy-600 px-2 py-0.5 rounded-full font-medium">
                      Systemowy
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
