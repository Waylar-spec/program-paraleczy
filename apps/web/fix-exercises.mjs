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

// ─── 2. Poprawki wideo URL-i (mp4) ───────────────────────────────────────────
// Format: { name: 'polska nazwa w DB', uuid: 'physitrack uuid' }
// URL mp4 = https://media.physitrack.com/exercises/{uuid}/pl/video_720p.mp4

const VIDEO_FIXES = [
  // Podane przez użytkownika:
  { name: 'Ćwiczenia oddechowe przeponowe',                  uuid: '465f6e16-085b-4fbb-838b-a5625d24775f' },
  { name: 'Diaphragmatic Breathing (oddychanie przeponowe)', uuid: '465f6e16-085b-4fbb-838b-a5625d24775f' },
  { name: 'Child Pose (rozciąganie LS)',                     uuid: '4f7b6eb2-3e4b-4aad-9b6c-3f3d001925cf' },
  { name: 'Cat-Cow (kot-krowa)',                             uuid: '02834c20-b334-43d5-a1d7-ba78d2b1cec4', quality: '1280x720' },
  // Dodawaj kolejne tutaj podczas sesji:
]

if (VIDEO_FIXES.length > 0) {
  console.log('\n▸ Podmieniam video URL-e...')
  for (const fix of VIDEO_FIXES) {
    const filename = fix.quality ? `video_${fix.quality}.mp4` : 'video_720p.mp4'
    const mp4 = `https://media.physitrack.com/exercises/${fix.uuid}/pl/${filename}`
    const { error } = await sb
      .from('exercises')
      .update({ animated_gif_url: mp4 })
      .eq('name', fix.name)
    if (error) console.log(`  ✗ ${fix.name}: ${error.message}`)
    else console.log(`  ✓ ${fix.name}`)
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

console.log('\n✅ Gotowe!')
