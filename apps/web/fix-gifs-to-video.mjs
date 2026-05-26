#!/usr/bin/env node
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

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY)

const lib = JSON.parse(
  await readFile(path.join(__dirname, '..', '..', 'cwiczenia', 'fizjodesk_library_physitrack.json'), 'utf8')
)

// Lookup: name_pl/name_en → { mp4: exact video_url from JSON, thumb: thumbnail_url from JSON }
const byName = {}
for (const ex of lib) {
  if (!ex.video_url) continue
  const entry = {
    mp4: ex.video_url,
    // Use JSON thumbnail if available, else construct from same locale as video
    thumb: ex.thumbnail_url ?? (() => {
      const uuid = ex.video_url.match(/exercises\/([0-9a-f-]{36})\//)?.[1]
      const locale = ex.video_url.match(/\/([a-z]{2})\/video/)?.[1] ?? 'en'
      return uuid ? `https://media.physitrack.com/exercises/${uuid}/${locale}/thumbnail_800x450.jpg` : null
    })()
  }
  if (ex.name_pl) byName[ex.name_pl.trim().toLowerCase()] = entry
  if (ex.physitrack_name_en) byName[ex.physitrack_name_en.trim().toLowerCase()] = entry
}

// Only fix exercises with GIFs from own Supabase bucket — leave /pl/video_720p.mp4 untouched
const { data: all } = await sb.from('exercises').select('id, name, name_en, animated_gif_url')
  .not('animated_gif_url', 'is', null)

const toFix = (all ?? []).filter(ex =>
  (ex.animated_gif_url ?? '').includes('supabase') &&
  (ex.animated_gif_url ?? '').includes('.gif')
)

console.log(`▸ GIF-y z własnego bucketu do zamiany: ${toFix.length}\n`)
let fixed = 0, noMatch = 0

for (const ex of toFix) {
  const key = ex.name?.trim().toLowerCase()
  const keyEn = ex.name_en?.trim().toLowerCase()
  const found = byName[key] ?? (keyEn ? byName[keyEn] : undefined)
  if (!found) { noMatch++; continue }

  const { error } = await sb.from('exercises')
    .update({ animated_gif_url: found.mp4, ...(found.thumb ? { thumbnail_url: found.thumb } : {}) })
    .eq('id', ex.id)

  if (error) console.log(`  ✗ ${ex.name}: ${error.message}`)
  else { console.log(`  ✓ ${ex.name}`); fixed++ }
}

console.log(`\n✅ Podmieniono: ${fixed} | Brak dopasowania (GIF zostaje): ${noMatch}`)

// Also fix thumbnails for exercises where video is /en/ but thumbnail was set to /pl/ (broken)
console.log('\n▸ Naprawiam zepsute thumbnailem (video /en/ + thumbnail /pl/)...')
const { data: broken } = await sb.from('exercises').select('id, name, name_en, animated_gif_url, thumbnail_url')
  .ilike('animated_gif_url', '%physitrack%/en/%')

let thumbFixed = 0
for (const ex of broken ?? []) {
  const key = ex.name?.trim().toLowerCase()
  const keyEn = ex.name_en?.trim().toLowerCase()
  const found = byName[key] ?? (keyEn ? byName[keyEn] : undefined)
  if (!found?.thumb) continue
  const { error } = await sb.from('exercises').update({ thumbnail_url: found.thumb }).eq('id', ex.id)
  if (!error) { console.log(`  ✓ thumb: ${ex.name}`); thumbFixed++ }
}
console.log(`  Poprawiono thumbnailem: ${thumbFixed}`)
