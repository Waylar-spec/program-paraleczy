"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { sendProgramAssignedEmail } from "@/lib/email"

export async function assignTemplateToPatient(patientId: string, templateId: string, params: {
  startDate: string
  endDate?: string
  name?: string
  notes?: string
  contentIds?: string[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")

  const sb = createServiceClient()

  const [{ data: template }, { data: patient }, { data: practitioner }] = await Promise.all([
    sb
      .from("program_templates")
      .select("name, program_template_items(id, exercise_id, order, sets, reps, duration_seconds, rest_seconds, notes)")
      .eq("id", templateId)
      .single(),
    supabase
      .from("patients")
      .select("first_name, last_name, email, access_code")
      .eq("id", patientId)
      .single(),
    supabase
      .from("practitioners")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single(),
  ])

  if (!template) throw new Error("Szablon nie istnieje")

  // Fetch template surveys separately — table may not exist yet
  let templateSurveys: { survey_id: string; schedule: string }[] = []
  try {
    const { data: surveyData } = await (sb as any)
      .from("program_template_surveys")
      .select("survey_id, schedule")
      .eq("template_id", templateId)
    templateSurveys = surveyData ?? []
  } catch {
    // table doesn't exist yet — skip
  }

  // Create patient_program
  const { data: program, error: programError } = await supabase
    .from("patient_programs")
    .insert({
      patient_id: patientId,
      practitioner_id: user.id,
      template_id: templateId,
      name: params.name || template.name,
      status: "active",
      start_date: params.startDate,
      end_date: params.endDate || null,
    })
    .select()
    .single()

  if (programError) throw new Error(programError.message)

  // Copy template items to patient_program_items
  if (template.program_template_items?.length) {
    const items = template.program_template_items.map((item: {
      id: string
      exercise_id: string
      order: number
      sets: number | null
      reps: number | null
      duration_seconds: number | null
      rest_seconds: number | null
      notes: string | null
    }) => ({
      program_id: program.id,
      exercise_id: item.exercise_id,
      order: item.order,
      sets: item.sets,
      reps: item.reps,
      duration_seconds: item.duration_seconds,
      rest_seconds: item.rest_seconds,
      notes: item.notes,
    }))

    const { error: itemsError } = await supabase
      .from("patient_program_items")
      .insert(items)

    if (itemsError) throw new Error(itemsError.message)
  }

  if (params.contentIds?.length) {
    const contentRows = params.contentIds.map((contentId, i) => ({
      program_id: program.id,
      content_id: contentId,
      order: i + 1,
    }))
    await supabase.from("patient_program_content").insert(contentRows)
  }

  // Copy template surveys to patient_program_surveys
  if (templateSurveys.length > 0) {
    const surveyRows = templateSurveys.map((ts: { survey_id: string; schedule: string }) => ({
      program_id: program.id,
      survey_id: ts.survey_id,
      schedule: ts.schedule,
    }))
    await supabase.from("patient_program_surveys").insert(surveyRows)
  }

  if (patient?.email && patient.access_code) {
    const practitionerName = practitioner
      ? `${practitioner.first_name} ${practitioner.last_name}`.trim()
      : "Twój fizjoterapeuta"
    sendProgramAssignedEmail({
      toEmail: patient.email,
      patientName: `${patient.first_name} ${patient.last_name}`.trim(),
      programName: template.name,
      accessCode: patient.access_code,
      practitionerName,
    }).catch(() => {})
  }

  revalidatePath(`/pacjenci/${patientId}`)
  return program
}

export async function createQuickProgram(params: {
  patientId: string
  name: string
  startDate: string
  endDate?: string
  exercises: {
    exerciseId: string
    order: number
    sets: number
    reps: number | null
    durationSeconds: number | null
    notes: string
  }[]
  contentIds?: string[]
  saveAsTemplate?: boolean
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")

  const [{ data: patient }, { data: practitioner }] = await Promise.all([
    supabase
      .from("patients")
      .select("first_name, last_name, email, access_code")
      .eq("id", params.patientId)
      .single(),
    supabase
      .from("practitioners")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single(),
  ])

  let templateId: string | null = null

  if (params.saveAsTemplate) {
    const { data: tpl, error: tplError } = await supabase
      .from("program_templates")
      .insert({ practitioner_id: user.id, name: params.name })
      .select("id")
      .single()
    if (tplError) throw new Error(tplError.message)
    templateId = tpl.id

    const tplItems = params.exercises.map((ex) => ({
      template_id: tpl.id,
      exercise_id: ex.exerciseId,
      order: ex.order,
      sets: ex.sets,
      reps: ex.reps,
      duration_seconds: ex.durationSeconds,
      notes: ex.notes || null,
    }))
    await supabase.from("program_template_items").insert(tplItems)
  }

  const { data: program, error: progError } = await supabase
    .from("patient_programs")
    .insert({
      patient_id: params.patientId,
      practitioner_id: user.id,
      template_id: templateId,
      name: params.name,
      status: "active",
      start_date: params.startDate,
      end_date: params.endDate || null,
    })
    .select("id")
    .single()

  if (progError) throw new Error(progError.message)

  const items = params.exercises.map((ex) => ({
    program_id: program.id,
    exercise_id: ex.exerciseId,
    order: ex.order,
    sets: ex.sets,
    reps: ex.reps,
    duration_seconds: ex.durationSeconds,
    notes: ex.notes || null,
  }))

  const { error: itemsError } = await supabase.from("patient_program_items").insert(items)
  if (itemsError) throw new Error(itemsError.message)

  if (params.contentIds?.length) {
    const contentRows = params.contentIds.map((contentId, i) => ({
      program_id: program.id,
      content_id: contentId,
      order: i + 1,
    }))
    await supabase.from("patient_program_content").insert(contentRows)
  }

  if (patient?.email && patient.access_code) {
    const practitionerName = practitioner
      ? `${practitioner.first_name} ${practitioner.last_name}`.trim()
      : "Twój fizjoterapeuta"
    sendProgramAssignedEmail({
      toEmail: patient.email,
      patientName: `${patient.first_name} ${patient.last_name}`.trim(),
      programName: params.name,
      accessCode: patient.access_code,
      practitionerName,
    }).catch(() => {})
  }

  revalidatePath(`/pacjenci/${params.patientId}`)
  return program
}

export async function getPatientProgramWithItems(programId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Use service client so public exercises (owned by other practitioners)
  // are visible despite RLS on the exercises table
  const sb = createServiceClient()
  const { data } = await sb
    .from("patient_programs")
    .select(`
      id, name, status, start_date, end_date,
      patient_program_items(
        id, order, sets, reps, duration_seconds, rest_seconds, notes,
        exercises(id, name, thumbnail_url, body_part, default_sets, default_reps, default_duration_seconds)
      ),
      patient_program_content(
        id, order, content_id,
        educational_content(id, name, type, file_url, external_url)
      )
    `)
    .eq("id", programId)
    .eq("practitioner_id", user.id)
    .single()

  return data ?? null
}

export async function addContentToPatientProgram(programId: string, patientId: string, contentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")

  const { data: existing } = await supabase
    .from("patient_program_content")
    .select("order")
    .eq("program_id", programId)
    .order("order", { ascending: false })
    .limit(1)

  const nextOrder = ((existing?.[0]?.order as number | undefined) ?? 0) + 1

  const { error } = await supabase
    .from("patient_program_content")
    .insert({ program_id: programId, content_id: contentId, order: nextOrder })

  if (error) throw new Error(error.message)
  revalidatePath(`/pacjenci/${patientId}`)
}

export async function removeContentFromPatientProgram(programId: string, patientId: string, contentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")

  const { error } = await supabase
    .from("patient_program_content")
    .delete()
    .eq("program_id", programId)
    .eq("content_id", contentId)

  if (error) throw new Error(error.message)
  revalidatePath(`/pacjenci/${patientId}`)
}

export async function addExerciseToPatientProgram(programId: string, patientId: string, exercise: {
  exerciseId: string
  sets: number
  reps: number | null
  durationSeconds: number | null
  notes: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")

  const { data: existing } = await supabase
    .from("patient_program_items")
    .select("order")
    .eq("program_id", programId)
    .order("order", { ascending: false })
    .limit(1)

  const nextOrder = ((existing?.[0]?.order as number | undefined) ?? 0) + 1

  const { data, error } = await supabase
    .from("patient_program_items")
    .insert({
      program_id: programId,
      exercise_id: exercise.exerciseId,
      order: nextOrder,
      sets: exercise.sets,
      reps: exercise.reps,
      duration_seconds: exercise.durationSeconds,
      notes: exercise.notes || null,
    })
    .select(`id, order, sets, reps, duration_seconds, notes, exercises(id, name, thumbnail_url, body_part)`)
    .single()

  if (error) throw new Error(error.message)
  revalidatePath(`/pacjenci/${patientId}`)
  return data
}

export async function removePatientProgramItem(itemId: string, patientId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")

  const { error } = await supabase
    .from("patient_program_items")
    .delete()
    .eq("id", itemId)

  if (error) throw new Error(error.message)
  revalidatePath(`/pacjenci/${patientId}`)
}

export async function getPatientProgramForPrint(programId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const sb = createServiceClient()
  const { data } = await sb
    .from("patient_programs")
    .select(`
      id, name, status, start_date, end_date,
      patients(first_name, last_name),
      patient_program_items(
        id, order, sets, reps, duration_seconds, rest_seconds, notes,
        exercises(id, name, description, thumbnail_url, step_images, body_part, default_sets, default_reps, default_duration_seconds, default_rest_seconds)
      ),
      patient_program_content(
        id, order, content_id,
        educational_content(id, name, type, file_url, external_url)
      )
    `)
    .eq("id", programId)
    .eq("practitioner_id", user.id)
    .single()

  return data ?? null
}

export async function getPatientPrograms(patientId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const sb = createServiceClient()
  const { data, error } = await sb
    .from("patient_programs")
    .select(`
      id, name, status, start_date, end_date, created_at,
      patient_program_items(
        id, order, sets, reps, duration_seconds, notes,
        exercises(id, name, thumbnail_url, description)
      )
    `)
    .eq("patient_id", patientId)
    .eq("practitioner_id", user.id)
    .order("created_at", { ascending: false })

  if (error) return []
  return data
}

export async function deletePatientProgram(programId: string, patientId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")

  // Verify ownership before deleting
  const { data: prog } = await supabase
    .from("patient_programs")
    .select("id")
    .eq("id", programId)
    .eq("practitioner_id", user.id)
    .single()
  if (!prog) throw new Error("Program nie istnieje lub brak uprawnień")

  const sb = createServiceClient()

  // Delete exercise logs — no CASCADE on program_id FK
  await sb.from("patient_exercise_logs").delete().eq("program_id", programId)

  // Delete survey responses linked to this program's surveys — no CASCADE
  const { data: programSurveys } = await sb
    .from("patient_program_surveys")
    .select("id")
    .eq("program_id", programId)
  if (programSurveys?.length) {
    await sb
      .from("patient_survey_responses")
      .delete()
      .in("program_survey_id", programSurveys.map((s) => s.id))
  }

  const { error } = await supabase
    .from("patient_programs")
    .delete()
    .eq("id", programId)
    .eq("practitioner_id", user.id)

  if (error) throw new Error(error.message)
  revalidatePath(`/pacjenci/${patientId}`)
}

export async function endPatientProgram(programId: string, patientId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")

  const { error } = await supabase
    .from("patient_programs")
    .update({ status: "completed", end_date: new Date().toISOString().split("T")[0] })
    .eq("id", programId)

  if (error) throw new Error(error.message)
  revalidatePath(`/pacjenci/${patientId}`)
}
