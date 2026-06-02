import { getProtocols } from "@/lib/actions/protocols"
import { NewProtocolModal } from "@/components/protocols/NewProtocolModal"
import { LibraryTabs } from "@/components/library/LibraryTabs"
import { ProtocolLibraryClient } from "@/components/protocols/ProtocolLibraryClient"

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

      <ProtocolLibraryClient protocols={protocols} />
    </div>
  )
}
