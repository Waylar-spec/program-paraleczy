"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

function generateAccessCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
}

export async function createPatient(formData: {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  birthYear?: number
  gender?: "male" | "female" | "other"
  notes?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")

  const accessCode = generateAccessCode()

  const { data, error } = await supabase
    .from("patients")
    .insert({
      practitioner_id: user.id,
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email || null,
      phone: formData.phone || null,
      birth_year: formData.birthYear || null,
      gender: formData.gender || null,
      notes: formData.notes || null,
      access_code: accessCode,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath("/pacjenci")
  return data
}

export async function getPatients(archived = false) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  let query = supabase
    .from("patients")
    .select(`
      id,
      first_name,
      last_name,
      birth_year,
      gender,
      access_code,
      last_seen_at,
      archived_at,
      patient_programs (
        id,
        name,
        status,
        start_date,
        end_date
      )
    `)
    .eq("practitioner_id", user.id)
    .order("created_at", { ascending: false })

  query = archived ? query.not("archived_at", "is", null) : query.is("archived_at", null)

  const { data, error } = await query
  if (error) return []
  return data
}

export async function getPatient(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from("patients")
    .select(`
      *,
      patient_programs (
        id,
        name,
        status,
        start_date,
        end_date
      )
    `)
    .eq("id", id)
    .eq("practitioner_id", user.id)
    .single()

  if (error) return null
  return data
}

export async function getPatientsList() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("patients")
    .select("id, first_name, last_name")
    .eq("practitioner_id", user.id)
    .is("archived_at", null)
    .order("last_name", { ascending: true })

  if (error) return []
  return data
}

export async function archivePatient(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")

  const { error } = await supabase
    .from("patients")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id)
    .eq("practitioner_id", user.id)

  if (error) throw new Error(error.message)
  revalidatePath("/pacjenci")
}

export async function unarchivePatient(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")

  const { error } = await supabase
    .from("patients")
    .update({ archived_at: null })
    .eq("id", id)
    .eq("practitioner_id", user.id)

  if (error) throw new Error(error.message)
  revalidatePath("/pacjenci")
}

export async function updatePatient(id: string, formData: {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  birthYear?: number
  gender?: "male" | "female" | "other"
  notes?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")

  const { error } = await supabase
    .from("patients")
    .update({
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email || null,
      phone: formData.phone || null,
      birth_year: formData.birthYear || null,
      gender: formData.gender || null,
      notes: formData.notes || null,
    })
    .eq("id", id)
    .eq("practitioner_id", user.id)

  if (error) throw new Error(error.message)
  revalidatePath(`/pacjenci/${id}`)
}

export async function deletePatient(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")

  const { error } = await supabase
    .from("patients")
    .delete()
    .eq("id", id)
    .eq("practitioner_id", user.id)

  if (error) throw new Error(error.message)
  revalidatePath("/pacjenci")
}
