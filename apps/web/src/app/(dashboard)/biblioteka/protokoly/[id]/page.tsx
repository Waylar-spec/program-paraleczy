import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getProtocol } from "@/lib/actions/protocols"
import { getTemplates } from "@/lib/actions/templates"
import { ProtocolEditor } from "@/components/protocols/ProtocolEditor"

export default async function ProtocolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [protocol, templates] = await Promise.all([getProtocol(id), getTemplates()])

  if (!protocol) notFound()

  const phases = [...(protocol.protocol_phases ?? [])].sort(
    (a: { order: number }, b: { order: number }) => a.order - b.order
  )

  return (
    <div className="space-y-6">
      <Link
        href="/biblioteka/protokoly"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft size={14} />
        Protokoły
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{protocol.name}</h1>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {protocol.indication && (
            <p className="text-sm text-gray-500">{protocol.indication}</p>
          )}
          {protocol.body_part && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {protocol.body_part}
            </span>
          )}
          {protocol.total_weeks && (
            <span className="text-xs text-gray-500">{protocol.total_weeks} tygodni łącznie</span>
          )}
        </div>
      </div>

      <ProtocolEditor protocolId={id} phases={phases} templates={templates} />
    </div>
  )
}
