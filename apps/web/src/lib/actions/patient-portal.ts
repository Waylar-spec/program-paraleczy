"use server"

import { createServiceClient } from "@/lib/supabase/service"

export async function getPatientByCode(code: string) {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from("patients")
    .select("id, first_name, last_name, birth_year")
    .eq("access_code", code.toUpperCase())
    .is("archived_at", null)
    .single()

  if (error || !data) return null

  // update last_seen_at
  await supabase
    .from("patients")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", data.id)

  return data
}

export async function getPatientPrograms(patientId: string) {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from("patient_programs")
    .select(`
      id, name, status, start_date, end_date, created_at,
      patient_program_items(
        id, order, sets, reps, duration_seconds, notes,
        exercises(id, name, description, thumbnail_url, animated_gif_url, video_url, body_part)
      ),
      patient_program_content(
        id, order,
        educational_content(id, name, type, file_url, external_url)
      )
    `)
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false })

  if (error) return []
  return data
}

export async function logExercise(params: {
  patientId: string
  programId: string
  programItemId: string
  completedSets: number
  completedReps: number | null
  painAfter: number | null
  notes?: string
}) {
  const supabase = createServiceClient()

  const { error } = await supabase
    .from("patient_exercise_logs")
    .insert({
      patient_id: params.patientId,
      program_id: params.programId,
      program_item_id: params.programItemId,
      completed_sets: params.completedSets,
      completed_reps: params.completedReps,
      pain_after: params.painAfter,
      notes: params.notes || null,
    })

  if (error) throw new Error(error.message)
}

export async function getTodayLogs(patientId: string, programId: string) {
  const supabase = createServiceClient()
  const today = new Date().toISOString().split("T")[0]

  const { data } = await supabase
    .from("patient_exercise_logs")
    .select("program_item_id")
    .eq("patient_id", patientId)
    .eq("program_id", programId)
    .gte("logged_at", `${today}T00:00:00`)

  return (data ?? []).map((l) => l.program_item_id as string)
}
