import Link from "next/link"
import { Activity, Clock, Layers, ChevronRight } from "lucide-react"
import { getProtocols } from "@/lib/actions/protocols"
import { NewProtocolModal } from "@/components/protocols/NewProtocolModal"
import { LibraryTabs } from "@/components/library/LibraryTabs"
import { AssignProtocolFromLibraryButton } from "@/components/protocols/AssignProtocolFromLibraryButton"
import { DeleteProtocolButton } from "@/components/protocols/DeleteProtocolButton"

export default async function ProtocolyPage() {
  const protocols = await getProtocols()

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Biblioteka</h1>
          <p className="text-sm text-gray-500 mt-1">
            {protocols.length > 0
              ? `${protocols.length} ${protocols.length === 1 ? "protokół" : protocols.length < 5 ? "protokoły" : "protokołów"} rehabilitacyjnych`
              : "Twórz wielofazowe programy powrotu do zdrowia"}
          </p>
        </div>
        <NewProtocolModal />
      </div>

      <LibraryTabs />

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
              <div
                key={protocol.id}
                className="group bg-white rounded-xl border border-gray-200 hover:border-navy-200 hover:shadow-sm transition-all flex flex-col"
              >
                {/* Card body */}
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

                {/* Card footer actions */}
                <div className="px-4 pb-4 flex gap-2">
                  <AssignProtocolFromLibraryButton protocol={protocol} />
                  <Link
                    href={`/biblioteka/protokoly/${protocol.id}`}
                    className="flex-1 h-8 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center justify-center gap-1"
                  >
                    Edytuj fazy <ChevronRight size={11} />
                  </Link>
                  <DeleteProtocolButton
                    protocolId={protocol.id}
                    protocolName={protocol.name}
                    isOwn={isOwn}
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
