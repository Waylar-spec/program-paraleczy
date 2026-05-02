import { notFound } from "next/navigation"
import { getPatientProgramForPrint } from "@/lib/actions/patient-programs"
import { getPractitionerProfile } from "@/lib/actions/practitioner"
import { PrintButton } from "@/components/print/PrintButton"
import { PrintPage } from "@/components/print/PrintPage"

export default async function DrukujProgramPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [program, practitioner] = await Promise.all([getPatientProgramForPrint(id), getPractitionerProfile()])
  if (!program) notFound()

  const patient = Array.isArray(program.patients) ? program.patients[0] : program.patients
  const patientName = patient ? `${patient.first_name} ${patient.last_name}` : undefined

  const items = [...(program.patient_program_items ?? [])].sort(
    (a: { order: number }, b: { order: number }) => a.order - b.order
  )

  const content = (program.patient_program_content ?? [])
    .sort((a: { order: number }, b: { order: number }) => a.order - b.order)
    .map((pc: { educational_content: unknown }) => {
      const ec = Array.isArray(pc.educational_content) ? pc.educational_content[0] : pc.educational_content
      return ec
    })
    .filter(Boolean) as { id: string; name: string; type: string; file_url: string | null; external_url: string | null }[]

  return (
    <>
      <div className="print:hidden fixed top-4 right-4 flex gap-2 z-50">
        <a
          href="javascript:history.back()"
          className="h-9 px-4 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors inline-flex items-center"
        >
          ← Wróć
        </a>
        <PrintButton />
      </div>

      <PrintPage
        title={program.name}
        patientName={patientName}
        practitioner={practitioner}
        items={items as Parameters<typeof PrintPage>[0]["items"]}
        content={content}
        printedAt={new Date().toLocaleDateString("pl-PL")}
      />
    </>
  )
}
