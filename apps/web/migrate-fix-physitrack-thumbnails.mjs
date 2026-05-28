import pg from '/Users/wojciechdymek/Documents/Local Sites/Program.paraleczy/node_modules/.pnpm/pg@8.20.0/node_modules/pg/lib/index.js'
const { Client } = pg

const client = new Client({
  connectionString: 'postgresql://postgres.xehgkblqiixwhnhjupuv:VUYeoo9AdgdCTDH3@aws-0-eu-west-1.pooler.supabase.com:6543/postgres'
})

await client.connect()

// Find exercises with a Physitrack video_url but no thumbnail_url
const { rows } = await client.query(`
  SELECT id, name, video_url
  FROM exercises
  WHERE video_url LIKE '%media.physitrack.com%'
    AND thumbnail_url IS NULL
`)

console.log(`Found ${rows.length} exercises to fix:`)

let updated = 0
for (const row of rows) {
  // Derive thumbnail URL: replace video_720p.mp4 with thumbnail_800x450.jpg
  const thumbnailUrl = row.video_url
    .replace('video_720p.mp4', 'thumbnail_800x450.jpg')
    .replace('video_360p.mp4', 'thumbnail_800x450.jpg')
    .replace('video_480p.mp4', 'thumbnail_800x450.jpg')

  if (thumbnailUrl === row.video_url) {
    console.log(`  SKIP (no mp4 match): ${row.name}`)
    continue
  }

  await client.query(
    `UPDATE exercises SET thumbnail_url = $1 WHERE id = $2`,
    [thumbnailUrl, row.id]
  )
  console.log(`  ✅ Updated: ${row.name}`)
  console.log(`     thumbnail: ${thumbnailUrl}`)
  updated++
}

console.log(`\nUpdated: ${updated} / ${rows.length}`)
await client.end()
console.log('✅ Done')
