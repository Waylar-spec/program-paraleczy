import pg from '/Users/wojciechdymek/Documents/Local Sites/Program.paraleczy/node_modules/.pnpm/pg@8.20.0/node_modules/pg/lib/index.js'
const { Client } = pg

const client = new Client({
  connectionString: 'postgresql://postgres.xehgkblqiixwhnhjupuv:VUYeoo9AdgdCTDH3@aws-0-eu-west-1.pooler.supabase.com:6543/postgres'
})

// ── IDs ────────────────────────────────────────────────────────────────────
const P = {
  epikondylozaBoczna:   '1d7241d5-7fd4-4ead-ab21-898c2dc684ed',
  epikondylozaPrzysr:   '9501523e-fed5-4ce1-8915-fe66df97d167',
  skolioza:             '23e9d2d0-c76c-425c-b6dc-8e751a90bd34',
  niestabilnoscBarku:   '5bb21250-61d3-4006-bf78-fb12733a9e27',
  zamrozonyBark:        '0bb1141c-5693-4046-a3ea-abf52834589c',
  impingement:          '0c5fd7a3-9fcd-44fd-a6df-432aed90c1ca',
  radikulopatiaS:       'fe275d0b-002d-4647-9f0f-ff1cf613ab69',
  cgh:                  '4589a50d-06d7-451c-bfcc-d3a4ec0227e8',
  nlbpSzyi:             '08c76376-9031-48af-a97f-492fc22fb54c',
  rwaKulszowa:          'd8910bff-7d5f-4321-b74f-87ab0c86946c',
  nlbpLedz:             '537c20f2-489d-4186-84e1-3b5fb2321072',
}

const S = {
  kolagen:      '947f9a4c-63d8-453a-8171-73de1f7caf68', // BICAPS collagen
  omega3:       'f930cae2-03a3-4e88-a2a1-eb894a632465', // OLICAPS omega 3
  witC:         '077cc9bf-127a-4b90-9eb8-4a3b21e969a6', // BICAPS C 1000
  bromelaina:   'ad903391-e311-4e80-b142-692bb07d9f4d', // BICAPS bromelain+
  msm:          'e9629c17-1d81-49b8-a19a-15b1ee34a276', // BICAPS MSM
  glukozamina:  '67c8e1bf-54c7-4f52-958b-a0157c0652a5', // BICAPS glucosamine
  boswellia:    '255b76ba-573b-48a3-9541-12a4e0729983', // BICAPS boswellia
  kurkuma:      '2a7b3026-2fcf-4cac-9ad7-075902d0235c', // BICAPS curcumin
  magB6:        'ae49f412-a9d4-4df1-bc4c-c11145bf2708', // BICAPS mag B6
  k2d3:         'a64603f5-27dc-419f-8a1c-831b7539fb8e', // BICAPS K2 D3
  bComplex:     '55a887a4-e697-45ba-b3f9-327df483e994', // BICAPS B complex
  calciumD3:    '416c8c1e-c975-4dcb-b291-d08cc8e48d00', // BICAPS calcium D3
  kolagenPow:   'daecf13a-0b99-4e9d-af56-eff962212d84', // POWDER collagen flex
  antystres:    '8ff13f9b-90ad-46f1-9f6d-f7a851ee7f67', // Anty-stres (zestaw)
  ashwagandha:  'f74458e6-d4f9-4157-83a0-8cca5f83747c', // BICAPS ashwagandha
  zdroweStawy:  'e57fa990-5c44-4bf0-9650-d777db6c7aeb', // Zdrowe stawy i mobilność
}

// ── Mappings ───────────────────────────────────────────────────────────────
// format: [protocol_id, supplement_id, notes]
const rows = [

  // ── Epikondyloza Boczna (Łokieć Tenisisty) ────────────────────────────
  [P.epikondylozaBoczna, S.kolagen,    'Wspiera regenerację ścięgna prostowników nadgarstka'],
  [P.epikondylozaBoczna, S.omega3,     'Redukuje stan zapalny w ścięgnie'],
  [P.epikondylozaBoczna, S.witC,       'Niezbędna do syntezy kolagenu — 1g/dzień'],
  [P.epikondylozaBoczna, S.bromelaina, 'Naturalny enzym przeciwzapalny — szczególnie w fazach ostrych'],
  [P.epikondylozaBoczna, S.msm,        'Siarka organiczna wspierająca odbudowę tkanek miękkich'],

  // ── Epikondyloza Przyśrodkowa (Łokieć Golfisty) ──────────────────────
  [P.epikondylozaPrzysr, S.kolagen,    'Wspiera regenerację ścięgna zginaczy nadgarstka'],
  [P.epikondylozaPrzysr, S.omega3,     'Redukuje stan zapalny w ścięgnie'],
  [P.epikondylozaPrzysr, S.witC,       'Niezbędna do syntezy kolagenu — 1g/dzień'],
  [P.epikondylozaPrzysr, S.bromelaina, 'Naturalny enzym przeciwzapalny'],
  [P.epikondylozaPrzysr, S.msm,        'Siarka organiczna wspierająca gojenie tkanek'],

  // ── Skolioza — Stabilizacja i Korekcja ───────────────────────────────
  [P.skolioza, S.k2d3,       'D3 i K2 — niezbędne dla mineralizacji kości i siły mięśniowej'],
  [P.skolioza, S.calciumD3,  'Wapń z D3 — fundament zdrowej tkanki kostnej'],
  [P.skolioza, S.magB6,      'Magnez reguluje napięcie mięśni przykręgosłupowych'],
  [P.skolioza, S.kolagenPow, 'Kolagen flex — wspiera więzadła i dyski kręgosłupa'],

  // ── Niestabilność Barku / Po Zwichnięciu ─────────────────────────────
  [P.niestabilnoscBarku, S.kolagen,    'Regeneracja torebki stawowej i więzadeł'],
  [P.niestabilnoscBarku, S.omega3,     'Przeciwzapalnie — ważne w fazie ostrej po zwichnięciu'],
  [P.niestabilnoscBarku, S.witC,       'Synteza kolagenu — przyspiesza gojenie więzadeł'],
  [P.niestabilnoscBarku, S.glukozamina,'Odbudowa chrząstki i tkanek stawu ramiennego'],
  [P.niestabilnoscBarku, S.msm,        'Siarka organiczna — wsparcie więzadeł i tkanek miękkich'],

  // ── Zamrożony Bark (Adhesive Capsulitis) ─────────────────────────────
  [P.zamrozonyBark, S.omega3,     'Silne działanie przeciwzapalne — kluczowe przy adhesive capsulitis'],
  [P.zamrozonyBark, S.boswellia,  'Hamuje enzymy prozapalne — wspomaga leczenie przykurczu torebki'],
  [P.zamrozonyBark, S.kurkuma,    'Kurkumina — potwierdzone działanie przeciwzapalne'],
  [P.zamrozonyBark, S.kolagen,    'Wspiera remodeling torebki stawowej'],
  [P.zamrozonyBark, S.k2d3,       'Witamina D3 — niedobór nasila bóle i spowalnia regenerację'],

  // ── Impingement + Tendinopatia Stożka Rotatorów ──────────────────────
  [P.impingement, S.kolagen,    'Regeneracja ścięgien stożka rotatorów'],
  [P.impingement, S.omega3,     'Redukuje stan zapalny w przestrzeni podbarkowej'],
  [P.impingement, S.witC,       'Synteza kolagenu — 1g/dzień przez cały program'],
  [P.impingement, S.boswellia,  'Hamuje leukotreny — naturalnie zmniejsza obrzęk i ból'],
  [P.impingement, S.magB6,      'Magnez — rozluźnia mięśnie piersiowe i barku, ułatwia mechanikę'],

  // ── Radikulopatia Szyjna ──────────────────────────────────────────────
  [P.radikulopatiaS, S.bComplex, 'B1, B6, B12 — niezbędne do regeneracji osłonek mielinowych'],
  [P.radikulopatiaS, S.omega3,   'Redukuje stan zapalny wokół korzeni nerwowych'],
  [P.radikulopatiaS, S.magB6,    'Magnez B6 — zmniejsza przewodnictwo bólowe i napięcie mięśniowe'],
  [P.radikulopatiaS, S.k2d3,     'Witamina D3 — niedobór nasila neuropatie i bóle korzeniowe'],
  [P.radikulopatiaS, S.kurkuma,  'Kurkumina — działa neuroprotekcyjnie i przeciwzapalnie'],

  // ── Cervicogenny Ból Głowy (CGH) ─────────────────────────────────────
  [P.cgh, S.magB6,       'Magnez — kluczowy przy napięciowych i szyjnopochodnych bólach głowy'],
  [P.cgh, S.omega3,      'Redukuje stan zapalny w stawach kręgosłupa szyjnego'],
  [P.cgh, S.bComplex,    'B2 i B12 — udowodnione działanie w profilaktyce bólu głowy'],
  [P.cgh, S.antystres,   'Magnez + ashwagandha — zmniejsza napięcie i reakcję stresową'],
  [P.cgh, S.ashwagandha, 'Adaptogen — redukuje napięcie mięśniowe i reaktywność na stres'],

  // ── Nieswoiste Bóle Szyi (NLBP Szyi) ────────────────────────────────
  [P.nlbpSzyi, S.magB6,   'Magnez — redukuje napięcie mięśni szyi i przykurcze'],
  [P.nlbpSzyi, S.omega3,  'Działanie przeciwzapalne na dyski i więzadła szyjne'],
  [P.nlbpSzyi, S.k2d3,    'Witamina D3 — niedobór częsty przy chronicznym bólu szyi'],
  [P.nlbpSzyi, S.bComplex,'Witaminy B — wsparcie układu nerwowego'],
  [P.nlbpSzyi, S.kolagen, 'Kolagen — wspiera dyski i więzadła kręgosłupa szyjnego'],

  // ── Rwa Kulszowa / Radikulopatia Lędźwiowa ───────────────────────────
  [P.rwaKulszowa, S.bComplex,'B1, B6, B12 — regeneracja nerwu kulszowego, redukcja bólu neuropatycznego'],
  [P.rwaKulszowa, S.omega3,  'Silne działanie przeciwzapalne — zmniejsza ucisk dysku'],
  [P.rwaKulszowa, S.magB6,   'Magnez B6 — zmniejsza skurcze mięśni i przewodnictwo bólowe'],
  [P.rwaKulszowa, S.k2d3,    'Witamina D3 — kluczowa przy bólach korzeniowych'],
  [P.rwaKulszowa, S.kurkuma, 'Kurkumina — silne działanie neuroprotekcyjne i przeciwzapalne'],

  // ── Nieswoiste Bóle Kręgosłupa Lędźwiowego (NLBP) ───────────────────
  [P.nlbpLedz, S.magB6,      'Magnez — redukuje napięcie mięśni przykręgosłupowych'],
  [P.nlbpLedz, S.omega3,     'Działanie przeciwzapalne — zmniejsza stan zapalny w tkankach'],
  [P.nlbpLedz, S.k2d3,       'Witamina D3 — niedobór koreluje z nasileniem NLBP'],
  [P.nlbpLedz, S.kurkuma,    'Kurkumina — porównywalna do ibuprofenu w badaniach bólu pleców'],
  [P.nlbpLedz, S.kolagenPow, 'Kolagen flex — wspiera więzadła, dyski i tkankę chrzęstną kręgosłupa'],
]

await client.connect()

// Check existing
const existing = await client.query('SELECT protocol_id, supplement_id FROM protocol_supplements')
const existingSet = new Set(existing.rows.map(r => `${r.protocol_id}:${r.supplement_id}`))

let inserted = 0, skipped = 0
for (const [protocolId, supplementId, notes] of rows) {
  const key = `${protocolId}:${supplementId}`
  if (existingSet.has(key)) { skipped++; continue }
  await client.query(
    'INSERT INTO protocol_supplements (protocol_id, supplement_id, notes) VALUES ($1, $2, $3)',
    [protocolId, supplementId, notes]
  )
  inserted++
}

console.log(`✅ Inserted ${inserted} protocol_supplements, skipped ${skipped} duplicates`)
await client.end()
