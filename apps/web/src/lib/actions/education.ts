"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

export async function getEducationalContent() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("educational_content")
    .select("id, name, type, file_url, external_url, body_part, is_favorite, created_at, practitioner_id")
    .or(`practitioner_id.eq.${user.id},practitioner_id.is.null`)
    .order("is_favorite", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) return []
  return data
}

export async function createEducationalContent(formData: {
  name: string
  type: "pdf" | "video" | "link" | "image"
  fileUrl?: string
  externalUrl?: string
  bodyPart?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")

  const { data, error } = await supabase
    .from("educational_content")
    .insert({
      practitioner_id: user.id,
      name: formData.name,
      type: formData.type,
      file_url: formData.fileUrl || null,
      external_url: formData.externalUrl || null,
      body_part: formData.bodyPart || null,
    })
    .select("id")
    .single()

  if (error) throw new Error(error.message)
  revalidatePath("/biblioteka/edukacja")
  return data
}

export async function deleteEducationalContent(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")

  const { data: item } = await supabase
    .from("educational_content")
    .select("file_url")
    .eq("id", id)
    .eq("practitioner_id", user.id)
    .single()

  if (item?.file_url?.includes("supabase")) {
    const service = createServiceClient()
    const path = item.file_url.split("/storage/v1/object/public/education/")[1]
    if (path) await service.storage.from("education").remove([path])
  }

  const { error } = await supabase
    .from("educational_content")
    .delete()
    .eq("id", id)
    .eq("practitioner_id", user.id)

  if (error) throw new Error(error.message)
  revalidatePath("/biblioteka/edukacja")
}

export async function toggleEducationFavorite(id: string, value: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")

  await supabase
    .from("educational_content")
    .update({ is_favorite: value })
    .eq("id", id)
    .eq("practitioner_id", user.id)

  revalidatePath("/biblioteka/edukacja")
}

export async function getUploadUrl(fileName: string, contentType: string) {
  const service = createServiceClient()
  const ext = fileName.split(".").pop()
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { data, error } = await service.storage
    .from("education")
    .createSignedUploadUrl(path)

  if (error) throw new Error(error.message)
  return { signedUrl: data.signedUrl, path, token: data.token }
}

export async function getPublicUrl(path: string) {
  const service = createServiceClient()
  const { data } = service.storage.from("education").getPublicUrl(path)
  return data.publicUrl
}
