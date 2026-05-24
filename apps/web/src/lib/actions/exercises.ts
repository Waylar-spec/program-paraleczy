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

export async function uploadExerciseImage(formData: FormData): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")

  const file = formData.get("file") as File
  if (!file) throw new Error("Brak pliku")

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
  const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { createServiceClient } = await import("@/lib/supabase/service")
  const storage = createServiceClient().storage

  const { error } = await storage
    .from("exercises")
    .upload(path, file, { contentType: file.type || "image/webp", upsert: false })

  if (error) throw new Error(error.message)

  const { data: { publicUrl } } = storage.from("exercises").getPublicUrl(path)
  return publicUrl
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
  thumbnailUrl?: string
  stepImages?: string[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")

  const { error } = await supabase
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
      thumbnail_url: formData.thumbnailUrl || null,
      step_images: formData.stepImages ?? [],
    })
    .eq("id", id)
    .eq("practitioner_id", user.id)

  if (error) throw new Error(error.message)
  revalidateTag("exercises", "max")
  revalidatePath("/biblioteka")
}

export async function deleteExercise(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")

  const { error } = await supabase
    .from("exercises")
    .delete()
    .eq("id", id)
    .eq("practitioner_id", user.id)

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

export async function getExercisesByIds(ids: string[]) {
  if (!ids.length) return []
  const sb = createServiceClient()
  const { data } = await sb
    .from("exercises")
    .select("id, name, description, body_part, thumbnail_url, animated_gif_url, video_url, step_images, default_sets, default_reps, default_duration_seconds, default_rest_seconds")
    .in("id", ids)
  return data ?? []
}
