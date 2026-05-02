"use server"

import { createServiceClient } from "@/lib/supabase/service"

export async function getPatientMessages(patientId: string) {
  const supabase = createServiceClient()

  const { data } = await supabase
    .from("messages")
    .select("id, sender_type, content, read_at, created_at")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: true })

  return data ?? []
}

export async function sendPatientMessage(patientId: string, content: string) {
  const supabase = createServiceClient()

  // Get practitioner_id for this patient
  const { data: patient } = await supabase
    .from("patients")
    .select("practitioner_id")
    .eq("id", patientId)
    .single()

  if (!patient?.practitioner_id) throw new Error("Nie znaleziono fizjoterapeuty")

  const { data, error } = await supabase
    .from("messages")
    .insert({
      practitioner_id: patient.practitioner_id,
      patient_id: patientId,
      sender_type: "patient",
      content: content.trim(),
    })
    .select("id, sender_type, content, read_at, created_at")
    .single()

  if (error) throw new Error(error.message)
  return data
}
