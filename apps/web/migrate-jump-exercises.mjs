import pg from '/Users/wojciechdymek/Documents/Local Sites/Program.paraleczy/node_modules/.pnpm/pg@8.20.0/node_modules/pg/lib/index.js'
const { Client } = pg

const client = new Client({
  connectionString: 'postgresql://postgres.xehgkblqiixwhnhjupuv:VUYeoo9AdgdCTDH3@aws-0-eu-west-1.pooler.supabase.com:6543/postgres'
})

await client.connect()

// ── 3 video exercises ──────────────────────────────────────────────────────
const videoExercises = [
  {
    name: 'Ekscentryczny przysiad jednonóż',
    description: 'Powolne opuszczanie na jednej nodze — faza ekscentryczna aktywuje i wzmacnia mięsień czworogłowy. Kluczowe w rehabilitacji kolana i tendinopatii rzepki.',
    body_part: 'Kolano',
    video_url: 'https://media.physitrack.com/exercises/a8447131-57e2-4005-adad-72395b40a05a/pl/video_720p.mp4',
  },
  {
    name: 'Przysiad jednonóż',
    description: 'Przysiad na jednej nodze — wzmacnia mięsień czworogłowy, pośladkowy i stabilizatory kolana. Wymaga dobrej kontroli motorycznej i balansu.',
    body_part: 'Kolano',
    video_url: 'https://media.physitrack.com/exercises/ae81ff1e-c591-4d9a-a673-62f931f0be68/pl/video_720p.mp4',
  },
  {
    name: 'Romanian Deadlift jednonóż',
    description: 'Martwy ciąg na jednej nodze — rozciąga i wzmacnia kulszowo-goleniowe, poprawia kontrolę miednicy i stabilność biodra w pozycji jednonożnej.',
    body_part: 'Biodro',
    video_url: 'https://media.physitrack.com/exercises/e59ac850-61fc-4ecb-ba90-13729c9da718/pl/video_720p.mp4',
  },
]

let inserted = 0, skipped = 0
for (const ex of videoExercises) {
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
console.log(`1. Video exercises: inserted ${inserted}, skipped ${skipped}`)

// ── Progresja skoków ───────────────────────────────────────────────────────
const jumpConfig = {
  color: 'violet',
  totalMinutes: 0,   // 0 = no timer, protocol only
  steps: [
    'Tydzień 1 — skoki obunóż w miejscu: miękkie lądowanie na obu nogach, 3 serie × 10 skoków',
    'Tydzień 2 — skoki jednonóż w miejscu: kontrolowane lądowanie, 3 serie × 6 skoków na nogę',
    'Tydzień 3 — skoki z miejsca w przód: ląduj stabilnie, utrzymaj równowagę 2 sek, 3 serie × 8',
    'Tydzień 4 — powrót do specyficznych skoków sportowych (sprint, zmiana kierunku, odbicia pionowe)',
    '⚠️ Warunek przejścia: brak bólu podczas ćwiczenia i przez 24h po każdym etapie',
    'Częstotliwość: 3× w tygodniu — z dniem przerwy między sesjami',
  ]
}

const { rows: existJump } = await client.query(
  `SELECT id FROM exercises WHERE name = 'Progresja skoków' AND is_public = true AND practitioner_id IS NULL`
)
if (existJump.length === 0) {
  await client.query(
    `INSERT INTO exercises (name, description, body_part, exercise_type, running_config, is_public, practitioner_id)
     VALUES ($1, $2, $3, $4, $5, true, NULL)`,
    [
      'Progresja skoków',
      'Stopniowy powrót do obciążeń sportowych wymagających odbicia. Zawsze kryterialna — każdy etap odblokowany dopiero po bezbolesnym ukończeniu poprzedniego.',
      'Kolano',
      'aerobic_session',
      JSON.stringify(jumpConfig),
    ]
  )
  console.log('2. "Progresja skoków" inserted')
} else {
  console.log('2. "Progresja skoków" already exists')
}

await client.end()
console.log('✅ Done')
