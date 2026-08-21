#!/usr/bin/env node
/**
 * setup-notes.mjs
 * Creates the practitioner_notes table (floating notepad / todo widget)
 * with grants + RLS. Run once: node setup-notes.mjs
 */
import pg from 'pg'
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

const db = new pg.Client({ connectionString: process.env.DATABASE_URL })
await db.connect()

console.log('Tworzenie tabeli notatek klinicysty...\n')

const statements = [
  `CREATE TABLE IF NOT EXISTS practitioner_notes (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     practitioner_id uuid NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
     content text NOT NULL,
     completed_at timestamptz,
     created_at timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS practitioner_notes_practitioner_id_idx ON practitioner_notes(practitioner_id)`,

  // ── GRANTS ──────────────────────────────────────────────────────────────
  `GRANT ALL ON practitioner_notes TO service_role`,
  `GRANT ALL ON practitioner_notes TO authenticated`,

  // ── RLS: klinicysta widzi i edytuje tylko swoje notatki ──────────────────
  `ALTER TABLE practitioner_notes ENABLE ROW LEVEL SECURITY`,
  `DROP POLICY IF EXISTS "practitioner_notes_all" ON practitioner_notes`,
  `CREATE POLICY "practitioner_notes_all" ON practitioner_notes
     FOR ALL USING (practitioner_id = auth.uid())`,
]

for (const sql of statements) {
  try {
    await db.query(sql)
    console.log(`  ✓ ${sql.slice(0, 60).replace(/\n/g, ' ')}...`)
  } catch (e) {
    console.error(`  ✗ ${sql.slice(0, 60).replace(/\n/g, ' ')}...\n    ${e.message}`)
  }
}

await db.end()
console.log('\n✅ Gotowe!')
