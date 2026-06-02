/**
 * Przypisuje suplementy do 8 protokołów które ich nie mają:
 *  - GTPS, FAI, Koksartroza               (biodro)
 *  - Koślawe Kolana Dorosły, Dziecko       (kolano)
 *  - Dolny Skrzyżowany Zespół              (LS)
 *  - Hiperlordoza lędźwiowa                (LS)
 *  - Górny Skrzyżowany Zespół              (piersiowy)
 */

import pg from '/Users/wojciechdymek/Documents/Local Sites/Program.paraleczy/node_modules/.pnpm/pg@8.20.0/node_modules/pg/lib/index.js'
const { Client } = pg
const client = new Client({ connectionString: 'postgresql://postgres.xehgkblqiixwhnhjupuv:VUYeoo9AdgdCTDH3@aws-0-eu-west-1.pooler.supabase.com:6543/postgres' })
await client.connect()

// ── Mapa suplementów ──────────────────────────────────────────────────────────

const S = {
  collagen:       '947f9a4c-63d8-453a-8171-73de1f7caf68', // BICAPS collagen
  collagenMax:    '46388c6b-9d10-4214-845a-364b5142847e', // BICAPS collagen max
  collagenFlex:   'daecf13a-0b99-4e9d-af56-eff962212d84', // POWDER collagen flex
  glucosamine:    '67c8e1bf-54c7-4f52-958b-a0157c0652a5', // BICAPS glucosamine
  hyaluronic:     '534c3ef8-73ef-4613-baa1-35b869c92afa', // BICAPS hyaluronic acid
  msm:            'e9629c17-1d81-49b8-a19a-15b1ee34a276', // BICAPS MSM
  curcumin:       '2a7b3026-2fcf-4cac-9ad7-075902d0235c', // BICAPS curcumin
  boswellia:      '255b76ba-573b-48a3-9541-12a4e0729983', // BICAPS boswellia
  omega3:         'f930cae2-03a3-4e88-a2a1-eb894a632465', // OLICAPS omega 3
  d3_4000:        '561af232-c107-46f3-a133-99d19869fa07', // BICAPS D3 4000
  d3_2000:        'afec4c4e-b681-4085-9a05-bc0b60adcb5e', // BICAPS D3 2000
  k2d3:           'a64603f5-27dc-419f-8a1c-831b7539fb8e', // BICAPS K2 D3
  magB6:          'ae49f412-a9d4-4df1-bc4c-c11145bf2708', // BICAPS mag B6
  vitC:           '077cc9bf-127a-4b90-9eb8-4a3b21e969a6', // BICAPS C 1000
}

// ── Mapa protokołów ───────────────────────────────────────────────────────────

const PROTOCOLS = {
  gtps:       '87ff8c75-e60c-4240-bfb1-41947bc1d841',
  fai:        '878c8665-596c-46f3-acd6-3acb1dea8552',
  koksartroza:'823b67d9-5a63-4db1-94ae-d1323fdc74e1',
  kolanoAdult:'b24b9272-0321-47c5-9554-d8305112c1a4',
  kolanoChild:'61be1e8e-6b85-430c-b820-6eb6e556d486',
  dolnySkrzyz:'cc785229-d5ca-4a73-82ad-e781af17c9f8',
  hiperlordoza:'d5a1f11c-8d70-44dc-9293-eb166f954553',
  gornySkrzyz:'105ba92e-fa4b-4c9b-8658-cefeb894041c',
}

// ── Helper ────────────────────────────────────────────────────────────────────

async function assign(protocolId, items) {
  for (const { suppId, notes } of items) {
    await client.query(
      `INSERT INTO protocol_supplements (protocol_id, supplement_id, notes) VALUES ($1,$2,$3)`,
      [protocolId, suppId, notes]
    )
  }
}

// ── GTPS — Tendinopatia Pośladkowa ───────────────────────────────────────────
// Tendinopatia ścięgna pośladkowego — jak Achilles, inny mięsień

await assign(PROTOCOLS.gtps, [
  { suppId: S.collagen,    notes: 'Kolagen — fundament regeneracji ścięgna pośladkowego. 15 g na 30 min przed ćwiczeniami z witaminą C. Stosuj przez cały protokół.' },
  { suppId: S.collagenMax, notes: 'BICAPS Collagen Max — wzmocniona formuła kolagenowa dla ścięgien i tkanki łącznej biodra.' },
  { suppId: S.msm,         notes: 'MSM działa synergistycznie z kolagenem — wspiera regenerację ścięgien i zmniejsza ból.' },
  { suppId: S.curcumin,    notes: 'Kurkumina — silne działanie przeciwzapalne przy tendinopatii. Łącz z pieprzem czarnym lub tłustym posiłkiem.' },
  { suppId: S.omega3,      notes: 'Omega-3 — działanie przeciwzapalne, zmniejsza ból ścięgna i przyspiesza regenerację. 2 kaps. dziennie z posiłkiem.' },
  { suppId: S.d3_4000,     notes: 'Witamina D3 4000 IU — niedobór D3 zwiększa ryzyko tendinopatii i spowalnia regenerację tkanek.' },
])
console.log('✓ GTPS — 6 suplementów')

// ── FAI / Tendinopatia Przywodzicieli ─────────────────────────────────────────
// Mix: staw biodrowy + ścięgna przywodzicieli

await assign(PROTOCOLS.fai, [
  { suppId: S.collagen,    notes: 'Kolagen wspiera regenerację ścięgien przywodzicieli i chrząstki stawu biodrowego. 15 g dziennie z witaminą C.' },
  { suppId: S.msm,         notes: 'MSM — działanie przeciwzapalne i wsparcie tkanki łącznej stawu biodrowego i ścięgien.' },
  { suppId: S.curcumin,    notes: 'Kurkumina — naturalne działanie przeciwzapalne przy FAI i tendinopatii przywodzicieli.' },
  { suppId: S.boswellia,   notes: 'Boswellia — naturalny inhibitor COX-2, szczególnie skuteczna przy bólu i zapaleniu stawu biodrowego.' },
  { suppId: S.omega3,      notes: 'Omega-3 — redukuje stan zapalny i ból stawu biodrowego. 2 kaps. dziennie z posiłkiem.' },
  { suppId: S.d3_4000,     notes: 'Witamina D3 4000 IU — wspiera zdrowie kości i regenerację tkanek.' },
])
console.log('✓ FAI — 6 suplementów')

// ── Koksartroza ───────────────────────────────────────────────────────────────
// Zwyrodnienie stawu biodrowego — jak Gonartroza, inny staw

await assign(PROTOCOLS.koksartroza, [
  { suppId: S.collagen,    notes: 'Kolagen — 10–15 g dziennie z witaminą C. Wspiera regenerację chrząstki stawu biodrowego.' },
  { suppId: S.glucosamine, notes: 'Glukozamina — najlepiej przebadany suplement przy artrozie. Efekt po 6–8 tygodniach. Stosuj długoterminowo przez cały protokół.' },
  { suppId: S.hyaluronic,  notes: 'Kwas hialuronowy — nawilżenie stawu biodrowego, właściwości amortyzujące. Szczególnie ważne przy koksartrozie.' },
  { suppId: S.msm,         notes: 'MSM działa synergistycznie z glukozaminą — redukcja bólu i sztywności stawu biodrowego.' },
  { suppId: S.curcumin,    notes: 'Kurkumina — naturalne działanie przeciwzapalne, alternatywa dla NLPZ przy długoterminowym stosowaniu.' },
  { suppId: S.omega3,      notes: 'Omega-3 — silne działanie przeciwzapalne. Zmniejsza sztywność poranną i ból przy koksartrozie.' },
  { suppId: S.d3_4000,     notes: 'Witamina D3 4000 IU — niedobór D3 koreluje z nasileniem koksartrozy. Suplementacja kluczowa przez cały protokół.' },
])
console.log('✓ Koksartroza — 7 suplementów')

// ── Koślawe Kolana — Dorosły ──────────────────────────────────────────────────
// Biomechanika kolana — wsparcie chrząstki + funkcja mięśniowa

await assign(PROTOCOLS.kolanoAdult, [
  { suppId: S.collagen,    notes: 'Kolagen wspiera chrząstkę stawową kolana i więzadła. 1 kaps. dziennie z posiłkiem, przez cały protokół.' },
  { suppId: S.glucosamine, notes: 'Glukozamina — wsparcie chrząstki stawu kolanowego. 2 kaps. dziennie, min. 6–8 tygodni dla efektu.' },
  { suppId: S.msm,         notes: 'MSM zmniejsza stan zapalny i ból stawu kolanowego, działa synergistycznie z glukozaminą.' },
  { suppId: S.k2d3,        notes: 'Witamina K2+D3 — zdrowie kości i prawidłowa funkcja mięśni pośladkowych. 1 kaps. dziennie z tłustym posiłkiem.' },
  { suppId: S.magB6,       notes: 'Magnez z B6 — zmniejsza bolesne skurcze mięśniowe, wspomaga funkcję nerwowo-mięśniową. 1–2 kaps. wieczorem.' },
  { suppId: S.omega3,      notes: 'Omega-3 — działanie przeciwzapalne. 2 kaps. dziennie z posiłkiem.' },
])
console.log('✓ Koślawe Kolana Dorosły — 6 suplementów')

// ── Koślawe Kolana — Dziecko ──────────────────────────────────────────────────
// Dzieci rosnące — uproszczona suplementacja, bezpieczne dawki

await assign(PROTOCOLS.kolanoChild, [
  { suppId: S.d3_2000,     notes: 'Witamina D3 2000 IU dla dzieci — kluczowa dla prawidłowego wzrostu kości i funkcji mięśni. Dzieci w Polsce mają powszechny niedobór D3.' },
  { suppId: S.magB6,       notes: 'Magnez z B6 — wspiera funkcję nerwowo-mięśniową i zdrowe kości u dziecka. Połowa dawki dorosłej (1 kaps. dziennie).' },
  { suppId: S.vitC,        notes: 'Witamina C 1000 mg — niezbędna do syntezy kolagenu w rosnących stawach, więzadłach i chrząstkach.' },
])
console.log('✓ Koślawe Kolana Dziecko — 3 suplementy')

// ── Dolny Skrzyżowany Zespół ──────────────────────────────────────────────────
// Nierównowaga mięśniowa, napięcie — jak NLBP + wsparcie tkanki łącznej

await assign(PROTOCOLS.dolnySkrzyz, [
  { suppId: S.magB6,        notes: 'Magnez redukuje napięcie napiętych zginaczy biodra i prostowników LS — kluczowe w dolnym skrzyżowanym zespole. 1–2 kaps. wieczorem.' },
  { suppId: S.k2d3,         notes: 'Witamina K2+D3 — zdrowie kości lędźwiowych i prawidłowa funkcja mięśni pośladkowych. 1 kaps. dziennie.' },
  { suppId: S.omega3,       notes: 'Omega-3 — działanie przeciwzapalne w tkankach przykręgosłupowych i stawach biodrowych.' },
  { suppId: S.curcumin,     notes: 'Kurkumina zmniejsza przewlekłe napięcie zapalne mięśni i tkanek miękkich.' },
  { suppId: S.collagenFlex, notes: 'Kolagen Flex — wspiera więzadła, ścięgna i dyski kręgosłupa lędźwiowego.' },
])
console.log('✓ Dolny Skrzyżowany Zespół — 5 suplementów')

// ── Hiperlordoza lędźwiowa — korekcja ────────────────────────────────────────
// Jak Dolny Skrzyżowany, bardziej strukturalna korekta postawy

await assign(PROTOCOLS.hiperlordoza, [
  { suppId: S.magB6,        notes: 'Magnez redukuje napięcie mięśni przykręgosłupowych i napiętych zginaczy biodra. 1–2 kaps. wieczorem.' },
  { suppId: S.k2d3,         notes: 'Witamina K2+D3 — zdrowie kości lędźwiowych i prawidłowa funkcja mięśni. 1 kaps. dziennie z tłustym posiłkiem.' },
  { suppId: S.omega3,       notes: 'Omega-3 — działanie przeciwzapalne w przeciążonych strukturach kręgosłupa.' },
  { suppId: S.collagenFlex, notes: 'Kolagen Flex — wspiera więzadła, ścięgna i dyski kręgosłupa lędźwiowego.' },
])
console.log('✓ Hiperlordoza lędźwiowa — 4 suplementy')

// ── Górny Skrzyżowany Zespół ──────────────────────────────────────────────────
// Napięcie mięśni szyi i obręczy barkowej — jak NLBP szyi + kolagen

await assign(PROTOCOLS.gornySkrzyz, [
  { suppId: S.magB6,        notes: 'Magnez redukuje napięcie napiętych mięśni szyjnych, karku i górnego trapezu — priorytet w górnym skrzyżowanym. 1–2 kaps. wieczorem.' },
  { suppId: S.k2d3,         notes: 'Witamina K2+D3 — zdrowie kości kręgosłupa szyjnego i piersiowego, funkcja mięśni stabilizatorów łopatki.' },
  { suppId: S.omega3,       notes: 'Omega-3 — redukuje przewlekłe napięcie zapalne w strukturach szyjno-piersiowych.' },
  { suppId: S.curcumin,     notes: 'Kurkumina zmniejsza przewlekłe napięcie zapalne mięśni piersiowych i szyjnych.' },
  { suppId: S.collagenFlex, notes: 'Kolagen Flex — wspiera więzadła, dyski i torebki stawowe kręgosłupa szyjnego i piersiowego.' },
])
console.log('✓ Górny Skrzyżowany Zespół — 5 suplementów')

// ── Weryfikacja ───────────────────────────────────────────────────────────────

const { rows } = await client.query(`
  SELECT rp.name, count(ps.id) as cnt
  FROM rehabilitation_protocols rp
  LEFT JOIN protocol_supplements ps ON ps.protocol_id = rp.id
  GROUP BY rp.name
  HAVING count(ps.id) = 0
`)
if (rows.length === 0) {
  console.log('\n✅ Wszystkie protokoły mają przypisane suplementy.')
} else {
  console.log('\n⚠️ Protokoły nadal bez suplementów:')
  rows.forEach(r => console.log('  -', r.name))
}

await client.end()
