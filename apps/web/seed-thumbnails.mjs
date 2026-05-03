import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dir = dirname(fileURLToPath(import.meta.url))
try {
  for (const line of readFileSync(resolve(__dir, ".env.local"), "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim()
  }
} catch {}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
)

async function getVimeoThumbnail(videoUrl) {
  try {
    const res = await fetch(
      `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(videoUrl)}&width=640`,
    )
    if (!res.ok) return null
    const data = await res.json()
    // upgrade to 640px version (strip size suffix and add _640)
    const thumb = data.thumbnail_url?.replace(/_\d+$/, "_640") ?? data.thumbnail_url
    return thumb ?? null
  } catch {
    return null
  }
}

async function main() {
  // fetch all system exercises with a video_url but no thumbnail
  const { data: exercises, error } = await supabase
    .from("exercises")
    .select("id, name, video_url, thumbnail_url")
    .is("practitioner_id", null)
    .not("video_url", "is", null)

  if (error) { console.error(error.message); process.exit(1) }

  const missing = exercises.filter(e => !e.thumbnail_url)
  console.log(`Znaleziono ${exercises.length} ćwiczeń, brakuje miniaturki: ${missing.length}\n`)

  let ok = 0, fail = 0
  for (const ex of missing) {
    const thumb = await getVimeoThumbnail(ex.video_url)
    if (!thumb) {
      console.log(`  ✗  ${ex.name}`)
      fail++
      continue
    }
    const { error: upErr } = await supabase
      .from("exercises")
      .update({ thumbnail_url: thumb })
      .eq("id", ex.id)

    if (upErr) {
      console.log(`  ✗  ${ex.name}: ${upErr.message}`)
      fail++
    } else {
      console.log(`  ✓  ${ex.name}`)
      ok++
    }

    // be polite to Vimeo API — small delay
    await new Promise(r => setTimeout(r, 120))
  }

  console.log(`\nGotowe! ✓ ${ok}  ✗ ${fail}`)
}

main().catch(console.error)
