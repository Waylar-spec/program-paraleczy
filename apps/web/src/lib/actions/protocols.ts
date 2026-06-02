"use server"

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { sendProgramAssignedEmail } from "@/lib/email"

// ─── Types ────────────────────────────────────────────────────────────────────

export type Protocol = {
  id: string
  name: string
  description: string | null
  indication: string | null
  total_weeks: number | null
  body_part: string | null
  is_public: boolean
  practitioner_id: string | null
  created_at: string
  protocol_phases: Phase[]
}

export type Phase = {
  id: string
  protocol_id: string
  order: number
  name: string
  description: string | null
  goals: string | null
  duration_weeks: number
  template_id: string | null
  program_templates?: { id: string; name: string } | null
}

// ─── Cached query ─────────────────────────────────────────────────────────────

async function _fetchProtocols(userId: string) {
  const sb = createServiceClient()
  const { data } = await sb
    .from("rehabilitation_protocols")
    .select("id, name, description, indication, total_weeks, body_part, is_public, practitioner_id, created_at, protocol_phases(id, order, name, duration_weeks)")
    .or(`practitioner_id.eq.${userId},is_public.eq.true`)
    .order("created_at", { ascending: false })
  return data ?? []
}

const _cachedFetchProtocols = unstable_cache(
  _fetchProtocols,
  ["protocols"],
  { tags: ["protocols"], revalidate: 120 },
)

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getProtocols() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  return _cachedFetchProtocols(user.id)
}

export async function getProtocol(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const sb = createServiceClient()

  const { data, error } = await supabase
    .from("rehabilitation_protocols")
    .select(`
      id, name, description, indication, total_weeks, body_part, is_public, practitioner_id, created_at,
      protocol_phases(id, protocol_id, order, name, description, goals, patient_intro, rules, duration_weeks, template_id,
        program_templates(id, name)
      )
    `)
    .eq("id", id)
    .or(`practitioner_id.eq.${user.id},is_public.eq.true`)
    .single()

  if (error) return null

  // Fetch protocol supplements
  let protocolSupplements: any[] = []
  try {
    const { data: suppData } = await sb
      .from("protocol_supplements")
      .select("id, supplement_id, notes, supplements(id, formeds_handle, name, product_type, image_url, price)")
      .eq("protocol_id", id)
      .order("created_at", { ascending: true })
    protocolSupplements = suppData ?? []
  } catch { /* skip */ }

  return { ...data, protocol_supplements: protocolSupplements }
}

export async function addSupplementToProtocol(protocolId: string, supplementId: string, notes?: string) {
  const sb = createServiceClient()
  const { error } = await sb
    .from("protocol_supplements")
    .insert({ protocol_id: protocolId, supplement_id: supplementId, notes: notes || null })
  if (error) throw new Error(error.message)
  revalidateTag("protocols", "max")
  revalidatePath(`/biblioteka/protokoly/${protocolId}`)
}

export async function removeSupplementFromProtocol(protocolId: string, supplementId: string) {
  const sb = createServiceClient()
  const { error } = await sb
    .from("protocol_supplements")
    .delete()
    .eq("protocol_id", protocolId)
    .eq("supplement_id", supplementId)
  if (error) throw new Error(error.message)
  revalidateTag("protocols", "max")
  revalidatePath(`/biblioteka/protokoly/${protocolId}`)
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createProtocol(formData: {
  name: string
  description?: string
  indication?: string
  bodyPart?: string
  totalWeeks?: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")

  const { data, error } = await supabase
    .from("rehabilitation_protocols")
    .insert({
      practitioner_id: user.id,
      name: formData.name,
      description: formData.description || null,
      indication: formData.indication || null,
      body_part: formData.bodyPart || null,
      total_weeks: formData.totalWeeks || null,
    })
    .select("id")
    .single()

  if (error) throw new Error(error.message)
  // redirect must be outside try/catch — call it after error check
  redirect(`/biblioteka/protokoly/${data.id}`)
}

export async function updateProtocol(id: string, formData: {
  name?: string
  description?: string
  indication?: string
  bodyPart?: string
  totalWeeks?: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")

  // Use service client so system protocols (practitioner_id = null) can also be edited
  const sb = createServiceClient()
  const { error } = await sb
    .from("rehabilitation_protocols")
    .update({
      ...(formData.name && { name: formData.name }),
      ...(formData.description !== undefined && { description: formData.description || null }),
      ...(formData.indication !== undefined && { indication: formData.indication || null }),
      ...(formData.bodyPart !== undefined && { body_part: formData.bodyPart || null }),
      ...(formData.totalWeeks !== undefined && { total_weeks: formData.totalWeeks || null }),
    })
    .eq("id", id)

  if (error) throw new Error(error.message)
  revalidateTag("protocols", "max")
  revalidatePath(`/biblioteka/protokoly/${id}`)
  revalidatePath("/biblioteka/protokoly")
}

export async function deleteProtocol(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")

  const sb = createServiceClient()

  // Verify protocol exists (allow deleting public/system protocols too)
  const { data: proto } = await sb.from("rehabilitation_protocols").select("id").eq("id", id).single()
  if (!proto) throw new Error("Protokół nie istnieje")

  // Cascade: patient_protocols → patient_programs linked via protocol phases
  const { data: patientProtocols } = await sb
    .from("patient_protocols")
    .select("id")
    .eq("protocol_id", id)
  if (patientProtocols?.length) {
    await sb.from("patient_protocols").delete().eq("protocol_id", id)
  }

  // Delete protocol phases (FK from phases to protocol)
  await sb.from("protocol_phases").delete().eq("protocol_id", id)

  const { error } = await sb.from("rehabilitation_protocols").delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidateTag("protocols", "max")
  revalidatePath("/biblioteka/protokoly")
}

export async function addPhase(protocolId: string, formData: {
  name: string
  description?: string
  goals?: string
  patientIntro?: string
  rules?: string
  durationWeeks: number
  templateId?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")

  // get current phase count for order
  const { count } = await supabase
    .from("protocol_phases")
    .select("id", { count: "exact", head: true })
    .eq("protocol_id", protocolId)

  const { error } = await supabase
    .from("protocol_phases")
    .insert({
      protocol_id: protocolId,
      order: (count ?? 0) + 1,
      name: formData.name,
      description: formData.description || null,
      goals: formData.goals || null,
      patient_intro: formData.patientIntro || null,
      rules: formData.rules || null,
      duration_weeks: formData.durationWeeks,
      template_id: formData.templateId || null,
    })

  if (error) throw new Error(error.message)
  revalidateTag("protocols", "max")
  revalidatePath(`/biblioteka/protokoly/${protocolId}`)
}

export async function updatePhase(phaseId: string, protocolId: string, formData: {
  name?: string
  description?: string
  goals?: string
  patientIntro?: string
  rules?: string
  durationWeeks?: number
  templateId?: string | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")

  const { error } = await supabase
    .from("protocol_phases")
    .update({
      ...(formData.name && { name: formData.name }),
      ...(formData.description !== undefined && { description: formData.description || null }),
      ...(formData.goals !== undefined && { goals: formData.goals || null }),
      ...(formData.patientIntro !== undefined && { patient_intro: formData.patientIntro || null }),
      ...(formData.rules !== undefined && { rules: formData.rules || null }),
      ...(formData.durationWeeks && { duration_weeks: formData.durationWeeks }),
      ...(formData.templateId !== undefined && { template_id: formData.templateId || null }),
    })
    .eq("id", phaseId)

  if (error) throw new Error(error.message)
  revalidateTag("protocols", "max")
  revalidatePath(`/biblioteka/protokoly/${protocolId}`)
}

export async function deletePhase(phaseId: string, protocolId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")

  const { error } = await supabase
    .from("protocol_phases")
    .delete()
    .eq("id", phaseId)

  if (error) throw new Error(error.message)
  revalidateTag("protocols", "max")
  revalidatePath(`/biblioteka/protokoly/${protocolId}`)
}

// ─── Internal helper ──────────────────────────────────────────────────────────
// Creates a patient_program from a phase template. Used by both
// assignProtocolToPatient and advancePhase to avoid duplication.

async function _createPatientProgramFromPhase(
  phase: { template_id: string; duration_weeks: number; name?: string },
  params: { patientId: string; practitionerId: string; startDate: string },
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>
) {
  const sb = createServiceClient()
  const { data: template } = await sb
    .from("program_templates")
    .select("name, program_template_items(id, exercise_id, order, sets, reps, duration_seconds, rest_seconds, notes), program_template_content(content_id, order)")
    .eq("id", phase.template_id)
    .single()

  if (!template) return null

  const endDate = new Date(
    new Date(params.startDate).getTime() + phase.duration_weeks * 7 * 24 * 60 * 60 * 1000
  ).toISOString().split("T")[0]

  const { data: program } = await supabase
    .from("patient_programs")
    .insert({
      patient_id: params.patientId,
      practitioner_id: params.practitionerId,
      template_id: phase.template_id,
      name: template.name,
      status: "active",
      start_date: params.startDate,
      end_date: endDate,
    })
    .select("id")
    .single()

  if (!program) return null

  const items = (template.program_template_items as any[] ?? []).map((item) => ({
    program_id: program.id,
    exercise_id: item.exercise_id,
    order: item.order,
    sets: item.sets,
    reps: item.reps,
    duration_seconds: item.duration_seconds,
    rest_seconds: item.rest_seconds,
    notes: item.notes,
  }))
  if (items.length) await supabase.from("patient_program_items").insert(items)

  const contentRows = (template.program_template_content as { content_id: string; order: number }[] ?? []).map((tc) => ({
    program_id: program.id,
    content_id: tc.content_id,
    order: tc.order,
  }))
  if (contentRows.length) await supabase.from("patient_program_content").insert(contentRows)

  return program
}

// ─── Patient protocol assignment ──────────────────────────────────────────────

export async function assignProtocolToPatient(patientId: string, protocolId: string, startDate: string, startWeek?: number, customName?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")

  const sb2 = createServiceClient()

  const [{ data: allPhases }, { data: patient }, { data: practitioner }, { data: protocol }] = await Promise.all([
    supabase
      .from("protocol_phases")
      .select("id, order, duration_weeks, template_id, name")
      .eq("protocol_id", protocolId)
      .order("order", { ascending: true }),
    supabase
      .from("patients")
      .select("first_name, last_name, email, access_code")
      .eq("id", patientId)
      .single(),
    supabase
      .from("practitioners")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single(),
    supabase
      .from("rehabilitation_protocols")
      .select("name")
      .eq("id", protocolId)
      .single(),
  ])

  // Fetch protocol-level supplements
  let protocolSupplements: { supplement_id: string; notes: string | null }[] = []
  try {
    const { data: suppData } = await sb2
      .from("protocol_supplements")
      .select("supplement_id, notes")
      .eq("protocol_id", protocolId)
    protocolSupplements = suppData ?? []
  } catch { /* skip */ }

  const phases = allPhases ?? []

  let startingPhase: { id: string } | null = phases[0] ?? null

  if (startWeek && startWeek > 0 && phases.length > 0) {
    let cumulative = 0
    for (const phase of phases) {
      cumulative += phase.duration_weeks
      if (startWeek <= cumulative) {
        startingPhase = phase
        break
      }
    }
    if (!startingPhase) startingPhase = phases[phases.length - 1]
  }

  const firstPhase = startingPhase as (typeof phases[0] & { template_id?: string | null; name?: string }) | null

  const { error } = await supabase
    .from("patient_protocols")
    .insert({
      patient_id: patientId,
      practitioner_id: user.id,
      protocol_id: protocolId,
      current_phase_id: firstPhase?.id || null,
      start_date: startDate,
      status: "active",
      ...(customName?.trim() ? { custom_name: customName.trim() } : {}),
    })

  if (error) throw new Error(error.message)

  // Auto-create a patient_program for the starting phase so the patient can access exercises immediately
  if (firstPhase?.template_id) {
    await _createPatientProgramFromPhase(
      { template_id: firstPhase.template_id, duration_weeks: firstPhase.duration_weeks ?? 4 },
      { patientId, practitionerId: user.id, startDate },
      supabase
    )
  }

  // Auto-prescribe protocol-level supplements
  if (protocolSupplements.length > 0) {
    try {
      const suppRows = protocolSupplements.map((ps) => ({
        patient_id: patientId,
        supplement_id: ps.supplement_id,
        practitioner_id: user.id,
        notes: ps.notes,
      }))
      await sb2.from("patient_supplements").upsert(suppRows, { onConflict: "patient_id,supplement_id", ignoreDuplicates: true })
    } catch { /* skip */ }
  }

  if (patient?.email && patient.access_code && protocol?.name) {
    const practitionerName = practitioner
      ? `${practitioner.first_name} ${practitioner.last_name}`.trim()
      : "Twój fizjoterapeuta"
    sendProgramAssignedEmail({
      toEmail: patient.email,
      patientName: `${patient.first_name} ${patient.last_name}`.trim(),
      programName: protocol.name,
      accessCode: patient.access_code,
      practitionerName,
    }).catch(() => {})
  }

  revalidatePath(`/pacjenci/${patientId}`)
}

export async function advancePhase(patientProtocolId: string, patientId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")

  const { data: pp } = await supabase
    .from("patient_protocols")
    .select("current_phase_id, protocol_id")
    .eq("id", patientProtocolId)
    .single()

  if (!pp) throw new Error("Nie znaleziono protokołu pacjenta")

  const { data: allPhases } = await supabase
    .from("protocol_phases")
    .select("id, name, order, template_id, duration_weeks")
    .eq("protocol_id", pp.protocol_id)
    .order("order", { ascending: true })

  const phases = allPhases ?? []

  const currentPhase = pp.current_phase_id
    ? phases.find((p) => p.id === pp.current_phase_id) ?? null
    : null

  const currentOrder = currentPhase?.order ?? -1
  const nextPhase = phases.find((p) => p.order > currentOrder) ?? null

  if (!nextPhase) {
    await supabase
      .from("patient_protocols")
      .update({ status: "completed" })
      .eq("id", patientProtocolId)
  } else {
    await supabase
      .from("patient_protocols")
      .update({ current_phase_id: nextPhase.id })
      .eq("id", patientProtocolId)

    // Auto-assign the phase's exercise template to the patient
    if (nextPhase.template_id) {
      const advanceDate = new Date().toISOString().split("T")[0]
      await _createPatientProgramFromPhase(
        { template_id: nextPhase.template_id, duration_weeks: nextPhase.duration_weeks },
        { patientId, practitionerId: user.id, startDate: advanceDate },
        supabase
      )
    }
  }

  revalidatePath(`/pacjenci/${patientId}`)
}


export async function setPatientPhase(patientProtocolId: string, patientId: string, phaseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")

  const { error } = await supabase
    .from("patient_protocols")
    .update({ current_phase_id: phaseId, status: "active" })
    .eq("id", patientProtocolId)
    .eq("practitioner_id", user.id)

  if (error) throw new Error(error.message)
  revalidatePath(`/pacjenci/${patientId}`)
}

export async function updatePatientProtocol(
  patientProtocolId: string,
  patientId: string,
  data: { customName?: string | null; startDate?: string }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")

  const updateData: Record<string, unknown> = {}
  if (data.customName !== undefined) updateData.custom_name = data.customName?.trim() || null
  if (data.startDate) updateData.start_date = data.startDate

  if (!Object.keys(updateData).length) return

  const { error } = await supabase
    .from("patient_protocols")
    .update(updateData)
    .eq("id", patientProtocolId)
    .eq("practitioner_id", user.id)

  if (error) throw new Error(error.message)
  revalidatePath(`/pacjenci/${patientId}`)
}

export async function removePatientProtocol(patientProtocolId: string, patientId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")

  const { error } = await supabase
    .from("patient_protocols")
    .delete()
    .eq("id", patientProtocolId)
    .eq("practitioner_id", user.id)

  if (error) throw new Error(error.message)
  revalidatePath(`/pacjenci/${patientId}`)
}

export async function getPatientProtocols(patientId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("patient_protocols")
    .select(`
      id, status, start_date, current_phase_id, created_at, custom_name,
      rehabilitation_protocols(id, name, body_part, total_weeks,
        protocol_phases(id, order, name, duration_weeks)
      )
    `)
    .eq("patient_id", patientId)
    .eq("practitioner_id", user.id)
    .order("created_at", { ascending: false })

  if (error) return []

  // Resolve current_phase from the protocol's phases list
  // rehabilitation_protocols comes as array from PostgREST but is always a single object (FK)
  return data.map((pp) => {
    const proto = Array.isArray(pp.rehabilitation_protocols)
      ? pp.rehabilitation_protocols[0]
      : pp.rehabilitation_protocols
    const phases = (proto as { protocol_phases?: { id: string; order: number; name: string; duration_weeks: number }[] })?.protocol_phases ?? []
    const currentPhase = phases.find((ph) => ph.id === pp.current_phase_id) ?? null
    return { ...pp, rehabilitation_protocols: proto, current_phase: currentPhase }
  })
}
