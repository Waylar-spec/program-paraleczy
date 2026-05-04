import { notFound } from "next/navigation"
import { getPatientByCode } from "@/lib/actions/patient-portal"
import { getPatientSurveysForPortal, getSurveyForPortal } from "@/lib/actions/surveys"
import { createServiceClient } from "@/lib/supabase/service"
import { SurveyForm } from "@/components/surveys/SurveyForm"

export default async function SurveyFillPage({
  params,
}: {
  params: Promise<{ kod: string; assignmentId: string }>
}) {
  const { kod, assignmentId } = await params
  const patient = await getPatientByCode(kod)
  if (!patient) notFound()

  // Get the specific assignment — verify ownership via patient_programs join
  const supabase = createServiceClient()
  const { data: assignment } = await supabase
    .from("patient_program_surveys")
    .select("id, survey_id, program_id, schedule, patient_programs!inner(patient_id)")
    .eq("id", assignmentId)
    .single()

  const programRow = assignment?.patient_programs as unknown as { patient_id: string } | null
  if (!assignment || programRow?.patient_id !== patient.id) notFound()

  const survey = await getSurveyForPortal(assignment.survey_id)
  if (!survey) notFound()

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{survey.name}</h1>
        {survey.description && (
          <p className="text-sm text-gray-500 mt-1">{survey.description}</p>
        )}
      </div>

      <SurveyForm
        patientId={patient.id}
        surveyId={survey.id}
        assignmentId={assignment.id}
        questions={survey.survey_questions}
        kod={kod}
      />
    </div>
  )
}
