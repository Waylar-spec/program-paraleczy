#!/usr/bin/env node
/**
 * set-difficulty.mjs
 * Ustawia poziom trudności (1=Łatwe, 2=Średnie, 3=Trudne) dla ćwiczeń,
 * które mają difficulty = null.
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

// Reguły wg kategorii (domyślne)
const CATEGORY_DIFFICULTY = {
  'Rozciąganie':      1,
  'Mobilność':        1,
  'Relaksacja':       1,
  'MSK':              1,
  'Gonarthroza':      1,
  'Menisk':           1,
  'Epicondylitis':    1,
  'Hiperlordoza':     1,
  'Ostroga piętowa':  1,
  'Stożek rotatorów': 1,
  'Neurodynamika':    2,
  'Stabilizacja':     2,
  'Siła':             2,
  'Propriocepcja':    2,
  'Skolioza':         2,
}

// Ćwiczenia wymagające indywidualnego przypisania (nadpisują regułę kategorii)
const SPECIFIC = {
  // Trudne (3)
  'Plyometria barku (rzuty piłką lekarską z rotacją)': 3,
  'Plank bokiem + odwodzenie ramienia':                3,
  'Oporowana rotacja zewnętrzna w odwiedzeniu 90°':    3,
  'Side Plank asymetryczny (Schroth)':                 3,
  // Średnie (2)
  'Diagonale PNF z gumą — wzorzec D2 flexion':         2,
  'PNF z góry na ukos w dół — staw ramienno-łopatkowy':2,
  'Propriocepcja barku':                               2,
  'Overhead Press':                                    2,
  'Spacer farmera (Farmer\'s Carry)':                  2,
  'Goblet Squat':                                      2,
  'Squat (przysiad)':                                  2,
  'RDL (Romanian Deadlift)':                           2,
  'Hip Hinge':                                         2,
  'Bird-Dog asymetryczny (Schroth)':                   2,
  'Ćwiczenie łuk (Schroth Bow Exercise)':              2,
  'Lateral Band Walk (minibanda kolana)':              2,
  'Chair Stand (siad do stania)':                      2,
  'Craniocervical Flexion (CCF) — protokół Jull':      2,
  'Trening propriocepcji szyi':                        2,
  'Cervical Retraction + Extension':                   2,
  'Wzmocnienie prostowników szyi (izometryczne)':      2,
  'Wiosłowanie z gumą (Rowing)':                       2,
  'ULNT Slider — nerw łokciowy':                       2,
  'ULNT1 Slider (nerw pośrodkowy)':                    2,
  'Wall Angels':                                       2,
  'Sciatic Nerve Slider — progresja (pozycja leżąca)': 2,
  'Sciatic Nerve Tensioner (Slump Slider)':            2,
  'Side Plank na kolanach':                            2,
  'Dead Bug z naciskiem na PPT':                       2,
  'Scapular Stabilization (wpływ na łokieć)':          2,
  'Radial Nerve Mobilization (łokieć)':                2,
  'Eccentric Wrist Extension (Tyler Twist)':           2,
  'Intrinsic Foot Strengthening (theraband palce)':    2,
}

// Pobierz wszystkie ćwiczenia bez difficulty
const { data: exercises } = await sb
  .from('exercises')
  .select('id, name, category')
  .is('difficulty', null)

console.log(`Ćwiczeń do ustawienia: ${exercises?.length ?? 0}\n`)

let ok = 0, skip = 0

for (const ex of exercises ?? []) {
  // Sprawdź specific override
  let difficulty = SPECIFIC[ex.name]
  // Jeśli brak override, użyj reguły kategorii
  if (!difficulty && ex.category) {
    difficulty = CATEGORY_DIFFICULTY[ex.category]
  }
  // Fallback: 1 (Łatwe)
  if (!difficulty) difficulty = 1

  const { error } = await sb
    .from('exercises')
    .update({ difficulty })
    .eq('id', ex.id)

  const label = ['', 'Łatwe', 'Średnie', 'Trudne'][difficulty]
  if (error) {
    console.log(`  ✗ ${ex.name}: ${error.message}`)
    skip++
  } else {
    console.log(`  ✓ [${label}] ${ex.name}`)
    ok++
  }
}

console.log(`\n✅ Ustawiono: ${ok}, błędów: ${skip}`)
