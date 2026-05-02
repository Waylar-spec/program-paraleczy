"use server"

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

export type Survey = {
  id: string
  name: string
  description: string | null
  is_public: boolean
  practitioner_id: string | null
  question_count?: number
}

export type SurveyQuestion = {
  id: string
  survey_id: string
  order: number
  question: string
  type: "scale" | "text" | "yesno" | "multiple_choice"
  options: string[] | null
  min_label: string | null
  max_label: string | null
  min_value: number | null
  max_value: number | null
}

export type SurveyWithQuestions = Survey & { survey_questions: SurveyQuestion[] }

// schedule enum: on_start | on_end | weekly | custom
export type SurveySchedule = "on_start" | "on_end" | "weekly" | "custom"

export type PatientSurveyAssignment = {
  id: string           // patient_program_surveys.id
  survey_id: string
  program_id: string
  program_name: string
  schedule: SurveySchedule
  surveys: Survey
  last_response_at?: string | null
}

export type SurveyResponse = {
  id: string
  patient_id: string
  survey_id: string
  program_survey_id: string | null
  answers: Record<string, unknown>
  completed_at: string
  surveys?: { name: string }
}

// ─── Cached query ─────────────────────────────────────────────────────────────

async function _fetchSurveys(userId: string) {
  const sb = createServiceClient()
  const { data } = await sb
    .from("surveys")
    .select("id, name, description, is_public, practitioner_id, survey_questions(id)")
    .or(`practitioner_id.eq.${userId},practitioner_id.is.null`)
    .order("created_at", { ascending: true })

  return (data ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    is_public: s.is_public,
    practitioner_id: s.practitioner_id,
    question_count: Array.isArray(s.survey_questions) ? s.survey_questions.length : 0,
  })) as Survey[]
}

const _cachedFetchSurveys = unstable_cache(
  _fetchSurveys,
  ["surveys"],
  { tags: ["surveys"], revalidate: 300 },
)

export async function getSurveys(): Promise<Survey[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  return _cachedFetchSurveys(user.id)
}

export async function getSurvey(id: string): Promise<SurveyWithQuestions | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from("surveys")
    .select(`
      id, name, description, is_public, practitioner_id,
      survey_questions(id, survey_id, order, question, type, options, min_label, max_label, min_value, max_value)
    `)
    .eq("id", id)
    .single()

  if (error || !data) return null

  const questions = normalizeQuestions(data.survey_questions ?? [])

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    is_public: data.is_public,
    practitioner_id: data.practitioner_id,
    survey_questions: questions,
  }
}

function normalizeQuestions(qs: unknown[]): SurveyQuestion[] {
  return (qs as SurveyQuestion[])
    .sort((a, b) => a.order - b.order)
    .map((q) => ({
      ...q,
      options: q.options
        ? (typeof q.options === "string" ? JSON.parse(q.options) : q.options)
        : null,
    }))
}

/**
 * Assign a survey to a patient program.
 * patient_program_surveys links program_id + survey_id + schedule.
 */
export async function assignSurveyToProgram(
  programId: string,
  surveyId: string,
  schedule: SurveySchedule
): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")

  const { data, error } = await supabase
    .from("patient_program_surveys")
    .insert({
      program_id: programId,
      survey_id: surveyId,
      schedule,
    })
    .select("id")
    .single()

  if (error) throw new Error(error.message)
  return data.id
}

/**
 * Get all surveys assigned to a patient (via their programs).
 */
export async function getPatientSurveys(patientId: string): Promise<PatientSurveyAssignment[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Get patient's programs, then their assigned surveys
  const { data, error } = await supabase
    .from("patient_programs")
    .select(`
      id, name,
      patient_program_surveys(
        id, survey_id, program_id, schedule,
        surveys(id, name, description, is_public, practitioner_id)
      )
    `)
    .eq("patient_id", patientId)

  if (error) return []

  const assignments: PatientSurveyAssignment[] = []
  const assignmentIds: string[] = []

  for (const prog of data ?? []) {
    for (const pps of prog.patient_program_surveys ?? []) {
      if (!pps.surveys) continue
      assignments.push({
        id: pps.id,
        survey_id: pps.survey_id,
        program_id: pps.program_id,
        program_name: prog.name,
        schedule: pps.schedule as SurveySchedule,
        surveys: pps.surveys as unknown as Survey,
        last_response_at: null,
      })
      assignmentIds.push(pps.id)
    }
  }

  // Fetch last response for each assignment
  if (assignmentIds.length > 0) {
    const { data: responses } = await supabase
      .from("patient_survey_responses")
      .select("program_survey_id, completed_at")
      .eq("patient_id", patientId)
      .in("program_survey_id", assignmentIds)
      .order("completed_at", { ascending: false })

    const lastMap: Record<string, string> = {}
    for (const r of responses ?? []) {
      if (r.program_survey_id && !lastMap[r.program_survey_id]) {
        lastMap[r.program_survey_id] = r.completed_at
      }
    }

    for (const a of assignments) {
      a.last_response_at = lastMap[a.id] ?? null
    }
  }

  return assignments
}

export async function submitSurveyResponse(
  patientId: string,
  surveyId: string,
  programSurveyId: string | null,
  answers: Record<string, unknown>
): Promise<void> {
  const supabase = createServiceClient()

  const { error } = await supabase
    .from("patient_survey_responses")
    .insert({
      patient_id: patientId,
      survey_id: surveyId,
      program_survey_id: programSurveyId,
      answers,
      completed_at: new Date().toISOString(),
    })

  if (error) throw new Error(error.message)
}

export async function getPatientSurveyResponses(
  patientId: string,
  surveyId?: string
): Promise<SurveyResponse[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  let query = supabase
    .from("patient_survey_responses")
    .select("id, patient_id, survey_id, program_survey_id, answers, completed_at, surveys(name)")
    .eq("patient_id", patientId)
    .order("completed_at", { ascending: false })

  if (surveyId) query = query.eq("survey_id", surveyId)

  const { data, error } = await query.limit(50)
  if (error) return []
  return (data ?? []) as unknown as SurveyResponse[]
}

// --- Patient portal (no auth, service client) ---

export async function getPatientSurveysForPortal(patientId: string) {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from("patient_programs")
    .select(`
      id, name,
      patient_program_surveys(
        id, survey_id, program_id, schedule,
        surveys(id, name, description)
      )
    `)
    .eq("patient_id", patientId)
    .eq("status", "active")

  if (error) return []

  type Row = {
    id: string
    survey_id: string
    program_id: string
    schedule: SurveySchedule
    surveys: { id: string; name: string; description: string | null }
    program_name: string
    last_response_at: string | null
  }

  const assignments: Row[] = []
  const ids: string[] = []

  for (const prog of data ?? []) {
    for (const pps of prog.patient_program_surveys ?? []) {
      if (!pps.surveys) continue
      assignments.push({
        id: pps.id,
        survey_id: pps.survey_id,
        program_id: pps.program_id,
        schedule: pps.schedule,
        surveys: pps.surveys as unknown as { id: string; name: string; description: string | null },
        program_name: prog.name,
        last_response_at: null,
      })
      ids.push(pps.id)
    }
  }

  if (ids.length > 0) {
    const { data: responses } = await supabase
      .from("patient_survey_responses")
      .select("program_survey_id, completed_at")
      .eq("patient_id", patientId)
      .in("program_survey_id", ids)
      .order("completed_at", { ascending: false })

    const lastMap: Record<string, string> = {}
    for (const r of responses ?? []) {
      if (r.program_survey_id && !lastMap[r.program_survey_id]) {
        lastMap[r.program_survey_id] = r.completed_at
      }
    }

    for (const a of assignments) {
      a.last_response_at = lastMap[a.id] ?? null
    }
  }

  return assignments
}

export async function getSurveyForPortal(surveyId: string) {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from("surveys")
    .select(`
      id, name, description,
      survey_questions(id, survey_id, order, question, type, options, min_label, max_label, min_value, max_value)
    `)
    .eq("id", surveyId)
    .single()

  if (error || !data) return null

  return {
    ...data,
    survey_questions: normalizeQuestions(data.survey_questions ?? []),
  }
}
