"use server"

import { createClient } from "@/lib/supabase/server"

export async function getPatientAdherence(patientId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Get active programs with their items
  const { data: programs } = await supabase
    .from("patient_programs")
    .select(`
      id, name, start_date, end_date, status,
      patient_program_items(id)
    `)
    .eq("patient_id", patientId)
    .eq("practitioner_id", user.id)
    .order("created_at", { ascending: false })

  if (!programs?.length) return []

  // Get logs for the last 30 days for all programs
  const since = new Date()
  since.setDate(since.getDate() - 30)

  const { data: logs } = await supabase
    .from("patient_exercise_logs")
    .select("program_id, program_item_id, logged_at, pain_after")
    .eq("patient_id", patientId)
    .gte("logged_at", since.toISOString())

  const logsByProgram = new Map<string, typeof logs>()
  for (const log of logs ?? []) {
    const arr = logsByProgram.get(log.program_id) ?? []
    arr.push(log)
    logsByProgram.set(log.program_id, arr)
  }

  return programs.map((prog) => {
    const totalItems = (prog.patient_program_items ?? []).length
    const progLogs = logsByProgram.get(prog.id) ?? []

    // Unique items done (last 30 days)
    const doneLast30 = new Set(progLogs.map((l) => l.program_item_id)).size
    const pct = totalItems > 0 ? Math.round((doneLast30 / totalItems) * 100) : 0

    // Last activity
    const lastLog = progLogs.sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())[0]

    // Average pain (last 30 days, excluding nulls)
    const painsWithValues = progLogs.filter((l) => l.pain_after !== null)
    const avgPain = painsWithValues.length
      ? Math.round(painsWithValues.reduce((s, l) => s + (l.pain_after ?? 0), 0) / painsWithValues.length * 10) / 10
      : null

    // Daily activity last 7 days
    const last7: { date: string; done: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split("T")[0]
      const done = progLogs.filter((l) => l.logged_at.startsWith(dateStr)).length
      last7.push({ date: dateStr, done })
    }

    return {
      programId: prog.id,
      programName: prog.name,
      status: prog.status,
      totalItems,
      adherencePct: pct,
      lastActivityAt: lastLog?.logged_at ?? null,
      avgPain,
      last7days: last7,
    }
  })
}

export async function getMessages(patientId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from("messages")
    .select("id, sender_type, content, read_at, created_at")
    .eq("patient_id", patientId)
    .eq("practitioner_id", user.id)
    .order("created_at", { ascending: true })

  return data ?? []
}

export async function sendMessage(patientId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Brak autoryzacji")

  const { data, error } = await supabase
    .from("messages")
    .insert({
      practitioner_id: user.id,
      patient_id: patientId,
      sender_type: "practitioner",
      content: content.trim(),
    })
    .select("id, sender_type, content, read_at, created_at")
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function markMessagesRead(patientId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("patient_id", patientId)
    .eq("practitioner_id", user.id)
    .eq("sender_type", "patient")
    .is("read_at", null)
}

export async function getUnreadCounts(practitionerId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from("messages")
    .select("patient_id")
    .eq("practitioner_id", practitionerId)
    .eq("sender_type", "patient")
    .is("read_at", null)

  const counts = new Map<string, number>()
  for (const row of data ?? []) {
    counts.set(row.patient_id, (counts.get(row.patient_id) ?? 0) + 1)
  }
  return counts
}

export async function getAllConversations() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Get latest message per patient
  const { data: patients } = await supabase
    .from("patients")
    .select("id, first_name, last_name")
    .eq("practitioner_id", user.id)
    .order("last_name")

  if (!patients?.length) return []

  const { data: lastMessages } = await supabase
    .from("messages")
    .select("patient_id, content, sender_type, created_at, read_at")
    .eq("practitioner_id", user.id)
    .order("created_at", { ascending: false })

  type MsgRow = NonNullable<typeof lastMessages>[number]
  const byPatient = new Map<string, MsgRow>()
  for (const msg of lastMessages ?? []) {
    if (!byPatient.has(msg.patient_id)) byPatient.set(msg.patient_id, msg)
  }

  const { data: unread } = await supabase
    .from("messages")
    .select("patient_id")
    .eq("practitioner_id", user.id)
    .eq("sender_type", "patient")
    .is("read_at", null)

  const unreadCounts = new Map<string, number>()
  for (const row of unread ?? []) {
    unreadCounts.set(row.patient_id, (unreadCounts.get(row.patient_id) ?? 0) + 1)
  }

  return patients.map((p) => ({
    patient: p,
    lastMessage: byPatient.get(p.id) ?? null,
    unreadCount: unreadCounts.get(p.id) ?? 0,
  }))
}
