/**
 * 1. Nowe ćwiczenie: Mostek z gumą (kolana na zewnątrz)
 * 2. Protokół: Dolny Skrzyżowany Zespół (12 tyg)
 * 3. Protokół: Górny Skrzyżowany Zespół (12 tyg)
 * 4. Protokół: Koślawe Kolana — Dorosły (12 tyg)
 * 5. Protokół: Koślawe Kolana — Dziecko 7–14 lat (12 tyg)
 */

import pg from '/Users/wojciechdymek/Documents/Local Sites/Program.paraleczy/node_modules/.pnpm/pg@8.20.0/node_modules/pg/lib/index.js'
const { Client } = pg
const client = new Client({ connectionString: 'postgresql://postgres.xehgkblqiixwhnhjupuv:VUYeoo9AdgdCTDH3@aws-0-eu-west-1.pooler.supabase.com:6543/postgres' })
await client.connect()

const PRACTITIONER_ID = '9aa0657a-af0d-4225-af22-9b0610dc00c2'
const PT = 'https://media.physitrack.com/exercises'

// ─────────────────────────────────────────────────────────────────────────────
// 1. NOWE ĆWICZENIE
// ─────────────────────────────────────────────────────────────────────────────

const BRIDGE_UUID = 'bdd778cb-4551-4daa-9d8a-c03b76b74dcd'
const { rows: [bb] } = await client.query(
  `INSERT INTO exercises
     (practitioner_id, name, description, video_url, thumbnail_url, body_part,
      exercise_type, default_sets, default_reps, is_public)
   VALUES ($1,$2,$3,$4,$5,'Biodro','standard',3,12,true)
   RETURNING id, name`,
  [
    PRACTITIONER_ID,
    'Mostek z gumą (kolana na zewnątrz)',
    'Mostek biodrowy z gumą oporową powyżej kolan. Aktywne rozpychanie kolan na zewnątrz podczas unoszenia bioder wzmacnia pośladkowy średni i koryguje dynamikę koślawości kolana. Kluczowe ćwiczenie w rehabilitacji genu valgum.',
    `${PT}/${BRIDGE_UUID}/pl/video_720p.mp4`,
    `${PT}/${BRIDGE_UUID}/pl/thumbnail_800x450.jpg`,
  ]
)
console.log(`✓ Nowe ćwiczenie: ${bb.name}  [${bb.id}]`)
const BRIDGE_BAND = bb.id

// ─────────────────────────────────────────────────────────────────────────────
// Mapa ID ćwiczeń
// ─────────────────────────────────────────────────────────────────────────────

const EX = {
  // Kręgosłup lędźwiowy
  ppt:              '225317c0-f21c-4191-8f80-b05d2dafdd3d', // Posterior Pelvic Tilt (leżenie)
  hipFlexorStretch: '7f219536-afc7-4dfe-8c90-9c02eab59925', // Hip Flexor Stretch pogłębiony (3×45s)
  childPose:        'c7313ed5-64fe-433f-86f5-5e4258b86e02', // Child Pose (rozciąganie LS)
  catCow:           '415cf07c-9e70-4e52-b70c-e132a942ebf5', // Cat-Cow
  trA:              '24ed846b-8bf6-4659-a457-096ab1163093', // Aktywacja TrA
  bridge:           '7dec6b12-f0aa-4a06-b9f2-02f2ffc30aa1', // Mostek (Glute Bridge)
  deadBugPPT:       '39530497-33ef-498b-af29-f4e1fae3551f', // Dead Bug z naciskiem na PPT
  birdDog:          '20d094a9-faff-4b29-8781-183a3ef9bba9', // Bird-Dog
  plank:            '7ffbb4c9-8d2e-47f4-9f3a-25d9eb46caba', // Plank (przodem)
  hipHinge:         '85b98246-e631-4fa5-86d8-c8f6709430bf', // Hip Hinge
  rdl:              '304cc2f9-4ad6-4717-bd7b-29218fe89e2f', // RDL
  spacer:           '08bc7e59-d592-4e76-b66f-8cff17e9aedb', // Spacer
  // Kręgosłup szyjny
  chinTuckIso:      '46a657e9-2cf8-4970-b41d-e84b45e4acf9', // Chin Tuck Isometric
  trapStretch:      'e9b0a385-0cba-4966-85b4-17ed34c7bc02', // Rozciąganie górnego trapezu + levator
  ccf:              '3e379c61-b740-4187-a01b-c6301878aabe', // CCF — protokół Jull
  rowing:           'edef2329-5e1f-4ff3-ab63-fe368a28661e', // Wiosłowanie z gumą (szyja)
  suboccipital:     '4771f661-d0d1-4960-9333-43399aa803bf', // Suboccipital Release
  // Bark
  doorwayStretch:   'd869d7da-3414-4308-a0ce-5f978e3d72d3', // Doorway Stretch
  scapularSetting:  'b7285d9f-0296-4491-bee4-1df7e6e5053c', // Ustawienie łopatki (shrug + retraction)
  ytw:              '17a10b29-7931-4035-b276-4cbac7c43d51', // Y-T-W
  overheadPress:    'f1368771-0acb-4908-a2f7-f044d5a71b45', // Overhead Press
  // Kręgosłup piersiowy
  thoracicExt:      'c0959b54-38d9-4c44-8f70-df9fe36de9f1', // Mobilizacja piersiowa
  wallAngels:       '460ef288-689c-4b01-959a-c6b5f2b0be3d', // Wall Angels
  // Core/Stabilizacja
  pallofPress:      'b80c502d-3722-48f6-b7f1-ed4e6b1fe6d5', // Pallof Press z gumą
  // Biodro
  clamshellBand:    '9e3192c6-cab6-498b-a308-c4fccafbd590', // Clamshell z gumą
  wallSquatBand:    '4877c6fa-bfa4-43f6-a04d-3ac8d6ed6695', // Wall Squat z gumą (kolana na zewnątrz)
  lateralBandWalk:  '7d6e75f4-3fd5-477b-9445-53a13239766d', // Lateral Band Walk
  squat:            'c605426c-064a-47ba-a032-b197b0299c9a', // Squat (pełny)
  frogJump:         '0198dabf-d766-48c3-892a-07e55b8b8c49', // Frog Jump (Skoki żaby)
  // Kolano
  stepUp:           '3685c568-de84-40f1-8342-ed3ef9428759', // Step Up (10cm)
  // Stopa/Kostka
  tripodStanding:   '16334d52-4739-4f4e-9b00-6118f873ee46', // Korekta ustawienia stopy (Tripod)
  shortFoot:        '20b3c690-425c-4e32-a3aa-ca0c18e11bdf', // Short Foot Exercise
  calfRaiseSingle:  '86448211-58df-4770-a128-5cb330abdc18', // Wspięcie na palce — jednonóż
  singleLegBalance: '209b3999-2c7e-453c-92cb-d7b83291cda2', // Stanie na jednej nodze
  marblePickup:     '31c43957-a368-4627-b0c1-5d9365da1bf0', // Marble Pickup
  walkingEdge:      '00658d93-7967-4de6-8736-84bd76cb04c3', // Chodzenie na zewnętrznych krawędziach
  jumpsLanding:     '62b44dee-bfbf-4388-b9eb-77714757ab9a', // Skoki z kontrolowanym lądowaniem
  // Całe ciało
  farmerWalk:       '17cad867-08d8-40eb-ab44-5fa0c1a57139', // Spacer farmera (Farmer's Carry)
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────────────────

async function createProtocol({ name, description, indication, bodyPart, totalWeeks }) {
  const { rows: [p] } = await client.query(
    `INSERT INTO rehabilitation_protocols
       (practitioner_id, name, description, indication, body_part, total_weeks, is_public)
     VALUES ($1,$2,$3,$4,$5,$6,true) RETURNING id`,
    [PRACTITIONER_ID, name, description, indication, bodyPart, totalWeeks]
  )
  console.log(`\n▶ ${name}  [${p.id}]`)
  return p.id
}

async function createPhaseWithTemplate(
  protocolId, order, name, description, goals, patientIntro, rules, durationWeeks, templateName, bodyPart, exercises
) {
  // 1. Szablon
  const { rows: [tmpl] } = await client.query(
    `INSERT INTO program_templates (practitioner_id, name, body_part, is_public) VALUES ($1,$2,$3,true) RETURNING id`,
    [PRACTITIONER_ID, templateName, bodyPart]
  )
  // 2. Ćwiczenia szablonu
  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i]
    await client.query(
      `INSERT INTO program_template_items
         (template_id, exercise_id, "order", sets, reps, duration_seconds, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [tmpl.id, ex.id, i + 1, ex.sets ?? null, ex.reps ?? null, ex.duration ?? null, ex.notes ?? null]
    )
  }
  // 3. Faza
  await client.query(
    `INSERT INTO protocol_phases
       (protocol_id, "order", name, description, goals, patient_intro, rules, duration_weeks, template_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [protocolId, order, name, description,
     JSON.stringify(goals), patientIntro, JSON.stringify(rules), durationWeeks, tmpl.id]
  )
  console.log(`  ✓ F${order}: ${name}`)
}

// ═════════════════════════════════════════════════════════════════════════════
// PROTOKÓŁ 1 — Dolny Skrzyżowany Zespół
// ═════════════════════════════════════════════════════════════════════════════

const p1 = await createProtocol({
  name: 'Dolny Skrzyżowany Zespół (Hiperlordoza + Przodopochylenie Miednicy)',
  description: 'Protokół korektywny według Jandy dla dolnego skrzyżowanego zespołu. Jednoczesne rozciąganie napiętych (zginacze biodra, prostowniki LS) i wzmacnianie słabych (pośladki, TrA) grup mięśniowych z progresją do automatyzacji neutralnej miednicy.',
  indication: 'Hiperlordoza lędźwiowa, przodopochylenie miednicy, dolny skrzyżowany zespół Jandy, ból LS wynikający z nierównowagi mięśniowej',
  bodyPart: 'Kręgosłup lędźwiowy',
  totalWeeks: 12,
})

await createPhaseWithTemplate(
  p1, 1,
  'Świadomość + rozluźnienie',
  'Nauka neutralnej pozycji miednicy, rozluźnienie napiętych zginaczy biodra i prostowników LS, aktywacja TrA jako punkt startowy wzmocnienia.',
  ['Świadomość neutralnej pozycji miednicy', 'Rozluźnienie zginaczy biodra i prostowników LS', 'Aktywacja podstawowej stabilizacji'],
  'Miednica jest przechylona do przodu — jakby wyprzedzała resztę ciała. Efektem jest nadmierne wygięcie kręgosłupa lędźwiowego i przeciążenie stawów międzywyrostkowych. Pierwszym krokiem jest nauczenie się czucia neutralnej pozycji miednicy i rozluźnienie napiętych mięśni. Bez tego żadne ćwiczenia wzmacniające nie będą skuteczne.',
  ['Rozciąganie zginaczy biodra zawsze z tyłopochyleniem miednicy — bez tego tracisz połowę efektu', 'Neutralna miednica przy każdym staniu — świadoma kontrola', 'Unikaj hiperlordozy przy staniu: nie opieraj się na jednej nodze z biodrem wysuniętym w bok'],
  3, 'Dolny Skrzyżowany — F1: Świadomość + rozluźnienie', 'Kręgosłup lędźwiowy',
  [
    { id: EX.ppt, sets: 3, reps: 10, notes: 'Naprzemiennie przodopochylaj (lędźwie unoszą się) i tyłopochylaj miednicę (lędźwie dociskają do podłogi) → znajdź pozycję pośrednią — to jest neutralna. Utrzymaj neutralną 10 sekund. Powtórz 5 razy samo utrzymanie.' },
    { id: EX.hipFlexorStretch, sets: 3, duration: 45, notes: 'Wykrok — kolano tylnej nogi na podłodze. Wypchnij biodra do przodu, jednocześnie tyłopochyl miednicę ("wsunięcie ogona między nogi"). Bez tyłopochylenia tracisz połowę efektu. 2× dziennie.' },
    { id: EX.childPose, sets: 3, duration: 60, notes: 'Klęk podparty → usiądź pośladkami na piętach → wyciągnij ręce. Czoło na podłodze, oddychaj przeponowo. 2× dziennie — szczególnie rano.' },
    { id: EX.catCow, sets: 2, reps: 10, notes: 'Cat-Camel. Mobilizacja LS + propriocepcja miednicy. Synchronizuj z oddechem. Codziennie jako rozgrzewka.' },
    { id: EX.trA, sets: 3, duration: 10, notes: 'Leżenie tyłem, miednica neutralna. Aktywuj TrA — utrzymaj 10 sekund, oddychaj normalnie.' },
  ]
)

await createPhaseWithTemplate(
  p1, 2,
  'Aktywacja słabych mięśni',
  'Aktywacja pośladkowego wielkiego i średniego, wzmocnienie TrA i skośnych, integracja neutralnej miednicy z ruchem.',
  ['Aktywacja pośladkowego wielkiego i średniego', 'Wzmocnienie mięśni brzucha (TrA, skośne)', 'Integracja neutralnej miednicy z ruchem'],
  'Zginacze biodra są rozluźnione — teraz czas aktywować pośladki i mięśnie brzucha, które były "hamowane" przez napięte antagonisty. Każde ćwiczenie rozpoczynasz od znalezienia neutralnej miednicy — to klucz do skuteczności całej fazy.',
  ['Każde ćwiczenie zaczyna się od znalezienia neutralnej miednicy', 'Rozciąganie z fazy 1 zostaje jako rozgrzewka przed każdą sesją', 'Jakość ponad ilością — pośladki muszą czuć pracę'],
  5, 'Dolny Skrzyżowany — F2: Aktywacja słabych mięśni', 'Kręgosłup lędźwiowy',
  [
    { id: EX.ppt, sets: 3, reps: 10, notes: 'Rozgrzewka. Znajdź neutralną miednicę przed każdym ćwiczeniem.' },
    { id: EX.hipFlexorStretch, sets: 3, duration: 45, notes: 'Rozgrzewka — zawsze z tyłopochyleniem miednicy.' },
    { id: EX.bridge, sets: 3, reps: 12, notes: 'Miednica neutralna PRZED uniesieniem. Unieś biodra — miednica nie zapada się w lordozę na górze. Utrzymaj 2 sekundy z aktywnym pośladkiem.' },
    { id: EX.deadBugPPT, sets: 3, reps: 8, notes: 'Lędźwie przylegają do podłogi przez cały czas — jeśli się odrywają, miednica wychodzi z neutralnej. 8 powtórzeń na stronę.' },
    { id: EX.clamshellBand, sets: 3, reps: 15, notes: 'Aktywacja pośladkowego średniego.' },
    { id: EX.birdDog, sets: 3, reps: 8, notes: 'Miednica neutralna przed ruchem. Utrzymaj 8 sekund na każdą stronę. Obserwuj czy miednica obraca się przy wysuwie nogi — jeśli tak, zmniejsz zakres.' },
    { id: EX.plank, sets: 3, duration: 25, notes: 'Miednica neutralna — nie pozwól lędźwiom opadać w przeprost (hiperlordoza w planku). 20–30 sekund.' },
  ]
)

await createPhaseWithTemplate(
  p1, 3,
  'Integracja funkcjonalna',
  'Transfer korekcji na codzienne wzorce ruchowe — wstawanie, schylanie, dźwiganie. Automatyzacja neutralnej miednicy.',
  ['Neutralna miednica jako nawyk dzienny', 'Wzmocnienie funkcjonalne w korekcji', 'Profilaktyka bólu LS wynikającego z hiperlordozy'],
  'Miednica zaczyna trzymać neutralną pozycję automatycznie. Teraz przenosisz tę kontrolę na codzienne ruchy — chodzenie, wstawanie, dźwiganie. Cel to trwała zmiana wzorca ruchowego.',
  ['Siedzenie: krzesło z oparciem lędźwiowym, kolana na poziomie bioder', 'Stanie: ciężar równomierny, nie opieraj się na jednej nodze', 'Dźwiganie: hip hinge zawsze — miednica neutralna', 'Sen: na boku z poduszką między kolanami lub na plecach z poduszką pod kolanami'],
  4, 'Dolny Skrzyżowany — F3: Integracja funkcjonalna', 'Kręgosłup lędźwiowy',
  [
    { id: EX.squat, sets: 3, reps: 12, notes: 'Miednica neutralna przed zejściem w dół. Nie wyginaj lędźwi w lordozę w dolnej pozycji. Nawyk przy wstawaniu z krzesła i dźwiganiu.' },
    { id: EX.hipHinge, sets: 3, reps: 12, notes: 'Bezpieczne schylanie — miednica trzyma neutralną. Kij wzdłuż kręgosłupa jako kontrola. Nawyk przy każdym schylaniu.' },
    { id: EX.rdl, sets: 3, reps: 10, notes: 'Wzmocnienie pośladków i kulszowo-goleniowych — tylna taśma stabilizuje miednicę. 3× w tygodniu.' },
    { id: EX.pallofPress, sets: 3, reps: 10, notes: 'Stabilizacja rotacyjna tułowia z neutralną miednicą. 10 powtórzeń na każdą stronę. 3× w tygodniu.' },
    { id: EX.spacer, sets: 1, duration: 1200, notes: 'Spacer 20 minut ze świadomą kontrolą miednicy. Co kilka minut "resetuj" — sprawdź czy miednica nie wypadła z neutralnej. Codziennie.' },
  ]
)

// ═════════════════════════════════════════════════════════════════════════════
// PROTOKÓŁ 2 — Górny Skrzyżowany Zespół
// ═════════════════════════════════════════════════════════════════════════════

const p2 = await createProtocol({
  name: 'Górny Skrzyżowany Zespół (Kifoza + Głowa do Przodu)',
  description: 'Protokół korektywny dla górnego skrzyżowanego zespołu Jandy. Rozluźnienie napiętych mięśni piersiowych i górnego trapezu + aktywacja głębokich zginaczy szyi (CCF), dolnego trapezu i serratus anterior z progresją do automatyzacji chin tuck i retrakcji łopatki.',
  indication: 'Kifoza piersiowa, forward head posture (głowa do przodu), górny skrzyżowany zespół Jandy, ból karku i barków wynikający z postawy, zaokrąglone barki',
  bodyPart: 'Kręgosłup piersiowy',
  totalWeeks: 12,
})

await createPhaseWithTemplate(
  p2, 1,
  'Świadomość + rozluźnienie',
  'Rozluźnienie mięśni piersiowych i górnego trapezu, mobilizacja odcinka piersiowego, nauka chin tuck jako fundamentu korekcji.',
  ['Rozluźnienie mięśni piersiowych i górnego trapezu', 'Mobilizacja odcinka piersiowego', 'Nauka chin tuck jako punktu startowego'],
  'Głowa do przodu, zaokrąglone barki, garb na plecach — to efekt wieloletnich nawyków siedzenia przy komputerze. Mięśnie przednie klatki są napięte i przykurczone, mięśnie tylne słabe i rozciągnięte. Pierwszym krokiem jest rozluźnienie napiętych mięśni i nauka prawidłowej pozycji głowy. Każdy centymetr głowy do przodu to dodatkowe kilogramy obciążenia na szyję.',
  ['Monitor na wysokości oczu — zmień ustawienie natychmiast', 'Poduszka do spania: neutralna szyja — nie za wysoka', 'Chin tuck to nawyk — co godzinę przy pracy siedzącej'],
  3, 'Górny Skrzyżowany — F1: Świadomość + rozluźnienie', 'Kręgosłup piersiowy',
  [
    { id: EX.chinTuckIso, sets: 3, reps: 10, notes: 'Chin tuck — cofnij głowę (podwójny podbródek). Utrzymaj 5 sekund. Fundament całego protokołu. Rób co godzinę przy pracy siedzącej.' },
    { id: EX.doorwayStretch, sets: 3, duration: 30, notes: 'Stań w drzwiach, przedramiona oparte o framugę (łokcie 90°). Wejdź krokiem do przodu — poczujesz rozciąganie przez klatkę. 3× dziennie.' },
    { id: EX.trapStretch, sets: 3, duration: 30, notes: 'Rozciąganie górnego trapezu i skalenych. 30 sekund na każdą stronę. 2× dziennie.' },
    { id: EX.thoracicExt, sets: 2, reps: 10, notes: 'Mobilizacja piersiowa na krześle lub na zrolowanym ręczniku. Codziennie.' },
    { id: EX.suboccipital, sets: 1, duration: 180, notes: '2–3 minuty autorelaksacji mięśni podpotylicznych. Codziennie wieczorem.' },
  ]
)

await createPhaseWithTemplate(
  p2, 2,
  'Aktywacja słabych mięśni',
  'Aktywacja DNF protokołem Jull CCF, wzmocnienie dolnego trapezu i serratus anterior, stabilizacja łopatki w korekcji.',
  ['Aktywacja DNF — protokół Jull CCF', 'Wzmocnienie dolnego trapezu i serratus anterior', 'Stabilizacja łopatki w korekcji'],
  'Klatka jest otwarta, szyja ruchoma. Teraz czas aktywować mięśnie które utrzymają tę korekcję — dolny trapez, serratus anterior i głębokie zginacze szyi. Bez ich siły postura wróci do starego wzorca w ciągu minut.',
  ['Każde ćwiczenie z chin tuckiem jako punktem startowym', 'Rozciąganie piersiowych zostaje przed każdą sesją', 'Retrakcja łopatki — łopatki w DÓŁ i do środka, nie tylko do środka'],
  5, 'Górny Skrzyżowany — F2: Aktywacja słabych mięśni', 'Kręgosłup piersiowy',
  [
    { id: EX.doorwayStretch, sets: 3, duration: 30, notes: 'Rozgrzewka przed każdą sesją.' },
    { id: EX.ccf, sets: 3, duration: 10, notes: 'Protokół Jull — aktywacja głębokich zginaczy szyi. Każdy poziom utrzymaj 10 sekund, 10 powtórzeń. Nie kompensuj SCM. Codziennie.' },
    { id: EX.scapularSetting, sets: 3, reps: 10, notes: 'Retrakcja łopatki — ściśnij łopatki w DÓŁ i do środka (nie tylko do środka!). Utrzymaj 5 sekund. Codziennie.' },
    { id: EX.ytw, sets: 3, reps: 10, notes: 'Y-T-W w leżeniu przodem. Kompleksowa aktywacja stabilizatorów łopatki. Codziennie.' },
    { id: EX.wallAngels, sets: 3, reps: 10, notes: 'Utrzymaj kontakt ze ścianą — lędźwie, plecy, głowa przez cały ruch. Codziennie.' },
    { id: EX.rowing, sets: 3, reps: 12, notes: 'Wiosłowanie z gumą — wzmocnienie dolnego trapezu i rhomboidów. 4× w tygodniu.' },
  ]
)

await createPhaseWithTemplate(
  p2, 3,
  'Integracja funkcjonalna',
  'Chin tuck i retrakcja łopatki jako nawyk dzienny, wzmocnienie w pełnych zakresach, profilaktyka nawrotu.',
  ['Chin tuck i retrakcja łopatki jako nawyk dzienny', 'Wzmocnienie w pełnych zakresach', 'Profilaktyka nawrotu'],
  'Mięśnie pracują — czas przenieść korekcję na codzienność. Najważniejsze jest żeby chin tuck i retrakcja łopatki stały się domyślną pozycją siedzenia i stania — nie czymś co robisz tylko podczas ćwiczeń.',
  ['Monitor na wysokości oczu — zawsze', 'Chin tuck co godzinę przy komputerze', 'Telefon: podnoś do oczu, nie opuszczaj głowy', 'Przerwa od siedzenia co 30–45 minut — wstań i zrób chin tuck + mobilizację piersiową'],
  4, 'Górny Skrzyżowany — F3: Integracja funkcjonalna', 'Kręgosłup piersiowy',
  [
    { id: EX.overheadPress, sets: 3, reps: 10, notes: 'Z chin tuckiem jako punktem startowym — neutralna szyja przez cały ruch. 3× w tygodniu.' },
    { id: EX.farmerWalk, sets: 3, reps: 30, notes: '30 metrów z chin tuckiem + retrakcją łopatki + neutralną szyją. Dynamiczna stabilizacja postawy pod obciążeniem. 3× w tygodniu.' },
    { id: EX.plank, sets: 3, duration: 30, notes: 'Z chin tuckiem — neutralna szyja, nie wypychaj głowy do przodu. 30 sekund. Codziennie.' },
    { id: EX.ccf, sets: 2, reps: 10, notes: 'Utrzymanie — 2× w tygodniu profilaktycznie. 10 × 10 sekund.' },
  ]
)

// ═════════════════════════════════════════════════════════════════════════════
// PROTOKÓŁ 3 — Koślawe Kolana Dorosły
// ═════════════════════════════════════════════════════════════════════════════

const p3 = await createProtocol({
  name: 'Koślawe Kolana — Dorosły (Genu Valgum)',
  description: 'Rehabilitacja biomechaniczna koślawości kolan u dorosłych. Wzmocnienie pośladkowego średniego, mięśni intrinsic stopy i propriocepcja — korekcja dynamiki kolana. U dorosłego korekcja strukturalna nie jest możliwa bez operacji — celem jest poprawa biomechaniki i redukcja objawów.',
  indication: 'Genu valgum u dorosłych, koślawość kolan, ból przyśrodkowy kolana przy aktywności, nierównowaga mięśniowa biodra i stopy',
  bodyPart: 'Kolano',
  totalWeeks: 12,
})

await createPhaseWithTemplate(
  p3, 1,
  'Świadomość + aktywacja',
  'Edukacja o ustawieniu kolana, aktywacja pośladkowego średniego i mięśni intrinsic stopy jako podstawa korekcji dynamicznej.',
  ['Świadomość pozycji kolana w przestrzeni', 'Aktywacja pośladkowego średniego', 'Aktywacja mięśni wewnętrznych stopy'],
  'Kolana zapadające się do środka przy staniu, chodzeniu i przysiadzie to efekt słabych pośladków i odwodzicieli biodra oraz słabych mięśni wewnętrznych stopy. Leczenie nie polega na "prostowaniu kolan" — to niemożliwe bez operacji. Polega na wzmocnieniu mięśni które kontrolują ustawienie kolana podczas ruchu. Efektem będzie mniejszy ból i lepsza biomechanika.',
  [],
  3, 'Koślawe Kolana Dorosły — F1: Świadomość + aktywacja', 'Kolano',
  [
    { id: EX.tripodStanding, sets: 3, duration: 30, notes: 'TRIPOD + KNEE ALIGNMENT: Aktywuj short foot (łuk stopy) + pośladek → kolano delikatnie na zewnątrz nad środkiem stopy. Utrzymaj 30s. Nawyk dzienny — rób przy staniu w kolejce, myciu zębów.' },
    { id: EX.clamshellBand, sets: 3, reps: 15, notes: 'Aktywacja pośladkowego średniego — kontrola koślawości.' },
    { id: EX.shortFoot, sets: 3, reps: 10, notes: 'Aktywacja mięśni wewnętrznych stopy. Pronacja stopy napędza koślawość kolana — short foot ją hamuje.' },
    { id: BRIDGE_BAND, sets: 3, reps: 12, notes: 'Guma oporna powyżej kolan. Na górze aktywnie rozpychaj kolana na zewnątrz przeciwko gumie — aktywacja pośladkowego średniego.' },
  ]
)

await createPhaseWithTemplate(
  p3, 2,
  'Wzmocnienie funkcjonalne',
  'Wzmocnienie pośladków i odwodzicieli w wzorcach funkcjonalnych, kontrola osi kolana podczas ruchu, propriocepcja.',
  ['Kontrola koślawości podczas ruchu', 'Wzmocnienie pośladków i odwodzicieli', 'Propriocepcja kolana i stopy'],
  'Pośladki i stopa zaczynają pracować. Teraz przenosimy tę aktywację na wzorce funkcjonalne — przysiad, wchodzenie po schodach, balans. Kluczowa zasada: kolano nad środkiem stopy w każdym ruchu.',
  ['Kolano nad środkiem stopy w każdym ruchu'],
  5, 'Koślawe Kolana Dorosły — F2: Wzmocnienie funkcjonalne', 'Kolano',
  [
    { id: EX.wallSquatBand, sets: 3, reps: 12, notes: 'MINI SQUAT z gumą: Schodzisz w dół — aktywnie rozpychasz kolana na zewnątrz przeciwko gumie. Kolano nad środkiem stopy przez cały ruch.' },
    { id: EX.stepUp, sets: 3, reps: 12, notes: 'Wejście na stopień z kontrolą kolana — obserwuj w lustrze czy kolano nie zapada się do środka. 12 powtórzeń na każdą nogę.' },
    { id: EX.lateralBandWalk, sets: 3, reps: 10, notes: 'Guma oporna powyżej kolan, mini squat. Kroki boczne — stopy nie spotykają się. 10 kroków na każdą stronę.' },
    { id: EX.calfRaiseSingle, sets: 3, reps: 12, notes: 'Aktywuj short foot (łuk stopy) → wejdź na palce jednej nogi. Korekcja pronacji napędzającej koślawość.' },
    { id: EX.singleLegBalance, sets: 3, duration: 30, notes: 'Aktywuj short foot + kolano nad środkiem stopy. Progresja: zamknij oczy, stój na poduszce. 30 sekund na każdą nogę.' },
  ]
)

await createPhaseWithTemplate(
  p3, 3,
  'Aktywność + profilaktyka',
  'Program utrzymania — automatyzacja prawidłowej biomechaniki kolana podczas codziennych aktywności i sportu.',
  ['Neutralna oś kolana jako nawyk dzienny', 'Utrzymanie siły pośladków i stopy', 'Profilaktyka nawrotu'],
  'Kolano zaczyna trzymać prawidłową pozycję automatycznie podczas ruchu. To efekt miesięcy pracy. Teraz priorytetem jest utrzymanie nawyku — ćwiczenia 3× w tygodniu i świadoma kontrola przy każdym przysiadzie, wchodzeniu po schodach i bieganiu.',
  ['Korekta kolana przy staniu — nawyk', 'Short foot przy chodzeniu — nawyk'],
  4, 'Koślawe Kolana Dorosły — F3: Aktywność + profilaktyka', 'Kolano',
  [
    { id: EX.wallSquatBand, sets: 3, reps: 12, notes: 'Squat z gumą — kolana nad środkiem stopy. 3× w tygodniu.' },
    { id: EX.lateralBandWalk, sets: 3, reps: 10, notes: '10 kroków na każdą stronę. 3× w tygodniu.' },
    { id: EX.calfRaiseSingle, sets: 3, reps: 12, notes: 'Short foot aktywowany. 3× w tygodniu.' },
    { id: EX.singleLegBalance, sets: 3, duration: 30, notes: 'Neutralne kolano. 3× w tygodniu profilaktycznie.' },
  ]
)

// ═════════════════════════════════════════════════════════════════════════════
// PROTOKÓŁ 4 — Koślawe Kolana Dziecko (7–14 lat)
// ═════════════════════════════════════════════════════════════════════════════

const p4 = await createProtocol({
  name: 'Koślawe Kolana — Dziecko (7–14 lat)',
  description: 'Program rehabilitacji koślawości kolan u dzieci przez zabawę. Ćwiczenia dostosowane wiekowo — gamifikacja, sesje max 15 minut, rodzic uczestniczy. Najskuteczniejszy między 7 a 12 rokiem życia.',
  indication: 'Genu valgum u dzieci 7–14 lat, koślawość kolan utrzymująca się po 7 roku życia, asymetria koślawości, brak samoistnej korekcji',
  bodyPart: 'Kolano',
  totalWeeks: 12,
})

await createPhaseWithTemplate(
  p4, 1,
  'Świadomość + zabawa',
  'Nauka prawidłowej pozycji kolan przez zabawę, aktywacja pośladków i mięśni stopy, budowanie nawyku codziennych ćwiczeń.',
  ['Świadomość pozycji kolan', 'Aktywacja pośladków i mięśni stopy', 'Budowanie nawyku codziennych ćwiczeń'],
  'Dziecko nie rozumie "koślawości kolana" — rozumie zabawę. Ćwiczenia muszą być grą. Cel to nauczenie dziecka czucia prawidłowej pozycji kolan i aktywacja słabych mięśni przez zabawę. Ćwicz razem z dzieckiem — 15 minut dziennie wystarczy.',
  ['Max 15 minut dziennie', 'Naklejki i punkty za regularność — nagradzaj systematyczność', 'Boso na trawie i piasku — naturalna korekcja', 'Obuwie: elastyczne, nie sztywne "korekcyjne" bez wskazania ortopedy'],
  3, 'Koślawe Kolana Dziecko — F1: Świadomość + zabawa', 'Kolano',
  [
    { id: EX.tripodStanding, sets: 5, duration: 10, notes: 'Dla dziecka: "Zrób kolana jak robot — skieruj kolana nad palce stóp." Boso. Utrzymaj 10 sekund. Rób przy każdej okazji przez cały dzień.' },
    { id: EX.frogJump, sets: 3, reps: 10, notes: 'Skakanie jak żaba z kolanami NA ZEWNĄTRZ — zarówno przy odskoku jak i lądowaniu. Gamifikacja: "Ile razy z rzędu uda się wylądować jak żaba?"' },
    { id: EX.walkingEdge, sets: 3, reps: 10, notes: '10 metrów chodu na zewnętrznych krawędziach stóp. Aktywacja supinatorów — korekcja pronacji napędzającej koślawość.' },
    { id: EX.marblePickup, sets: 2, duration: 120, notes: 'Zbieranie kulek/chusteczek palcami stopy. Aktywacja mięśni wewnętrznych — korekcja płaskostopia napędzającego koślawość.' },
    { id: EX.bridge, sets: 3, reps: 10, notes: 'Dla dzieci: "Zrób tęczę z biodrami!" Utrzymaj 3 sekundy na górze. Aktywacja pośladków przez zabawę.' },
  ]
)

await createPhaseWithTemplate(
  p4, 2,
  'Wzmocnienie + propriocepcja',
  'Wzmocnienie pośladków w pozycji stojącej, propriocepcja z neutralnym kolanem, aktywacja łuku stopy podczas ruchu.',
  ['Wzmocnienie pośladków w pozycji stojącej', 'Propriocepcja i równowaga z neutralnym kolanem', 'Aktywacja łuku stopy podczas ruchu'],
  'Dziecko czuje prawidłową pozycję kolan. Teraz dodajemy trudniejsze ćwiczenia stojące i propriocepcję. Ćwiczenia są trudniejsze koordynacyjnie — więcej zabawy, więcej wyzwań.',
  [],
  5, 'Koślawe Kolana Dziecko — F2: Wzmocnienie + propriocepcja', 'Kolano',
  [
    { id: EX.wallSquatBand, sets: 3, reps: 10, notes: 'Dla dziecka: "Robot squat — kolana nad palcami!" Guma oporna powyżej kolan.' },
    { id: EX.singleLegBalance, sets: 3, duration: 20, notes: 'Dla dzieci: "Stań jak flaming!" Kolano nad środkiem stopy. 15–20 sekund. Progresja: zamknij oczy, stój na poduszce.' },
    { id: EX.lateralBandWalk, sets: 3, reps: 10, notes: 'Dla dzieci: "Chódź jak krab!" Guma oporna, kroki boczne. Stopy nie spotykają się. 10 kroków na każdą stronę.' },
    { id: EX.calfRaiseSingle, sets: 3, reps: 10, notes: 'Wzmocnienie łydki i stopy. Jednonóż.' },
    { id: EX.jumpsLanding, sets: 3, reps: 10, notes: 'Skoki obunóż — lądowanie miękkie z kolanami nad palcami. Obserwuj kolana przy lądowaniu — nie mogą zapadać się do środka.' },
  ]
)

await createPhaseWithTemplate(
  p4, 3,
  'Aktywność + nawyki długoterminowe',
  'Utrzymanie nawyków ruchowych, aktywny styl życia jako najlepsza rehabilitacja w tym wieku.',
  ['Automatyczna kontrola kolan podczas aktywności', 'Aktywny styl życia', 'Utrzymanie nawyków ruchowych'],
  'Kolana zaczynają ustawiać się prawidłowo podczas aktywności. Priorytetem jest aktywny styl życia i utrzymanie nawyków. Sport, zabawa, bieganie to najlepsza rehabilitacja w tym wieku.',
  ['Boso na trawie i piasku jak najczęściej', 'Aktywne sporty — bieganie, pływanie, rower', 'Korekta kolan przy siedzeniu — nie "składaj" nóg do środka'],
  4, 'Koślawe Kolana Dziecko — F3: Aktywność + nawyki', 'Kolano',
  [
    { id: EX.frogJump, sets: 3, reps: 10, notes: 'Żabi skok — lądowanie z kolanami na zewnątrz.' },
    { id: EX.wallSquatBand, sets: 3, reps: 10, notes: 'Robot squat z gumą.' },
    { id: EX.singleLegBalance, sets: 3, duration: 20, notes: 'Flaming — kolano nad środkiem stopy.' },
    { id: EX.lateralBandWalk, sets: 3, reps: 10, notes: 'Krab — 10 kroków na stronę.' },
    { id: EX.jumpsLanding, sets: 3, reps: 10, notes: 'Lądowanie ze skoków z kontrolą — kolana nad palcami.' },
  ]
)

// ─────────────────────────────────────────────────────────────────────────────

await client.end()
console.log('\n✅ Done — 1 ćwiczenie + 4 protokoły dodane.')
