#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import { readFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
try {
  const env = await readFile(path.join(__dirname, '.env.local'), 'utf8')
  for (const line of env.split('\n')) { const m = line.match(/^([^#=]+)=(.*)$/); if (m) process.env[m[1].trim()] = m[2].trim() }
} catch {}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY)

// Wyczyść broken 403 Physitrack URLs z animated_gif_url i thumbnail_url
const brokenIds = [
  'https://vimeo.com/1187435880', // Side lying hip abduction
  'https://vimeo.com/1183661836', // Single leg Balance
  'https://vimeo.com/1184601581', // Heel slides z calf raise
  'https://vimeo.com/1183669345', // Quad set
  'https://vimeo.com/1187435760', // Calf Raises
]
const { data } = await sb.from('exercises').select('id, name').in('video_url', brokenIds)
for (const ex of data ?? []) {
  await sb.from('exercises').update({ animated_gif_url: null, thumbnail_url: null }).eq('id', ex.id)
  console.log(`  ✓ Wyczyszczono 403 URL-e: ${ex.name}`)
}
console.log('\nTeraz pokaż miniatury "?" — możesz je ustawić manualnie w ćwiczeniu lub udostępnij filmiki jako unlisted na Vimeo.')
