/**
 * Porządkuje wartości body_part i category w tabeli exercises.
 *
 * body_part:
 *  - Wiele wariantów kostki/stopy → "Stopa/Kostka"
 *  - Ogólne / Bieganie / Cardio   → "Całe ciało"
 *  - Udo                          → "Biodro"
 *
 * category:
 *  - Propriocepcja/* → "Propriocepcja"
 *  - Mobilizacja/*   → "Mobilność"
 *  - Wzmocnienie/*   → "Wzmocnienie"
 *  - Ekscentryczne/* → "Wzmocnienie"
 *  - Korekcja/*      → "Korekcja"
 *  - Edukacja/*      → "Edukacja"
 *  - Pliometria/*    → "Pliometria"
 *  - Dynamika/*      → "Dynamika"
 */

import pg from '/Users/wojciechdymek/Documents/Local Sites/Program.paraleczy/node_modules/.pnpm/pg@8.20.0/node_modules/pg/lib/index.js'
const { Client } = pg
const client = new Client({ connectionString: 'postgresql://postgres.xehgkblqiixwhnhjupuv:VUYeoo9AdgdCTDH3@aws-0-eu-west-1.pooler.supabase.com:6543/postgres' })
await client.connect()

// ── BODY_PART cleanup ─────────────────────────────────────────────────────────

const bodyPartMerges = [
  {
    target: 'Stopa/Kostka',
    sources: [
      'Stopa',
      'Staw skokowy / Stopa',
      'Łydka / Stopa',
      'Staw skokowy',
      'Stopa / Staw skokowy',
      'Stopa/Skokowy',
      'Staw skokowy / Równowaga',
      'Staw skokowy / Kończyna dolna',
      'Łydka / Ścięgno Achillesa',
      'Staw skokowy / Kolano',
    ],
  },
  {
    target: 'Całe ciało',
    sources: ['Ogólne', 'Bieganie', 'Cardio'],
  },
  {
    target: 'Biodro',
    sources: ['Udo'],
  },
]

console.log('── body_part ────────────────────────────────────')
for (const { target, sources } of bodyPartMerges) {
  const { rowCount } = await client.query(
    `UPDATE exercises SET body_part = $1 WHERE body_part = ANY($2)`,
    [target, sources]
  )
  console.log(`✓ → "${target}"  (${rowCount} wierszy)`)
}

// ── CATEGORY cleanup ──────────────────────────────────────────────────────────

// Merge compound "X / Y" categories — anything starting with these prefixes → clean target
// We use ILIKE-style matching so partial variants are all caught
const categoryMerges = [
  { target: 'Propriocepcja', prefixes: ['Propriocepcja', 'Korekcja / Propriocepcja'] },
  { target: 'Mobilność',     prefixes: ['Mobilizacja', 'ROM', 'Mobilność'] },
  { target: 'Wzmocnienie',   prefixes: ['Wzmocnienie', 'Ekscentryczne'] },
  { target: 'Korekcja',      prefixes: ['Korekcja'] },
  { target: 'Edukacja',      prefixes: ['Edukacja'] },
  { target: 'Pliometria',    prefixes: ['Pliometria'] },
  { target: 'Dynamika',      prefixes: ['Dynamika'] },
]

// Build explicit LIKE conditions for compound values
const categoryUpdates = [
  // Compound slash categories
  { target: 'Propriocepcja', like: 'Propriocepcja /%' },
  { target: 'Propriocepcja', like: '% / Propriocepcja%' },
  { target: 'Propriocepcja', exact: 'Korekcja / Propriocepcja' },
  { target: 'Propriocepcja', like: 'Propriocepcja%Aktywność%' },
  { target: 'Propriocepcja', like: 'Propriocepcja%Chód%' },
  { target: 'Propriocepcja', like: 'Propriocepcja%Dynamika%' },
  { target: 'Propriocepcja', like: 'Propriocepcja%Równowaga%' },

  { target: 'Mobilność',     like: 'Mobilizacja%' },
  { target: 'Mobilność',     like: 'Mobilizacja / %' },
  { target: 'Mobilność',     like: '% / Krążenie%' },
  { target: 'Mobilność',     like: '% / Masaż%' },
  { target: 'Mobilność',     like: 'ROM%' },

  { target: 'Wzmocnienie',   like: 'Wzmocnienie / %' },
  { target: 'Wzmocnienie',   like: 'Ekscentryczne / %' },
  { target: 'Wzmocnienie',   like: '% / Izometryczne%' },
  { target: 'Wzmocnienie',   like: '% / Wzmocnienie%' },

  { target: 'Korekcja',      like: 'Korekcja / %' },

  { target: 'Edukacja',      like: 'Edukacja / %' },

  { target: 'Pliometria',    like: 'Pliometria / %' },

  { target: 'Dynamika',      like: 'Dynamika / %' },
  { target: 'Dynamika',      like: '% / Dynamika%' },
  { target: 'Dynamika',      like: '% / Powrót do sportu%' },
]

console.log('\n── category ─────────────────────────────────────')

let totalCategoryRows = 0
for (const upd of categoryUpdates) {
  const condition = upd.exact
    ? `category = $2`
    : `category LIKE $2`
  const value = upd.exact ?? upd.like
  const { rowCount } = await client.query(
    `UPDATE exercises SET category = $1 WHERE ${condition} AND category != $1`,
    [upd.target, value]
  )
  if (rowCount > 0) {
    console.log(`✓ "${value}" → "${upd.target}"  (${rowCount})`)
    totalCategoryRows += rowCount
  }
}

// Verify: show remaining distinct values
const { rows: bodyParts } = await client.query(
  `SELECT body_part, count(*) FROM exercises GROUP BY body_part ORDER BY body_part`
)
const { rows: categories } = await client.query(
  `SELECT category, count(*) FROM exercises GROUP BY category ORDER BY category`
)

console.log('\n── Pozostałe body_part ───────────────────────────')
for (const r of bodyParts) console.log(`  ${r.body_part ?? '(null)'}  ×${r.count}`)

console.log('\n── Pozostałe category ────────────────────────────')
for (const r of categories) console.log(`  ${r.category ?? '(null)'}  ×${r.count}`)

await client.end()
console.log('\n✅ Done.')
