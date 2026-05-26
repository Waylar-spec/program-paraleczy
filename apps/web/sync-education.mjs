#!/usr/bin/env node
/**
 * sync-education.mjs
 * Synchronizuje pliki z Supabase Storage (bucket: education) 
 * z tabelą educational_content — dodaje nowe, pomija już istniejące.
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

const BUCKET = 'education'

// 1. Pobierz wszystkie pliki z bucketu (rekurencyjnie przez prefix)
async function listAll(prefix = '') {
  const { data, error } = await sb.storage.from(BUCKET).list(prefix, { limit: 1000 })
  if (error) { console.error('Storage error:', error.message); return [] }
  const files = []
  for (const item of data ?? []) {
    if (item.metadata) {
      // to jest plik
      files.push(prefix ? `${prefix}/${item.name}` : item.name)
    } else {
      // to jest folder
      const sub = await listAll(prefix ? `${prefix}/${item.name}` : item.name)
      files.push(...sub)
    }
  }
  return files
}

console.log('▸ Pobieram listę plików z bucketu...')
const allFiles = await listAll()
const pdfFiles = allFiles.filter(f => f.toLowerCase().endsWith('.pdf'))
console.log(`  Znaleziono ${pdfFiles.length} plików PDF`)

if (pdfFiles.length === 0) {
  console.log('  Brak PDF-ów do dodania.')
  process.exit(0)
}

// 2. Pobierz istniejące wpisy w educational_content (po file_url)
const { data: existing } = await sb.from('educational_content').select('file_url')
const existingUrls = new Set((existing ?? []).map(e => e.file_url).filter(Boolean))

// 3. Dla każdego nowego pliku — wstaw wpis
const baseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}`

function nameFromPath(filePath) {
  const filename = filePath.split('/').pop() ?? filePath
  return filename
    .replace(/\.pdf$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim()
}

console.log('\n▸ Synchronizuję educational_content...')
let added = 0, skipped = 0

for (const filePath of pdfFiles) {
  const publicUrl = `${baseUrl}/${filePath}`
  if (existingUrls.has(publicUrl)) {
    console.log(`  ↺ Już istnieje: ${filePath}`)
    skipped++
    continue
  }

  const name = nameFromPath(filePath)
  const { error } = await sb.from('educational_content').insert({
    name,
    type: 'pdf',
    file_url: publicUrl,
    practitioner_id: null,  // publiczny — widoczny dla wszystkich
    is_favorite: false,
  })

  if (error) {
    console.log(`  ✗ ${filePath}: ${error.message}`)
  } else {
    console.log(`  ✓ Dodano: "${name}"`)
    added++
  }
}

console.log(`\n✅ Gotowe! Dodano: ${added}, Pominięto (już istniały): ${skipped}`)
