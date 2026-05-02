"use server"

import { createClient } from "@/lib/supabase/server"

export async function getPractitionerProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from("practitioners")
    .select("first_name, last_name, practice_name, practice_address, practice_city, practice_postal_code, logo_url")
    .eq("id", user.id)
    .single()

  return data ?? null
}

export async function getPractitioner() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from("practitioners")
    .select(
      "first_name, last_name, email, phone, practice_name, practice_address, practice_city, practice_postal_code, practice_website"
    )
    .eq("id", user.id)
    .single()

  return data ?? null
}

export async function updatePractitioner(input: {
  firstName: string
  lastName: string
  phone: string
  practiceName: string
  practiceAddress: string
  practiceCity: string
  practicePostalCode: string
  practiceWebsite: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")

  const { error } = await supabase
    .from("practitioners")
    .upsert(
      {
        id: user.id,
        email: user.email ?? "",          // required for insert (NOT NULL)
        first_name: input.firstName,
        last_name: input.lastName,
        phone: input.phone || null,
        practice_name: input.practiceName || null,
        practice_address: input.practiceAddress || null,
        practice_city: input.practiceCity || null,
        practice_postal_code: input.practicePostalCode || null,
        practice_website: input.practiceWebsite || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )

  if (error) throw new Error(error.message)
}
