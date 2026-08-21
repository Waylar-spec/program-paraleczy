"use server"

import { createClient } from "@/lib/supabase/server"

export type PractitionerNote = {
  id: string
  content: string
  completed_at: string | null
  created_at: string
}

const ARCHIVE_RETENTION_DAYS = 30

export async function getNotes(): Promise<PractitionerNote[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const cutoff = new Date(Date.now() - ARCHIVE_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString()
  await supabase
    .from("practitioner_notes")
    .delete()
    .eq("practitioner_id", user.id)
    .not("completed_at", "is", null)
    .lt("completed_at", cutoff)

  const { data, error } = await supabase
    .from("practitioner_notes")
    .select("id, content, completed_at, created_at")
    .eq("practitioner_id", user.id)
    .order("created_at", { ascending: false })

  if (error) return []
  return data
}

export async function createNote(content: string): Promise<PractitionerNote> {
  const trimmed = content.trim()
  if (!trimmed) throw new Error("Notatka nie może być pusta")

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")

  const { data, error } = await supabase
    .from("practitioner_notes")
    .insert({ practitioner_id: user.id, content: trimmed })
    .select("id, content, completed_at, created_at")
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function toggleNote(id: string, completed: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")

  const { error } = await supabase
    .from("practitioner_notes")
    .update({ completed_at: completed ? new Date().toISOString() : null })
    .eq("id", id)
    .eq("practitioner_id", user.id)

  if (error) throw new Error(error.message)
}

export async function deleteNote(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")

  const { error } = await supabase
    .from("practitioner_notes")
    .delete()
    .eq("id", id)
    .eq("practitioner_id", user.id)

  if (error) throw new Error(error.message)
}
