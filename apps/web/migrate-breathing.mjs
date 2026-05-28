import pg from "pg"
import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

// load .env.local
const __dir = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dir, ".env.local")
try {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim()
  }
} catch {}

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error("Brak DATABASE_URL w .env.local")
  process.exit(1)
}

const { Pool } = pg
const pool = new Pool({ connectionString: DATABASE_URL })

async function run() {
  const client = await pool.connect()
  try {
    console.log("1. Dodawanie kolumn...")

    await client.query(`
      ALTER TABLE exercises ADD COLUMN IF NOT EXISTS exercise_type VARCHAR DEFAULT 'standard';
    `)
    console.log("   exercise_type OK")

    await client.query(`
      ALTER TABLE exercises ADD COLUMN IF NOT EXISTS breathing_config JSONB DEFAULT NULL;
    `)
    console.log("   breathing_config OK")

    console.log("2. Inserting breathing exercises...")

    await client.query(`
      INSERT INTO exercises (name, description, body_part, exercise_type, breathing_config, is_public, practitioner_id)
      VALUES
        ('Koherencja HRV', 'Oddychanie koherencyjne 5.5 oddechów/min — optymalne dla regulacji HRV i układu nerwowego.', 'Oddychanie', 'breathing',
         '{"pattern":"coherence","sessionDuration":300,"color":"emerald","phases":[{"label":"Wdech","cue":"nosem","duration":5.5},{"label":"Wydech","cue":"nosem","duration":5.5}]}'::jsonb,
         true, null),
        ('Box Breathing', 'Oddech pudełkowy — równe fazy wdechu, zatrzymania, wydechu i pauzy. Uspokaja układ nerwowy.', 'Oddychanie', 'breathing',
         '{"pattern":"box","sessionDuration":300,"color":"navy","phases":[{"label":"Wdech","cue":"nosem","duration":4},{"label":"Zatrzymaj","cue":"","duration":4},{"label":"Wydech","cue":"ustami","duration":4},{"label":"Zatrzymaj","cue":"","duration":4}]}'::jsonb,
         true, null),
        ('4-7-8 Oddychanie', 'Technika relaksacyjna — długie zatrzymanie i powolny wydech aktywują nerw błędny.', 'Oddychanie', 'breathing',
         '{"pattern":"478","sessionDuration":0,"sessionCycles":4,"color":"purple","phases":[{"label":"Wdech","cue":"nosem","duration":4},{"label":"Zatrzymaj","cue":"","duration":7},{"label":"Wydech","cue":"ustami","duration":8}]}'::jsonb,
         true, null),
        ('Oddech redukcyjny', 'Technika Buteyko — delikatny, spłycony oddech przez nos. Poprawia tolerancję CO₂.', 'Oddychanie', 'breathing',
         '{"pattern":"buteyko","sessionDuration":300,"color":"amber","phases":[{"label":"Wdech","cue":"nosem cicho","duration":2},{"label":"Wydech","cue":"nosem","duration":3},{"label":"Pauza","cue":"swobodna","duration":5}]}'::jsonb,
         true, null)
      ON CONFLICT DO NOTHING;
    `)

    console.log("   Ćwiczenia oddechowe wstawione OK")

    // Verify
    const { rows } = await client.query(`
      SELECT id, name, exercise_type FROM exercises WHERE exercise_type = 'breathing' ORDER BY name;
    `)
    console.log("\nZweryfikowane ćwiczenia oddechowe:")
    for (const r of rows) {
      console.log(`   [${r.id}] ${r.name}`)
    }

    console.log("\nMigracja zakończona pomyślnie!")
  } finally {
    client.release()
    await pool.end()
  }
}

run().catch((err) => {
  console.error("Błąd:", err)
  process.exit(1)
})
