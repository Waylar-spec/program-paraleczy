#!/usr/bin/env node
/**
 * restore-vimeo-gifs.mjs
 *
 * Przywraca oryginalne URL-e GIF-ów z bucketu Supabase dla 5 ćwiczeń Vimeo,
 * których animated_gif_url / thumbnail_url zostało błędnie nadpisane przez
 * skrypt fix-gifs-to-video.mjs (zwracały 403 z Physitrack).
 */

import { createClient } from '@supabase/supabase-js'
import { readFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
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

const BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/exercise-media/gifs/`

// Kandydaci – najlepsze dopasowania nazw plików z bucketu
const CANDIDATES = [
  { name: 'Single leg Balance',         file: 'Stanie_na_jednej_nodze__rownowaznia_.gif' },
  { name: 'Quad set',                   file: 'Quad_Set.gif' },
  { name: 'Heel slides z calf raise',   file: 'Heel_Slide__slizg_piety_.gif' },
  { name: 'Calf Raises',                file: 'Calf_Raise.gif' },
  { name: 'Side lying hip abduction',   file: 'Side_lying_hip_abduction.gif' },  // primary guess
]

// Alternatywa dla Side lying hip abduction jeśli primary nie istnieje
const SIDE_LYING_FALLBACKS = [
  'Side_lying_hip_abduction.gif',
  'Side_lying_Hip_Abduction.gif',
  'Side_Lying_Hip_Abduction.gif',
  'Side_lying_ER_z_obciazeniem_progresja_.gif',
]

async function checkUrl(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' })
    return res.status
  } catch {
    return 0
  }
}

// Pobierz listę wszystkich plików z bucketu
console.log('Pobieranie listy plików z bucketu...')
const { data: files } = await sb.storage.from('exercise-media').list('gifs', { limit: 1000 })
const bucketFiles = new Set((files ?? []).map(f => f.name))
console.log(`Znaleziono ${bucketFiles.size} plików w buckecie.\n`)

// Rozwiąż plik dla Side lying hip abduction
let sideLyingFile = null
for (const f of SIDE_LYING_FALLBACKS) {
  if (bucketFiles.has(f)) {
    sideLyingFile = f
    console.log(`✓ Side lying hip abduction → znaleziono w buckecie: ${f}`)
    break
  }
}
if (!sideLyingFile) {
  console.log('✗ Side lying hip abduction → brak dopasowania w buckecie!')
  console.log('  Dostępne pliki "Side_lying*":')
  for (const f of bucketFiles) {
    if (f.toLowerCase().startsWith('side_lying')) console.log('   ', f)
  }
}

// Zaktualizuj CANDIDATES z rozwiązanym plikiem
const fixes = CANDIDATES.map(c => {
  if (c.name === 'Side lying hip abduction') {
    return { ...c, file: sideLyingFile }
  }
  return c
}).filter(c => c.file !== null)

// Sprawdź każdy URL i zaktualizuj bazę danych
for (const fix of fixes) {
  const url = BASE + encodeURIComponent(fix.file)
  const status = await checkUrl(url)

  if (status !== 200) {
    console.log(`\n✗ ${fix.name}`)
    console.log(`  URL: ${url}`)
    console.log(`  HTTP ${status} — pomijam!`)
    continue
  }

  // Pobierz obecny stan ćwiczenia
  const { data: ex } = await sb
    .from('exercises')
    .select('id, name, animated_gif_url, thumbnail_url, video_url')
    .ilike('name', fix.name)
    .single()

  if (!ex) {
    console.log(`\n✗ ${fix.name} — nie znaleziono w bazie!`)
    continue
  }

  console.log(`\n→ ${ex.name}`)
  console.log(`  ID: ${ex.id}`)
  console.log(`  Stary animated_gif_url: ${ex.animated_gif_url ?? '(null)'}`)
  console.log(`  Stary thumbnail_url:    ${ex.thumbnail_url ?? '(null)'}`)
  console.log(`  Nowy URL (GIF):         ${url}  [HTTP ${status}]`)

  const { error } = await sb
    .from('exercises')
    .update({
      animated_gif_url: url,
      thumbnail_url: url,
    })
    .eq('id', ex.id)

  if (error) {
    console.log(`  ✗ Błąd aktualizacji: ${error.message}`)
  } else {
    console.log(`  ✓ Zaktualizowano!`)
  }
}

console.log('\nGotowe.')
