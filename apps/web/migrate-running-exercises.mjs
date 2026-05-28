import pg from '/Users/wojciechdymek/Documents/Local Sites/Program.paraleczy/node_modules/.pnpm/pg@8.20.0/node_modules/pg/lib/index.js'
const { Client } = pg

const client = new Client({
  connectionString: 'postgresql://postgres.xehgkblqiixwhnhjupuv:VUYeoo9AdgdCTDH3@aws-0-eu-west-1.pooler.supabase.com:6543/postgres'
})

await client.connect()

// ── Add running_config column ──────────────────────────────────────────────
await client.query(`
  ALTER TABLE exercises ADD COLUMN IF NOT EXISTS running_config JSONB DEFAULT NULL;
`)
console.log('1. running_config column OK')

// ── 6 video exercises ──────────────────────────────────────────────────────
const videoExercises = [
  {
    name: 'Odwodzenie biodra w leżeniu bokiem',
    description: 'Ćwiczenie wzmacniające mięsień pośladkowy średni. Leżąc na boku unoś prostą nogę ku górze, kontroluj ruch powolnie w dół.',
    body_part: 'Biodro',
    video_url: 'https://media.physitrack.com/exercises/87cbdabc-0a44-4b0b-9c0a-738e8638af9c/pl/video_720p.mp4',
  },
  {
    name: 'Rozciąganie pasma IT',
    description: 'Rozciąganie pasma biodrowo-piszczelowego — kluczowe przy zespole pasma IT i bólach bocznej strony kolana.',
    body_part: 'Kolano',
    video_url: 'https://media.physitrack.com/exercises/269b9871-25b0-4b74-a8b0-5ca7f0ef50c1/pl/video_720p.mp4',
  },
  {
    name: 'Rozciąganie czworogłowego uda',
    description: 'Rozciąganie mięśnia czworogłowego — poprawia zakres zgięcia kolana i zmniejsza napięcie przedniej części uda.',
    body_part: 'Udo',
    video_url: 'https://media.physitrack.com/exercises/ee24769b-d893-4ff9-90b6-336c1efb94dd/pl/video_720p.mp4',
  },
  {
    name: 'Mini przysiady',
    description: 'Kontrolowany przysiad w ograniczonym zakresie (0–45°). Aktywuje mięsień czworogłowy bez nadmiernego obciążania stawu kolanowego.',
    body_part: 'Kolano',
    video_url: 'https://media.physitrack.com/exercises/ba02fb7d-8e7b-4593-b952-6dc9b9b7df71/pl/video_720p.mp4',
  },
  {
    name: 'Wall sit (siedzenie przy ścianie)',
    description: 'Izometryczne wzmacnianie mięśnia czworogłowego. Utrzymuj pozycję z plecami przy ścianie i kolanami pod kątem 90°.',
    body_part: 'Kolano',
    video_url: 'https://media.physitrack.com/exercises/78c2dfb7-ca1e-4bb4-9c83-aeb2881edb5a/pl/video_720p.mp4',
  },
  {
    name: 'Wykrok do przodu',
    description: 'Ćwiczenie funkcjonalne wzmacniające mięśnie nogi i stabilizatory. Kontrolowany krok do przodu z powrotem do pozycji wyjściowej.',
    body_part: 'Kolano',
    video_url: 'https://media.physitrack.com/exercises/6bc927e6-ddbf-4bec-9985-0a022f99e9e0/pl/video_720p.mp4',
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
console.log(`2. Video exercises: inserted ${inserted}, skipped ${skipped}`)

// ── Stopniowy powrót do biegania ───────────────────────────────────────────
const runningConfig = {
  color: 'emerald',
  totalMinutes: 23,
  description: 'Protokół tygodnia 1–2 powrotu do biegania po przerwie lub kontuzji.',
  phases: [
    { label: 'Marsz — rozgrzewka', duration: 300, type: 'walk' },
    { label: 'Lekki trucht', duration: 60, type: 'run' },
    { label: 'Marsz', duration: 120, type: 'walk' },
    { label: 'Lekki trucht', duration: 60, type: 'run' },
    { label: 'Marsz', duration: 120, type: 'walk' },
    { label: 'Lekki trucht', duration: 60, type: 'run' },
    { label: 'Marsz', duration: 120, type: 'walk' },
    { label: 'Lekki trucht', duration: 60, type: 'run' },
    { label: 'Marsz', duration: 120, type: 'walk' },
    { label: 'Lekki trucht', duration: 60, type: 'run' },
    { label: 'Marsz — schłodzenie', duration: 300, type: 'walk' },
  ]
}

const { rows: existRun } = await client.query(
  `SELECT id FROM exercises WHERE name = 'Stopniowy powrót do biegania' AND is_public = true AND practitioner_id IS NULL`
)
if (existRun.length === 0) {
  await client.query(
    `INSERT INTO exercises (name, description, body_part, exercise_type, running_config, is_public, practitioner_id)
     VALUES ($1, $2, $3, $4, $5, true, NULL)`,
    [
      'Stopniowy powrót do biegania',
      'Interwałowy protokół powrotu do biegania (tydzień 1–2). Naprzemienne odcinki marszu i lekkiego truchtu pomagają stopniowo obciążać stawy i tkanki po przerwie lub rehabilitacji.',
      'Bieganie',
      'running_intervals',
      JSON.stringify(runningConfig),
    ]
  )
  console.log('3. "Stopniowy powrót do biegania" inserted')
} else {
  console.log('3. "Stopniowy powrót do biegania" already exists')
}

// ── Ćwiczenia aerobowe ─────────────────────────────────────────────────────
const aerobicConfig = {
  color: 'sky',
  totalMinutes: 30,
  description: 'Niskointensywna aktywność aerobowa — rower, pływanie, marsz lub ergometr.',
  phases: [
    { label: 'Rozgrzewka', duration: 300, type: 'warmup' },
    { label: 'Aktywność aerobowa', duration: 1200, type: 'active' },
    { label: 'Schłodzenie', duration: 300, type: 'cooldown' },
  ]
}

const { rows: existAero } = await client.query(
  `SELECT id FROM exercises WHERE name = 'Ćwiczenia aerobowe' AND is_public = true AND practitioner_id IS NULL`
)
if (existAero.length === 0) {
  await client.query(
    `INSERT INTO exercises (name, description, body_part, exercise_type, running_config, is_public, practitioner_id)
     VALUES ($1, $2, $3, $4, $5, true, NULL)`,
    [
      'Ćwiczenia aerobowe',
      'Sesja niskointensywnej aktywności aerobowej. Dobierz dowolną formę: rower stacjonarny, pływanie, marsz lub ergometr wioślarski. Cel: strefa tętna 50–70% HRmax (umiarkowany wysiłek, możliwość swobodnej rozmowy).',
      'Cardio',
      'aerobic_session',
      JSON.stringify(aerobicConfig),
    ]
  )
  console.log('4. "Ćwiczenia aerobowe" inserted')
} else {
  console.log('4. "Ćwiczenia aerobowe" already exists')
}

await client.end()
console.log('✅ Done')
