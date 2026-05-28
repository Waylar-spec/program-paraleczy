"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

const AFFILIATE_SUFFIX = "?sca_ref=11220768.wIBh3GWahK"

export type Supplement = {
  id: string
  formeds_handle: string
  name: string
  product_type: string | null
  image_url: string | null
  price: number | null
  description: string | null
  tags: string | null
  is_active: boolean
}

export type PatientSupplement = {
  id: string
  patient_id: string
  supplement_id: string
  practitioner_id: string | null
  notes: string | null
  created_at: string
  supplements: Supplement
}

// ── Read ─────────────────────────────────────────────────────────────────────

export async function getSupplements(search?: string): Promise<Supplement[]> {
  const sb = createServiceClient()
  let q = sb
    .from("supplements")
    .select("id, formeds_handle, name, product_type, image_url, price, description, tags, is_active")
    .eq("is_active", true)
    .order("name")

  if (search) {
    q = q.or(`name.ilike.%${search}%,product_type.ilike.%${search}%,tags.ilike.%${search}%`)
  }

  const { data, error } = await q
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getPatientSupplements(patientId: string): Promise<PatientSupplement[]> {
  const sb = createServiceClient()
  const { data, error } = await sb
    .from("patient_supplements")
    .select(`
      id, patient_id, supplement_id, practitioner_id, notes, created_at,
      supplements(id, formeds_handle, name, product_type, image_url, price, description, tags, is_active)
    `)
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as PatientSupplement[]
}

// For patient portal — no auth required, uses service client
export async function getPatientSupplementsForPortal(patientId: string) {
  const sb = createServiceClient()
  const { data } = await sb
    .from("patient_supplements")
    .select(`
      id, notes,
      supplements(formeds_handle, name, product_type, image_url, price)
    `)
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false })

  return (data ?? []).map((row: any) => ({
    id: row.id,
    notes: row.notes,
    name: row.supplements.name,
    product_type: row.supplements.product_type,
    image_url: row.supplements.image_url,
    price: row.supplements.price,
    affiliate_url: `https://formeds.pl/products/${row.supplements.formeds_handle}${AFFILIATE_SUFFIX}`,
  }))
}

// ── Write ─────────────────────────────────────────────────────────────────────

export async function prescribeSupplement(patientId: string, supplementId: string, notes?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")

  // Use service client to bypass RLS for insert
  const sb = createServiceClient()
  const { error } = await sb
    .from("patient_supplements")
    .insert({
      patient_id: patientId,
      supplement_id: supplementId,
      practitioner_id: user.id,
      notes: notes || null,
    })

  if (error) throw new Error(error.message)
  revalidatePath(`/pacjenci/${patientId}`)
}

export async function removePatientSupplement(patientSupplementId: string, patientId: string) {
  const sb = createServiceClient()
  const { error } = await sb
    .from("patient_supplements")
    .delete()
    .eq("id", patientSupplementId)

  if (error) throw new Error(error.message)
  revalidatePath(`/pacjenci/${patientId}`)
}
