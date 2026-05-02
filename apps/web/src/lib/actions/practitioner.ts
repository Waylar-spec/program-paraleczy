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
