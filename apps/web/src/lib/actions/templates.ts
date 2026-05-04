"use server"

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

// ─── Cached query ─────────────────────────────────────────────────────────────

async function _fetchTemplates(userId: string) {
  const sb = createServiceClient()
  const { data } = await sb
    .from("program_templates")
    .select(`
      id,
      name,
      description,
      body_part,
      program_template_items (
        id,
        order,
        sets,
        reps,
        duration_seconds,
        rest_seconds,
        notes,
        exercises (
          id,
          name,
          body_part,
          thumbnail_url
        )
      )
    `)
    .or(`practitioner_id.eq.${userId},is_public.eq.true`)
    .order("created_at", { ascending: false })
  return data ?? []
}

const _cachedFetchTemplates = unstable_cache(
  _fetchTemplates,
  ["templates"],
  { tags: ["templates"], revalidate: 120 },
)

export async function getTemplates() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  return _cachedFetchTemplates(user.id)
}

export async function getTemplate(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // First fetch the template with all joins including surveys
  const { data, error } = await supabase
    .from("program_templates")
    .select(`
      *,
      program_template_items (
        id,
        order,
        sets,
        reps,
        duration_seconds,
        rest_seconds,
        notes,
        exercises (
          id,
          name,
          description,
          body_part,
          category,
          difficulty,
          thumbnail_url,
          step_images,
          default_sets,
          default_reps,
          default_duration_seconds,
          default_rest_seconds
        )
      ),
      program_template_content (
        id,
        order,
        content_id,
        educational_content ( id, name, type, file_url, external_url )
      )
    `)
    .or(`practitioner_id.eq.${user.id},is_public.eq.true`)
    .eq("id", id)
    .single()

  if (error) return null

  // Fetch surveys separately so a missing table doesn't break the whole page
  let templateSurveys: any[] = []
  try {
    const { data: surveysData } = await (supabase as any)
      .from("program_template_surveys")
      .select("id, survey_id, schedule, order, surveys ( id, name, description, is_public, practitioner_id )")
      .eq("template_id", id)
      .order("order", { ascending: true })
    templateSurveys = surveysData ?? []
  } catch {
    // table may not exist yet — silently ignore
  }

  return { ...data, program_template_surveys: templateSurveys }
}

export async function createTemplate(formData: {
  name: string
  description?: string
  bodyPart?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")

  const { data, error } = await supabase
    .from("program_templates")
    .insert({
      practitioner_id: user.id,
      name: formData.name,
      description: formData.description || null,
      body_part: formData.bodyPart || null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidateTag("templates", "max")
  revalidatePath("/biblioteka/szablony")
  return data
}

export async function addExerciseToTemplate(templateId: string, exerciseId: string, params: {
  sets?: number
  reps?: number
  duration?: number
  rest?: number
  notes?: string
  order: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")

  const { error } = await supabase
    .from("program_template_items")
    .insert({
      template_id: templateId,
      exercise_id: exerciseId,
      order: params.order,
      sets: params.sets || null,
      reps: params.reps || null,
      duration_seconds: params.duration || null,
      rest_seconds: params.rest || null,
      notes: params.notes || null,
    })

  if (error) throw new Error(error.message)
  revalidateTag("templates", "max")
  revalidatePath(`/biblioteka/szablony/${templateId}`)
}

export async function removeExerciseFromTemplate(itemId: string, templateId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")

  const { error } = await supabase
    .from("program_template_items")
    .delete()
    .eq("id", itemId)

  if (error) throw new Error(error.message)
  revalidateTag("templates", "max")
  revalidatePath(`/biblioteka/szablony/${templateId}`)
}

export async function addContentToTemplate(templateId: string, contentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")

  const { data: existing } = await supabase
    .from("program_template_content")
    .select("order")
    .eq("template_id", templateId)
    .order("order", { ascending: false })
    .limit(1)

  const nextOrder = ((existing?.[0]?.order as number | undefined) ?? 0) + 1

  const { error } = await supabase
    .from("program_template_content")
    .insert({ template_id: templateId, content_id: contentId, order: nextOrder })

  if (error) throw new Error(error.message)
  revalidateTag("templates", "max")
  revalidatePath(`/biblioteka/szablony/${templateId}`)
}

export async function removeContentFromTemplate(templateId: string, contentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")

  const { error } = await supabase
    .from("program_template_content")
    .delete()
    .eq("template_id", templateId)
    .eq("content_id", contentId)

  if (error) throw new Error(error.message)
  revalidateTag("templates", "max")
  revalidatePath(`/biblioteka/szablony/${templateId}`)
}

export async function updateTemplate(templateId: string, params: {
  name?: string
  description?: string
  bodyPart?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")

  const { error } = await supabase
    .from("program_templates")
    .update({
      ...(params.name !== undefined && { name: params.name }),
      ...(params.description !== undefined && { description: params.description }),
      ...(params.bodyPart !== undefined && { body_part: params.bodyPart }),
    })
    .eq("id", templateId)
    .eq("practitioner_id", user.id)

  if (error) throw new Error(error.message)
  revalidateTag("templates", "max")
  revalidatePath("/biblioteka/szablony")
  revalidatePath(`/biblioteka/szablony/${templateId}`)
}

export async function addSurveyToTemplate(templateId: string, surveyId: string, schedule: string = "on_start") {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")

  const { data: existing } = await (supabase as any)
    .from("program_template_surveys")
    .select("order")
    .eq("template_id", templateId)
    .order("order", { ascending: false })
    .limit(1)

  const nextOrder = ((existing?.[0]?.order as number | undefined) ?? 0) + 1

  const { error } = await (supabase as any)
    .from("program_template_surveys")
    .insert({ template_id: templateId, survey_id: surveyId, schedule, order: nextOrder })

  if (error) throw new Error(error.message)
  revalidateTag("templates", "max")
  revalidatePath(`/biblioteka/szablony/${templateId}`)
}

export async function removeSurveyFromTemplate(templateId: string, surveyId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")

  const { error } = await (supabase as any)
    .from("program_template_surveys")
    .delete()
    .eq("template_id", templateId)
    .eq("survey_id", surveyId)

  if (error) throw new Error(error.message)
  revalidateTag("templates", "max")
  revalidatePath(`/biblioteka/szablony/${templateId}`)
}

export async function updateTemplateItem(itemId: string, templateId: string, params: {
  sets?: number | null
  reps?: number | null
  duration?: number | null
  rest?: number | null
  notes?: string | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")

  const { error } = await supabase
    .from("program_template_items")
    .update({
      sets: params.sets,
      reps: params.reps,
      duration_seconds: params.duration,
      rest_seconds: params.rest,
      notes: params.notes,
    })
    .eq("id", itemId)

  if (error) throw new Error(error.message)
  revalidateTag("templates", "max")
  revalidatePath(`/biblioteka/szablony/${templateId}`)
}

export async function deleteTemplate(templateId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")

  const { error } = await supabase
    .from("program_templates")
    .delete()
    .eq("id", templateId)
    .eq("practitioner_id", user.id)

  if (error) throw new Error(error.message)
  revalidateTag("templates", "max")
  revalidatePath("/biblioteka/szablony")
}
