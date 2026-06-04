"use server"

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

// ─── Cached query (uses service client — no request-scoped cookies needed) ────

async function _fetchExercises(userId: string, bodyPart?: string, search?: string) {
  const sb = createServiceClient()
  let query = sb
    .from("exercises")
    .select("id, name, name_en, description, body_part, category, difficulty, default_sets, default_reps, default_duration_seconds, thumbnail_url, animated_gif_url, video_url, is_favorite, is_public, practitioner_id")
    .or(`practitioner_id.eq.${userId},is_public.eq.true`)
    .order("is_favorite", { ascending: false })
    .order("created_at", { ascending: false })

  if (bodyPart) query = query.eq("body_part", bodyPart)
  if (search) query = query.or(`name.ilike.%${search}%,name_en.ilike.%${search}%`)

  const { data } = await query
  return data ?? []
}

const _cachedFetchExercises = unstable_cache(
  _fetchExercises,
  ["exercises"],
  { tags: ["exercises"], revalidate: 120 },
)

export async function getExercises(filter?: { bodyPart?: string; search?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  return _cachedFetchExercises(user.id, filter?.bodyPart, filter?.search)
}

export async function uploadExerciseImage(formData: FormData): Promise<{ url: string } | { error: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Brak autoryzacji" }

    const file = formData.get("file") as File
    if (!file) return { error: "Brak pliku w formularzu" }

    const ext = (file.name ?? "file").split(".").pop()?.toLowerCase() ?? "webp"
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const storage = createServiceClient().storage

    const { error } = await storage
      .from("exercise-media")
      .upload(path, file, { contentType: file.type || "image/webp", upsert: false })

    if (error) return { error: `Storage: ${error.message}` }

    const { data: { publicUrl } } = storage.from("exercise-media").getPublicUrl(path)
    return { url: publicUrl }
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) }
  }
}

export async function createExercise(formData: {
  name: string
  description?: string
  bodyPart?: string
  category?: string
  difficulty?: number
  defaultSets?: number
  defaultReps?: number
  defaultDuration?: number
  defaultRest?: number
  videoUrl?: string
  animatedGifUrl?: string
  thumbnailUrl?: string
  stepImages?: string[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")
  const { data, error } = await supabase
    .from("exercises")
    .insert({
      practitioner_id: user.id,
      name: formData.name,
      description: formData.description || null,
      body_part: formData.bodyPart || null,
      category: formData.category || null,
      difficulty: formData.difficulty || null,
      default_sets: formData.defaultSets || null,
      default_reps: formData.defaultReps || null,
      default_duration_seconds: formData.defaultDuration || null,
      default_rest_seconds: formData.defaultRest || null,
      video_url: formData.videoUrl || null,
      animated_gif_url: formData.animatedGifUrl || null,
      thumbnail_url: formData.thumbnailUrl || null,
      step_images: formData.stepImages ?? [],
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidateTag("exercises", "max")
  revalidatePath("/biblioteka")
  return data
}

export async function updateExercise(id: string, formData: {
  name: string
  description?: string
  bodyPart?: string
  category?: string
  difficulty?: number
  defaultSets?: number
  defaultReps?: number
  defaultDuration?: number
  defaultRest?: number
  videoUrl?: string
  animatedGifUrl?: string
  thumbnailUrl?: string
  stepImages?: string[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")

  const sb = createServiceClient()

  // Allow editing own exercises AND public library exercises (practitioner_id IS NULL)
  const { data: ex } = await sb.from("exercises").select("practitioner_id").eq("id", id).single()
  if (!ex) throw new Error("Ćwiczenie nie istnieje")
  if (ex.practitioner_id !== null && ex.practitioner_id !== user.id) throw new Error("Brak uprawnień")

  const { error } = await sb
    .from("exercises")
    .update({
      name: formData.name,
      description: formData.description || null,
      body_part: formData.bodyPart || null,
      category: formData.category || null,
      difficulty: formData.difficulty || null,
      default_sets: formData.defaultSets || null,
      default_reps: formData.defaultReps || null,
      default_duration_seconds: formData.defaultDuration || null,
      default_rest_seconds: formData.defaultRest || null,
      video_url: formData.videoUrl || null,
      animated_gif_url: formData.animatedGifUrl || null,
      thumbnail_url: formData.thumbnailUrl || null,
      step_images: formData.stepImages ?? [],
    })
    .eq("id", id)

  if (error) throw new Error(error.message)
  revalidateTag("exercises", "max")
  revalidatePath("/biblioteka")
}

export async function deleteExercise(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")

  const sb = createServiceClient()

  // Verify the exercise exists and belongs to this user or is a public library exercise
  const { data: ex } = await sb.from("exercises").select("practitioner_id").eq("id", id).single()
  if (!ex) throw new Error("Ćwiczenie nie istnieje")
  if (ex.practitioner_id !== null && ex.practitioner_id !== user.id) throw new Error("Brak uprawnień")

  // Remove FK references before deleting (logs use program_item_id, not exercise_id directly)
  await Promise.all([
    sb.from("program_template_items").delete().eq("exercise_id", id),
    sb.from("patient_program_items").delete().eq("exercise_id", id),
  ])

  const { error } = await sb.from("exercises").delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidateTag("exercises", "max")
  revalidatePath("/biblioteka")
}

export async function toggleFavorite(id: string, isFavorite: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")

  const { error } = await supabase
    .from("exercises")
    .update({ is_favorite: isFavorite })
    .eq("id", id)
    .eq("practitioner_id", user.id)

  if (error) throw new Error(error.message)
  revalidateTag("exercises", "max")
  revalidatePath("/biblioteka")
}

export async function getExerciseTemplateUsage(exerciseId: string): Promise<{ id: string; name: string }[]> {
  const sb = createServiceClient()
  const { data } = await sb
    .from("program_template_items")
    .select("program_templates(id, name)")
    .eq("exercise_id", exerciseId)
  if (!data) return []
  const seen = new Set<string>()
  const result: { id: string; name: string }[] = []
  for (const row of data) {
    const t = Array.isArray(row.program_templates) ? row.program_templates[0] : row.program_templates
    if (t && !seen.has(t.id)) {
      seen.add(t.id)
      result.push({ id: t.id, name: t.name })
    }
  }
  return result.sort((a, b) => a.name.localeCompare(b.name, "pl"))
}

export async function getExercisesByIds(ids: string[]) {
  if (!ids.length) return []
  const sb = createServiceClient()
  const { data } = await sb
    .from("exercises")
    .select("id, name, description, body_part, thumbnail_url, animated_gif_url, video_url, step_images, default_sets, default_reps, default_duration_seconds, default_rest_seconds")
    .in("id", ids)
  return data ?? []
}
