#!/usr/bin/env node
/**
 * fix-exercises.mjs
 * 1. Dodaje name_en dla ćwiczeń biblioteki (z fizjodesk_library_physitrack.json)
 * 2. Podmienia błędne video URL-e (mp4) dla wybranych ćwiczeń
 * 3. Dodaje nowe ćwiczenia (np. Knee Rocks)
 */
import { createClient } from '@supabase/supabase-js'
import { readFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Wczytaj zmienne z .env.local
try {
  const env = await readFile(path.join(__dirname, '.env.local'), 'utf8')
  for (const line of env.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim()
  }
} catch {}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

// ─── 1. name_en dla biblioteki ────────────────────────────────────────────────

const lib = JSON.parse(
  await readFile(path.join(__dirname, '..', '..', 'cwiczenia', 'fizjodesk_library_physitrack.json'), 'utf8')
)

console.log('\n▸ Ustawiam name_en dla ćwiczeń biblioteki...')
let nameEnOk = 0, nameEnFail = 0

for (const ex of lib) {
  if (!ex.physitrack_name_en) continue
  const { error } = await sb
    .from('exercises')
    .update({ name_en: ex.physitrack_name_en })
    .eq('name', ex.name_pl)
    .is('practitioner_id', null)
  if (error) { console.log(`  ✗ ${ex.name_pl}: ${error.message}`); nameEnFail++ }
  else nameEnOk++
}
console.log(`  ✓ name_en: ${nameEnOk} ok, ${nameEnFail} błędów`)

// ─── 2. Poprawki wideo + miniatur ─────────────────────────────────────────────
// Format: { name: 'polska nazwa w DB', uuid: 'physitrack uuid' }
// mp4:       https://media.physitrack.com/exercises/{uuid}/pl/video_720p.mp4
// thumbnail: https://media.physitrack.com/exercises/{uuid}/pl/thumbnail_800x450.jpg

const VIDEO_FIXES = [
  { name: 'Ćwiczenia oddechowe przeponowe',  uuid: '465f6e16-085b-4fbb-838b-a5625d24775f' },
  { name: 'Child Pose (rozciąganie LS)',      uuid: '4f7b6eb2-3e4b-4aad-9b6c-3f3d001925cf' },
  { name: 'Cat-Cow (kot-krowa)',             uuid: '02834c20-b334-43d5-a1d7-ba78d2b1cec4', quality: '1280x720' },
  { name: 'McGill Curl-up (flexja bez zgięcia LS)',   uuid: '6fe22632-a53b-4e52-b161-a41a88e4bd22' },
  { name: 'McGill Curl-up (flexja bez zginania LS)',  uuid: '6fe22632-a53b-4e52-b161-a41a88e4bd22' },
  { name: 'Bird-Dog',                        uuid: 'd10e651b-d132-4663-b431-424b00ea3dd8' },
  { name: 'Side Plank',                      uuid: '0f618659-0ff7-466d-b1dc-787da1418cfa' },
  { name: 'Mostek (Glute Bridge)',            uuid: '69414924-f275-4510-b44c-84dac0c82383' },
  { name: 'Dead Bug',                         uuid: '6b4a6f96-f019-4dff-9001-8d8d5b993119' },
  { name: 'Pallof Press z gumą',              uuid: '0054065b-b484-438c-919c-9b3dd5ef3169' },
  { name: 'Plank (przodem)',                  uuid: 'a4a9855b-96b7-4bee-90c3-b1f01a5006b7' },
  { name: 'Plank przodem',                    uuid: 'a4a9855b-96b7-4bee-90c3-b1f01a5006b7' },
  // Dodawaj kolejne tutaj podczas sesji:
]

if (VIDEO_FIXES.length > 0) {
  console.log('\n▸ Podmieniam video URL-e i miniatury...')
  for (const fix of VIDEO_FIXES) {
    const filename = fix.quality ? `video_${fix.quality}.mp4` : 'video_720p.mp4'
    const mp4 = `https://media.physitrack.com/exercises/${fix.uuid}/pl/${filename}`
    const thumb = `https://media.physitrack.com/exercises/${fix.uuid}/pl/thumbnail_800x450.jpg`
    const { error } = await sb
      .from('exercises')
      .update({ animated_gif_url: mp4, thumbnail_url: thumb })
      .eq('name', fix.name)
    if (error) console.log(`  ✗ ${fix.name}: ${error.message}`)
    else console.log(`  ✓ ${fix.name}`)
  }
}

// ─── 2b. Scal duplikaty (przenieś referencje i usuń) ─────────────────────────
// Format: { duplicate: 'nazwa do usunięcia', canonical: 'nazwa do zachowania' }

const DUPLICATES_TO_MERGE = [
  { duplicate: 'Diaphragmatic Breathing (oddychanie przeponowe)', canonical: 'Ćwiczenia oddechowe przeponowe' },
  { duplicate: 'McGill Curl-up (flexja bez zginania LS)', canonical: 'McGill Curl-up (flexja bez zgięcia LS)' },
  { duplicate: 'Plank przodem',                    canonical: 'Plank (przodem)' },
  { duplicate: 'Plank z korekcją tułowia',         canonical: 'Plank (przodem)' },
  { duplicate: 'Plank z neutralizacją miednicy',   canonical: 'Plank (przodem)' },
  // Dodawaj kolejne tutaj
]

if (DUPLICATES_TO_MERGE.length > 0) {
  console.log('\n▸ Scalanie duplikatów...')
  for (const { duplicate, canonical } of DUPLICATES_TO_MERGE) {
    const { data: dupEx } = await sb.from('exercises').select('id').eq('name', duplicate).is('practitioner_id', null).single()
    const { data: canEx } = await sb.from('exercises').select('id').eq('name', canonical).is('practitioner_id', null).single()

    if (!dupEx) { console.log(`  ↺ Nie znaleziono: "${duplicate}" — już usunięty?`); continue }
    if (!canEx) { console.log(`  ✗ Nie znaleziono docelowego: "${canonical}"`); continue }

    // Przepnij referencje we wszystkich tabelach
    const tables = [
      'program_template_items',
      'patient_program_items',
    ]
    for (const table of tables) {
      const { count, error } = await sb.from(table)
        .update({ exercise_id: canEx.id })
        .eq('exercise_id', dupEx.id)
        .select('id', { count: 'exact', head: true })
      if (error) console.log(`    ✗ ${table}: ${error.message}`)
      else if (count) console.log(`    ↳ ${table}: przepięto ${count} wierszy`)
    }

    // Usuń duplikat
    const { error: delErr } = await sb.from('exercises').delete().eq('id', dupEx.id)
    if (delErr) console.log(`  ✗ Nie udało się usunąć "${duplicate}": ${delErr.message}`)
    else console.log(`  ✓ Usunięto: "${duplicate}"`)
  }
}

// ─── 3. Nowe ćwiczenia ────────────────────────────────────────────────────────

const NEW_EXERCISES = [
  {
    name: 'Rotacje kolan (Knee Rocks)',
    name_en: 'Knee Rocks',
    body_part: 'Kolano',
    category: 'MSK',
    animated_gif_url: 'https://media.physitrack.com/exercises/12fc9764-3286-4add-b30a-32032f1bec40/pl/video_720p.mp4',
    default_sets: 3,
    default_reps: 10,
    default_rest_seconds: 30,
    is_public: true,
    practitioner_id: null,
  },
  {
    name: 'Aktywacja TrA (Abdominal Bracing)',
    name_en: 'Abdominal Bracing (TrA Activation)',
    body_part: 'Kręgosłup lędźwiowy',
    category: 'Stabilizacja',
    animated_gif_url: 'https://media.physitrack.com/exercises/19f84de2-a561-4815-994c-f52d9f3d8081/pl/video_720p.mp4',
    thumbnail_url: 'https://media.physitrack.com/exercises/19f84de2-a561-4815-994c-f52d9f3d8081/pl/thumbnail_800x450.jpg',
    default_sets: 3,
    default_reps: 10,
    default_rest_seconds: 30,
    is_public: true,
    practitioner_id: null,
  },
  {
    name: 'RDL (Romanian Deadlift)',
    name_en: 'Romanian Deadlift (RDL)',
    body_part: 'Kręgosłup lędźwiowy',
    category: 'Siła',
    video_url: 'https://www.youtube.com/shorts/yocUPD65ucQ',
    thumbnail_url: 'https://img.youtube.com/vi/yocUPD65ucQ/hqdefault.jpg',
    default_sets: 3,
    default_reps: 10,
    default_rest_seconds: 60,
    is_public: true,
    practitioner_id: null,
  },
  {
    name: 'Spacer farmera (Farmer\'s Carry)',
    name_en: 'Farmer\'s Carry',
    body_part: 'Całe ciało',
    category: 'Siła',
    video_url: 'https://www.youtube.com/shorts/YlQ03yL6zrA',
    thumbnail_url: 'https://img.youtube.com/vi/YlQ03yL6zrA/hqdefault.jpg',
    default_sets: 3,
    default_reps: 10,
    default_rest_seconds: 60,
    is_public: true,
    practitioner_id: null,
  },
  {
    name: 'Hip Hinge',
    name_en: 'Hip Hinge',
    body_part: 'Kręgosłup lędźwiowy',
    category: 'Mobilność',
    animated_gif_url: 'https://media.physitrack.com/exercises/c09b6175-a8be-4473-b842-8b35109a484d/pl/video_720p.mp4',
    thumbnail_url: 'https://media.physitrack.com/exercises/c09b6175-a8be-4473-b842-8b35109a484d/pl/thumbnail_800x450.jpg',
    default_sets: 3,
    default_reps: 10,
    default_rest_seconds: 30,
    is_public: true,
    practitioner_id: null,
  },
  {
    name: 'Goblet Squat',
    name_en: 'Goblet Squat',
    body_part: 'Kolano',
    category: 'Siła',
    animated_gif_url: 'https://media.physitrack.com/exercises/7bc65945-3fa7-442b-886f-f1dc4ab07ecf/pl/video_720p.mp4',
    thumbnail_url: 'https://media.physitrack.com/exercises/7bc65945-3fa7-442b-886f-f1dc4ab07ecf/pl/thumbnail_800x450.jpg',
    default_sets: 3,
    default_reps: 10,
    default_rest_seconds: 60,
    is_public: true,
    practitioner_id: null,
  },
  {
    name: 'Side Plank na kolanach',
    name_en: 'Side Plank on Knees',
    body_part: 'Kręgosłup lędźwiowy',
    category: 'Stabilizacja',
    animated_gif_url: 'https://media.physitrack.com/exercises/69680a7f-6708-40f6-af04-b92b8e80216a/pl/video_720p.mp4',
    thumbnail_url: 'https://media.physitrack.com/exercises/69680a7f-6708-40f6-af04-b92b8e80216a/pl/thumbnail_800x450.jpg',
    default_sets: 3,
    default_duration_seconds: 20,
    default_rest_seconds: 30,
    is_public: true,
    practitioner_id: null,
  },
  // Dodawaj kolejne tutaj
]

if (NEW_EXERCISES.length > 0) {
  console.log('\n▸ Dodaję nowe ćwiczenia...')
  const { data: existing } = await sb.from('exercises').select('name')
  const existingNames = new Set((existing ?? []).map(e => e.name))

  for (const ex of NEW_EXERCISES) {
    if (existingNames.has(ex.name)) {
      console.log(`  ↺ Już istnieje: ${ex.name}`)
      continue
    }
    const { error } = await sb.from('exercises').insert(ex)
    if (error) console.log(`  ✗ ${ex.name}: ${error.message}`)
    else console.log(`  ✓ Dodano: ${ex.name}`)
  }
}

// ─── 4. Zbij cache Next.js ────────────────────────────────────────────────────

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
try {
  const r = await fetch(`${APP_URL}/api/revalidate-exercises`, {
    method: 'POST',
    headers: { 'x-revalidate-secret': process.env.SUPABASE_SECRET_KEY },
  })
  const body = await r.json().catch(() => ({}))
  if (body.ok) console.log('\n▸ Cache ćwiczeń zbity ✓')
  else console.log(`\n▸ Cache: ${body.error ?? r.status} (jeśli serwer nie działa — nie szkodzi)`)
} catch {
  console.log('\n▸ Cache: serwer niedostępny, wygaśnie po 120s automatycznie')
}

console.log('\n✅ Gotowe!')
