import { notFound } from "next/navigation"
import { getTemplate } from "@/lib/actions/templates"
import { getPractitionerProfile } from "@/lib/actions/practitioner"
import { PrintButton } from "@/components/print/PrintButton"
import { PrintPage } from "@/components/print/PrintPage"

export default async function DrukujSzablonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [template, practitioner] = await Promise.all([getTemplate(id), getPractitionerProfile()])
  if (!template) notFound()

  const items = [...(template.program_template_items ?? [])].sort(
    (a: { order: number }, b: { order: number }) => a.order - b.order
  )

  return (
    <>
      <div className="print:hidden fixed top-4 right-4 flex gap-2 z-50">
        <a
          href={`/biblioteka/szablony/${id}`}
          className="h-9 px-4 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors inline-flex items-center"
        >
          ← Wróć
        </a>
        <PrintButton />
      </div>

      <PrintPage
        title={template.name}
        subtitle={template.body_part ?? undefined}
        practitioner={practitioner}
        items={items}
        printedAt={new Date().toLocaleDateString("pl-PL")}
      />
    </>
  )
}
