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
  { name: 'Rotacje kolan (Knee Rocks)',        uuid: '12fc9764-3286-4add-b30a-32032f1bec40' },
  { name: 'Pallof Press z gumą',              uuid: '0054065b-b484-438c-919c-9b3dd5ef3169' },
  { name: 'Plank (przodem)',                  uuid: 'a4a9855b-96b7-4bee-90c3-b1f01a5006b7' },
  { name: 'Plank przodem',                    uuid: 'a4a9855b-96b7-4bee-90c3-b1f01a5006b7' },
  { name: 'Wahadło Codmana (Codman Pendulum)', uuid: 'dceb2501-d90a-4235-ba9c-7dcd84e0074e' },
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
  // F1
  {
    name: 'McKenzie Press-Up (Extension in Lying)',
    name_en: 'McKenzie Press-Up (Extension in Lying)',
    body_part: 'Kręgosłup lędźwiowy',
    category: 'Mobilność',
    animated_gif_url: 'https://media.physitrack.com/exercises/cd34db49-3035-420d-babc-67b5ac87fec5/pl/video_720p.mp4',
    thumbnail_url: 'https://media.physitrack.com/exercises/cd34db49-3035-420d-babc-67b5ac87fec5/pl/thumbnail_800x450.jpg',
    default_sets: 3,
    default_reps: 10,
    default_rest_seconds: 30,
    is_public: true,
    practitioner_id: null,
  },
  {
    name: 'McKenzie Extension in Standing',
    name_en: 'McKenzie Extension in Standing',
    body_part: 'Kręgosłup lędźwiowy',
    category: 'Mobilność',
    animated_gif_url: 'https://media.physitrack.com/exercises/added4c6-6bb3-46fd-82b1-8b89fa38dae2/pl/video_720p.mp4',
    thumbnail_url: 'https://media.physitrack.com/exercises/added4c6-6bb3-46fd-82b1-8b89fa38dae2/pl/thumbnail_800x450.jpg',
    default_sets: 3,
    default_reps: 10,
    default_rest_seconds: 30,
    is_public: true,
    practitioner_id: null,
  },
  {
    name: 'Sciatic Nerve Slider (pozycja siedząca)',
    name_en: 'Sciatic Nerve Slider (Sitting)',
    body_part: 'Kręgosłup lędźwiowy',
    category: 'Neurodynamika',
    animated_gif_url: 'https://media.physitrack.com/exercises/e6366ef0-0438-49e1-8fd9-70cc9be3f0b4/pl/video_720p.mp4',
    thumbnail_url: 'https://media.physitrack.com/exercises/e6366ef0-0438-49e1-8fd9-70cc9be3f0b4/pl/thumbnail_800x450.jpg',
    default_sets: 3,
    default_reps: 10,
    default_rest_seconds: 30,
    is_public: true,
    practitioner_id: null,
  },
  // F2
  {
    name: 'Sciatic Nerve Slider — progresja (pozycja leżąca)',
    name_en: 'Sciatic Nerve Slider — Progression (Lying)',
    body_part: 'Kręgosłup lędźwiowy',
    category: 'Neurodynamika',
    animated_gif_url: 'https://media.physitrack.com/exercises/6eeb57b3-7f9c-4b8c-9be6-ad44feeaabd2/pl/video_720p.mp4',
    thumbnail_url: 'https://media.physitrack.com/exercises/6eeb57b3-7f9c-4b8c-9be6-ad44feeaabd2/pl/thumbnail_800x450.jpg',
    default_sets: 3,
    default_reps: 10,
    default_rest_seconds: 30,
    is_public: true,
    practitioner_id: null,
  },
  {
    name: 'Sciatic Nerve Tensioner (Slump Slider)',
    name_en: 'Sciatic Nerve Tensioner (Slump Slider)',
    body_part: 'Kręgosłup lędźwiowy',
    category: 'Neurodynamika',
    animated_gif_url: 'https://media.physitrack.com/exercises/68844b9a-4465-4a0a-9d0e-c59a49d174fb/pl/video_720p.mp4',
    thumbnail_url: 'https://media.physitrack.com/exercises/68844b9a-4465-4a0a-9d0e-c59a49d174fb/pl/thumbnail_800x450.jpg',
    default_sets: 3,
    default_reps: 10,
    default_rest_seconds: 30,
    is_public: true,
    practitioner_id: null,
  },
  // F3
  {
    name: 'Squat (przysiad)',
    name_en: 'Squat',
    body_part: 'Kolano',
    category: 'Siła',
    animated_gif_url: 'https://media.physitrack.com/exercises/7c360268-adbf-458a-b004-4eb57bc48f6d/pl/video_720p.mp4',
    thumbnail_url: 'https://media.physitrack.com/exercises/7c360268-adbf-458a-b004-4eb57bc48f6d/pl/thumbnail_800x450.jpg',
    default_sets: 3,
    default_reps: 10,
    default_rest_seconds: 60,
    is_public: true,
    practitioner_id: null,
  },
  // Szyja / bark
  {
    name: 'Chin Tuck',
    name_en: 'Chin Tuck',
    body_part: 'Kręgosłup szyjny',
    category: 'Stabilizacja',
    animated_gif_url: 'https://media.physitrack.com/exercises/800283a7-1bc0-44f5-a196-800712b9a012/pl/video_720p.mp4',
    thumbnail_url: 'https://media.physitrack.com/exercises/800283a7-1bc0-44f5-a196-800712b9a012/pl/thumbnail_800x450.jpg',
    default_sets: 3,
    default_reps: 10,
    default_rest_seconds: 30,
    is_public: true,
    practitioner_id: null,
  },
  {
    name: 'Mobilizacja rotacyjna szyi',
    name_en: 'Cervical Rotation Mobilisation',
    body_part: 'Kręgosłup szyjny',
    category: 'Mobilność',
    animated_gif_url: 'https://media.physitrack.com/exercises/14ef2302-4683-4c7f-9a17-7670444c31e9/pl/video_720p.mp4',
    thumbnail_url: 'https://media.physitrack.com/exercises/14ef2302-4683-4c7f-9a17-7670444c31e9/pl/thumbnail_800x450.jpg',
    default_sets: 3,
    default_reps: 10,
    default_rest_seconds: 30,
    is_public: true,
    practitioner_id: null,
  },
  {
    name: 'Rozciąganie górnego trapezu i levator scapulae',
    name_en: 'Upper Trapezius & Levator Scapulae Stretch',
    body_part: 'Kręgosłup szyjny',
    category: 'Rozciąganie',
    animated_gif_url: 'https://media.physitrack.com/exercises/ba60eb37-cc87-4b5d-9cba-7a9573469714/pl/video_720p.mp4',
    thumbnail_url: 'https://media.physitrack.com/exercises/ba60eb37-cc87-4b5d-9cba-7a9573469714/pl/thumbnail_800x450.jpg',
    default_sets: 3,
    default_duration_seconds: 30,
    default_rest_seconds: 30,
    is_public: true,
    practitioner_id: null,
  },
  {
    name: 'Mobilizacja piersiowa (Thoracic Extension)',
    name_en: 'Thoracic Extension Mobilisation',
    body_part: 'Kręgosłup piersiowy',
    category: 'Mobilność',
    animated_gif_url: 'https://media.physitrack.com/exercises/11c4eea1-4ccf-4ca9-9212-ff8d7bd06d2c/pl/video_720p.mp4',
    thumbnail_url: 'https://media.physitrack.com/exercises/11c4eea1-4ccf-4ca9-9212-ff8d7bd06d2c/pl/thumbnail_800x450.jpg',
    default_sets: 3,
    default_reps: 10,
    default_rest_seconds: 30,
    is_public: true,
    practitioner_id: null,
  },
  {
    name: 'Craniocervical Flexion (CCF) — protokół Jull',
    name_en: 'Craniocervical Flexion (CCF) — Jull Protocol',
    body_part: 'Kręgosłup szyjny',
    category: 'Stabilizacja',
    animated_gif_url: 'https://media.physitrack.com/exercises/ee5c2e59-d939-4ab5-b4ae-330dcf4db115/pl/video_720p.mp4',
    thumbnail_url: 'https://media.physitrack.com/exercises/ee5c2e59-d939-4ab5-b4ae-330dcf4db115/pl/thumbnail_800x450.jpg',
    default_sets: 3,
    default_reps: 10,
    default_duration_seconds: 10,
    default_rest_seconds: 30,
    is_public: true,
    practitioner_id: null,
  },
  {
    name: 'Chin Tuck Isometric',
    name_en: 'Chin Tuck Isometric',
    body_part: 'Kręgosłup szyjny',
    category: 'Stabilizacja',
    animated_gif_url: 'https://media.physitrack.com/exercises/5420dc62-d1e0-4272-8265-9e2a14e1a8a9/pl/video_720p.mp4',
    thumbnail_url: 'https://media.physitrack.com/exercises/5420dc62-d1e0-4272-8265-9e2a14e1a8a9/pl/thumbnail_800x450.jpg',
    default_sets: 3,
    default_reps: 10,
    default_duration_seconds: 10,
    default_rest_seconds: 30,
    is_public: true,
    practitioner_id: null,
  },
  {
    name: 'Cervical Retraction w leżeniu',
    name_en: 'Cervical Retraction in Lying',
    body_part: 'Kręgosłup szyjny',
    category: 'Mobilność',
    animated_gif_url: 'https://media.physitrack.com/exercises/84501cae-ad84-45e0-9e43-4db76fe288f0/pl/video_720p.mp4',
    thumbnail_url: 'https://media.physitrack.com/exercises/84501cae-ad84-45e0-9e43-4db76fe288f0/pl/thumbnail_800x450.jpg',
    default_sets: 3,
    default_reps: 10,
    default_rest_seconds: 30,
    is_public: true,
    practitioner_id: null,
  },
  {
    name: 'Wzmocnienie prostowników szyi (izometryczne)',
    name_en: 'Cervical Extensor Strengthening (Isometric)',
    body_part: 'Kręgosłup szyjny',
    category: 'Stabilizacja',
    animated_gif_url: 'https://media.physitrack.com/exercises/5070da05-940d-40a1-99e5-6fc3bc8868d6/pl/video_720p.mp4',
    thumbnail_url: 'https://media.physitrack.com/exercises/5070da05-940d-40a1-99e5-6fc3bc8868d6/pl/thumbnail_800x450.jpg',
    default_sets: 3,
    default_reps: 10,
    default_duration_seconds: 10,
    default_rest_seconds: 30,
    is_public: true,
    practitioner_id: null,
  },
  {
    name: 'Oddech z ruchem ramion',
    name_en: 'Breathing with Arm Movement',
    body_part: 'Kręgosłup szyjny',
    category: 'Mobilność',
    animated_gif_url: 'https://media.physitrack.com/exercises/fe395b59-c3dc-4355-8974-507cb08dc9d5/pl/video_720p.mp4',
    thumbnail_url: 'https://media.physitrack.com/exercises/fe395b59-c3dc-4355-8974-507cb08dc9d5/pl/thumbnail_800x450.jpg',
    default_sets: 3,
    default_reps: 10,
    default_rest_seconds: 30,
    is_public: true,
    practitioner_id: null,
  },
  {
    name: 'Wiosłowanie z gumą (Rowing)',
    name_en: 'Seated Row with Band',
    body_part: 'Kręgosłup szyjny',
    category: 'Siła',
    animated_gif_url: 'https://media.physitrack.com/exercises/90c3393d-7464-40c8-8945-af2bfc7dcf64/pl/video_720p.mp4',
    thumbnail_url: 'https://media.physitrack.com/exercises/90c3393d-7464-40c8-8945-af2bfc7dcf64/pl/thumbnail_800x450.jpg',
    default_sets: 3,
    default_reps: 12,
    default_rest_seconds: 60,
    is_public: true,
    practitioner_id: null,
  },
  {
    name: 'Wall Angels',
    name_en: 'Wall Angels',
    body_part: 'Kręgosłup piersiowy',
    category: 'Mobilność',
    animated_gif_url: 'https://media.physitrack.com/exercises/50d9e386-188a-4dee-a0af-64dee6638cc1/pl/video_720p.mp4',
    thumbnail_url: 'https://media.physitrack.com/exercises/50d9e386-188a-4dee-a0af-64dee6638cc1/pl/thumbnail_800x450.jpg',
    default_sets: 3,
    default_reps: 10,
    default_rest_seconds: 30,
    is_public: true,
    practitioner_id: null,
  },
  {
    name: 'Overhead Press',
    name_en: 'Overhead Press',
    body_part: 'Bark',
    category: 'Siła',
    animated_gif_url: 'https://media.physitrack.com/exercises/33101f28-b0a5-49fa-996c-4c2baa19f0f4/pl/video_720p.mp4',
    thumbnail_url: 'https://media.physitrack.com/exercises/33101f28-b0a5-49fa-996c-4c2baa19f0f4/pl/thumbnail_800x450.jpg',
    default_sets: 3,
    default_reps: 10,
    default_rest_seconds: 60,
    is_public: true,
    practitioner_id: null,
  },
  {
    name: 'Suboccipital Release (autorelaksacja podpotylicznych)',
    name_en: 'Suboccipital Release',
    body_part: 'Kręgosłup szyjny',
    category: 'Rozciąganie',
    animated_gif_url: 'https://media.physitrack.com/exercises/02b2d8ec-a6d1-45cb-9980-f37ba338163b/pl/video_1280x720.mp4',
    thumbnail_url: 'https://media.physitrack.com/exercises/02b2d8ec-a6d1-45cb-9980-f37ba338163b/pl/thumbnail_800x450.jpg',
    default_sets: 3,
    default_duration_seconds: 60,
    default_rest_seconds: 30,
    is_public: true,
    practitioner_id: null,
  },
  {
    name: 'Trening propriocepcji szyi',
    name_en: 'Cervical Proprioception Training',
    body_part: 'Kręgosłup szyjny',
    category: 'Stabilizacja',
    animated_gif_url: 'https://media.physitrack.com/exercises/0854c3e3-3c92-4746-878c-b0629e53e492/pl/video_720p.mp4',
    thumbnail_url: 'https://media.physitrack.com/exercises/0854c3e3-3c92-4746-878c-b0629e53e492/pl/thumbnail_800x450.jpg',
    default_sets: 3,
    default_reps: 10,
    default_rest_seconds: 30,
    is_public: true,
    practitioner_id: null,
  },
  {
    name: 'Cervical Retraction + Extension',
    name_en: 'Cervical Retraction + Extension',
    body_part: 'Kręgosłup szyjny',
    category: 'Mobilność',
    animated_gif_url: 'https://media.physitrack.com/exercises/1bac83e1-0890-4110-84dc-6e4344ef9066/pl/video_720p.mp4',
    thumbnail_url: 'https://media.physitrack.com/exercises/1bac83e1-0890-4110-84dc-6e4344ef9066/pl/thumbnail_800x450.jpg',
    default_sets: 3,
    default_reps: 10,
    default_rest_seconds: 30,
    is_public: true,
    practitioner_id: null,
  },
  {
    name: 'ULNT1 Slider (nerw pośrodkowy)',
    name_en: 'ULNT1 Slider (Median Nerve)',
    body_part: 'Kręgosłup szyjny',
    category: 'Neurodynamika',
    animated_gif_url: 'https://media.physitrack.com/exercises/cd638e85-5253-4bfe-bb29-0c92934f0882/pl/video_720p.mp4',
    thumbnail_url: 'https://media.physitrack.com/exercises/cd638e85-5253-4bfe-bb29-0c92934f0882/pl/thumbnail_800x450.jpg',
    default_sets: 3,
    default_reps: 10,
    default_rest_seconds: 30,
    is_public: true,
    practitioner_id: null,
  },
  {
    name: 'ULNT Slider — nerw łokciowy',
    name_en: 'ULNT Slider — Ulnar Nerve',
    body_part: 'Kręgosłup szyjny',
    category: 'Neurodynamika',
    animated_gif_url: 'https://media.physitrack.com/exercises/a46186ef-06d0-4c96-b4bf-18ac24c1c700/pl/video_720p.mp4',
    thumbnail_url: 'https://media.physitrack.com/exercises/a46186ef-06d0-4c96-b4bf-18ac24c1c700/pl/thumbnail_800x450.jpg',
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

// ─── 3b. Napraw thumbnailem dla wszystkich /pl/video_720p.mp4 ─────────────────
// Dla każdego ćwiczenia z Physitrack /pl/ URL upewnij się że thumbnail = ten sam UUID /pl/thumbnail

console.log('\n▸ Synchronizuję thumbnailem dla wszystkich ćwiczeń z /pl/video_720p.mp4...')
const { data: plVideos } = await sb
  .from('exercises')
  .select('id, name, animated_gif_url, thumbnail_url')
  .ilike('animated_gif_url', '%physitrack%/pl/video_720p.mp4')

let thumbOk = 0, thumbFixed = 0
for (const ex of plVideos ?? []) {
  const uuid = ex.animated_gif_url?.match(/exercises\/([0-9a-f-]{36})\//)?.[1]
  if (!uuid) continue
  const expectedThumb = `https://media.physitrack.com/exercises/${uuid}/pl/thumbnail_800x450.jpg`
  if (ex.thumbnail_url === expectedThumb) { thumbOk++; continue }
  const { error } = await sb.from('exercises').update({ thumbnail_url: expectedThumb }).eq('id', ex.id)
  if (error) console.log(`  ✗ ${ex.name}: ${error.message}`)
  else { console.log(`  ✓ thumb: ${ex.name}`); thumbFixed++ }
}
console.log(`  OK: ${thumbOk}, Naprawiono: ${thumbFixed}`)

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
