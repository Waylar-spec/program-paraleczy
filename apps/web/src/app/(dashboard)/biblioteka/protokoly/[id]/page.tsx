import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getProtocol } from "@/lib/actions/protocols"
import { getTemplates } from "@/lib/actions/templates"
import { ProtocolEditor } from "@/components/protocols/ProtocolEditor"
import { ProtocolHeaderEditor } from "@/components/protocols/ProtocolHeaderEditor"

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

      <ProtocolHeaderEditor
        protocolId={id}
        name={protocol.name}
        indication={protocol.indication ?? null}
        bodyPart={protocol.body_part ?? null}
        totalWeeks={protocol.total_weeks ?? null}
        description={protocol.description ?? null}
      />

      <ProtocolEditor protocolId={id} phases={phases} templates={templates} />
    </div>
  )
}
