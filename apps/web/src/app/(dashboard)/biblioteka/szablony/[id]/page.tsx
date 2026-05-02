import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Printer } from "lucide-react"
import { getTemplate } from "@/lib/actions/templates"
import { getExercises } from "@/lib/actions/exercises"
import { getEducationalContent } from "@/lib/actions/education"
import { getSurveys } from "@/lib/actions/surveys"
import { TemplateEditor } from "@/components/templates/TemplateEditor"

export default async function SzablonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [template, exercises, allContent, allSurveys] = await Promise.all([getTemplate(id), getExercises(), getEducationalContent(), getSurveys()])

  if (!template) notFound()

  const items = [...(template.program_template_items ?? [])].sort(
    (a: { order: number }, b: { order: number }) => a.order - b.order
  )

  const templateContent = [...(template.program_template_content ?? [])].sort(
    (a: { order: number }, b: { order: number }) => a.order - b.order
  )

  const templateSurveys = [...((template as any).program_template_surveys ?? [])].sort(
    (a: { order: number }, b: { order: number }) => a.order - b.order
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/biblioteka/szablony"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={14} />
          Szablony
        </Link>
        <Link
          href={`/drukuj/szablon/${id}`}
          target="_blank"
          className="inline-flex items-center gap-2 h-8 px-3 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Printer size={14} />
          Drukuj / PDF
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{template.name}</h1>
        {template.description && (
          <p className="text-sm text-gray-500 mt-1">{template.description}</p>
        )}
        {template.body_part && (
          <span className="inline-block mt-2 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {template.body_part}
          </span>
        )}
      </div>

      <TemplateEditor templateId={id} items={items} exercises={exercises} allContent={allContent} templateContent={templateContent} allSurveys={allSurveys} templateSurveys={templateSurveys} />
    </div>
  )
}
