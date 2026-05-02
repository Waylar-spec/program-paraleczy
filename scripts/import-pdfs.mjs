import { createClient } from "@supabase/supabase-js"
import { readFileSync, readdirSync } from "fs"
import { join, basename } from "path"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SECRET_KEY
const PDF_DIR      = new URL("../pdf", import.meta.url).pathname

// ── practitioner_id ────────────────────────────────────────────────────────
// Leave null → visible to all practitioners (is_public style via practitioner_id IS NULL)
// Or paste your UUID here:
const PRACTITIONER_ID = null

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

function humanName(filename) {
  return basename(filename, ".pdf")
    .replace(/_compressed$/, "")
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .trim()
}

const files = readdirSync(PDF_DIR).filter(f => f.toLowerCase().endsWith(".pdf"))
console.log(`Found ${files.length} PDFs\n`)

let ok = 0, skip = 0, fail = 0

for (const file of files) {
  const name = humanName(file)
  const storagePath = `pdfs/${file}`

  // Skip if already uploaded
  const { data: existing } = await supabase
    .from("educational_content")
    .select("id")
    .ilike("name", name)
    .limit(1)

  if (existing?.length) {
    console.log(`⏭  skip  ${name}`)
    skip++
    continue
  }

  // Upload file
  const buffer = readFileSync(join(PDF_DIR, file))
  const { error: uploadErr } = await supabase.storage
    .from("education")
    .upload(storagePath, buffer, {
      contentType: "application/pdf",
      upsert: true,
    })

  if (uploadErr) {
    console.error(`✗  upload failed  ${name}: ${uploadErr.message}`)
    fail++
    continue
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from("education")
    .getPublicUrl(storagePath)

  // Insert DB record
  const { error: insertErr } = await supabase
    .from("educational_content")
    .insert({
      name,
      type: "pdf",
      file_url: publicUrl,
      practitioner_id: PRACTITIONER_ID,
    })

  if (insertErr) {
    console.error(`✗  db insert failed  ${name}: ${insertErr.message}`)
    fail++
    continue
  }

  console.log(`✓  ${name}`)
  ok++
}

console.log(`\nDone: ${ok} imported, ${skip} skipped, ${fail} failed`)
