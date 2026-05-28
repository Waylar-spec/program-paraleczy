import pg from '/Users/wojciechdymek/Documents/Local Sites/Program.paraleczy/node_modules/.pnpm/pg@8.20.0/node_modules/pg/lib/index.js'
const { Client } = pg

const client = new Client({
  connectionString: 'postgresql://postgres.xehgkblqiixwhnhjupuv:VUYeoo9AdgdCTDH3@aws-0-eu-west-1.pooler.supabase.com:6543/postgres'
})

await client.connect()

const exercises = [
  {
    name: 'Izometryczny wyprost kolana 20°',
    description: 'Statyczne napięcie mięśnia czworogłowego przy wyproście kolana pod kątem 20 stopni — minimalne obciążenie stawu, maksymalna aktywacja mięśnia. Kluczowe ćwiczenie we wczesnej fazie rehabilitacji kolana i tendinopatii rzepki.',
    body_part: 'Kolano',
    video_url: 'https://media.physitrack.com/exercises/47da2bff-6a9e-45f1-b5b9-26ac4fe85e89/pl/video_720p.mp4',
  },
]

let inserted = 0, skipped = 0
for (const ex of exercises) {
  const { rows } = await client.query(
    `SELECT id FROM exercises WHERE name = $1 AND is_public = true AND practitioner_id IS NULL`,
    [ex.name]
  )
  if (rows.length > 0) { skipped++; continue }
  await client.query(
    `INSERT INTO exercises (name, description, body_part, video_url, is_public, practitioner_id)
     VALUES ($1, $2, $3, $4, true, NULL)`,
    [ex.name, ex.description, ex.body_part, ex.video_url]
  )
  inserted++
}

console.log(`Inserted: ${inserted}, skipped: ${skipped}`)
await client.end()
console.log('✅ Done')
