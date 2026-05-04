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

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function p(str) {
  // parse "3×15" → sets:3, reps:15 | "3×30s" → sets:3, dur:30 | "5×45s" → sets:5, dur:45
  if (!str) return {}
  const m = str.match(/^(\d+)[x×](\d+)/)
  if (!m) return {}
  const sets = parseInt(m[1])
  const val = parseInt(m[2])
  if (str.includes("s") && !str.match(/\d+s\/str/) && !str.match(/\d+ s/) && str.match(/×(\d+s)/)) {
    return { default_sets: sets, default_duration_seconds: val }
  }
  if (str.match(/×(\d+s)/) || str.match(/×\d+s/)) {
    return { default_sets: sets, default_duration_seconds: val }
  }
  return { default_sets: sets, default_reps: val }
}

// ─── V2 Exercises ──────────────────────────────────────────────────────────────

const EXERCISES_V2 = [
  // A1: Stożek rotatorów — progresja
  { name: "ER izometryczna przy ścianie (0°)", body_part: "Bark", category: "Stożek rotatorów", description: "Izometryczna zewnętrzna rotacja przy ścianie w pozycji zerowego odwiedzenia. Aktywuje m. podgrzebieniowy i obły mniejszy bez obciążania mechanicznego stożka.", default_sets: 3, default_reps: 10, default_duration_seconds: 10, default_rest_seconds: 30 },
  { name: "ER izometryczna (90° odwiedzenia)", body_part: "Bark", category: "Stożek rotatorów", description: "Izometryczna zewnętrzna rotacja przy ścianie z ramieniem w 90° odwiedzenia. Wyższe napięcie w środkowych włóknach stożka — stosuj po fazie 0°.", default_sets: 3, default_reps: 10, default_duration_seconds: 10, default_rest_seconds: 30 },
  { name: "IR izometryczna przy ścianie", body_part: "Bark", category: "Stożek rotatorów", description: "Izometryczna wewnętrzna rotacja przy ścianie. Aktywacja m. podłopatkowego i obłego większego bez zakresu ruchu. Faza izometryczna — 2-4 tygodnie.", default_sets: 3, default_reps: 10, default_duration_seconds: 10, default_rest_seconds: 30 },
  { name: "ER ekscentryczna z gumą (slow lowering)", body_part: "Bark", category: "Stożek rotatorów", description: "Ekscentryczna zewnętrzna rotacja z taśmą oporową — faza obniżania 3 sekundy. Przebudowa kolagenu w ścięgnie stożka. Stosuj od tygodnia 4-6.", default_sets: 3, default_reps: 12, default_duration_seconds: null, default_rest_seconds: 45 },
  { name: "Side-lying ER z obciążeniem (progresja)", body_part: "Bark", category: "Stożek rotatorów", description: "Zewnętrzna rotacja w leżeniu bokiem z lekkim obciążeniem (hantla). Progresja od ER z gumą — izolowana aktywacja m. podgrzebieniowego.", default_sets: 3, default_reps: 12, default_duration_seconds: null, default_rest_seconds: 45 },
  { name: "ER w 90° odwiedzenia (L-position) z gumą", body_part: "Bark", category: "Stożek rotatorów", description: "Zewnętrzna rotacja w pozycji L (ramię 90° odwiedzenia, łokieć 90° zgięcia) z taśmą. Sport-specific — ważne przy aktywności nad głową.", default_sets: 3, default_reps: 10, default_duration_seconds: null, default_rest_seconds: 45 },
  { name: "Diagonal PNF D1 z gumą", body_part: "Bark", category: "Stożek rotatorów", description: "Wzorzec PNF D1 z taśmą oporową — łączy zginanie, odwiedzenie i rotację zewnętrzną. Funkcjonalne ćwiczenie siły stożka w pełnym zakresie.", default_sets: 3, default_reps: 10, default_duration_seconds: null, default_rest_seconds: 45 },
  { name: "Diagonal PNF D2 z gumą", body_part: "Bark", category: "Stożek rotatorów", description: "Wzorzec PNF D2 z taśmą oporową — prostowanie, odwiedzenie i rotacja zewnętrzna. Ważny w sporcie i codziennej aktywności funkcjonalnej.", default_sets: 3, default_reps: 10, default_duration_seconds: null, default_rest_seconds: 45 },
  { name: "Full Can (pełna puszka — 30° elewacja)", body_part: "Bark", category: "Stożek rotatorów", description: "Unoszenie ramienia w płaszczyźnie łopatki (30° rotacji zewnętrznej) — pozycja 'pełnej puszki'. Minimalny ucisk podbarkowy, maksymalna aktywacja nadgrzebieniowego.", default_sets: 3, default_reps: 12, default_duration_seconds: null, default_rest_seconds: 45 },
  { name: "Prone Row z ER (bent-over)", body_part: "Bark", category: "Stożek rotatorów", description: "Wiosłowanie w leżeniu przodem z rotacją zewnętrzną na końcu ruchu. Łączy aktywację środkowego/dolnego trapeza z zewnętrznymi rotatorami — zaawansowana stabilizacja łopatki.", default_sets: 3, default_reps: 12, default_duration_seconds: null, default_rest_seconds: 45 },

  // A2: Ostroga piętowa / Plantar Fasciitis
  { name: "Plantar Fascia Stretch — palce cofnięte (stojąc)", body_part: "Stopa/Kostka", category: "Ostroga piętowa", description: "Rozciąganie rozcięgna podeszwowego z palcami cofniętymi — najważniejsze ćwiczenie w PF. Wykonuj rano przed pierwszym krokiem. 3×30s każda stopa.", default_sets: 3, default_duration_seconds: 30, default_rest_seconds: 20 },
  { name: "Plantar Fascia Stretch przez butelkę z lodem", body_part: "Stopa/Kostka", category: "Ostroga piętowa", description: "Toczenie stopy po zamrożonej butelce — połączenie rozciągania rozcięgna z kriostymulacją. Wykonuj po aktywności 5 minut każda stopa.", default_sets: 1, default_duration_seconds: 300, default_rest_seconds: 0 },
  { name: "Toe Curl — zwijanie palców ręcznikiem", body_part: "Stopa/Kostka", category: "Ostroga piętowa", description: "Zwijanie ręcznika palcami stóp. Wzmacnia mięśnie drobne podeszwy, poprawia propriocepcję łuku. 3×20 sekund każda stopa, codziennie.", default_sets: 3, default_duration_seconds: 20, default_rest_seconds: 20 },
  { name: "Short Foot Exercise (skrócenie stopy)", body_part: "Stopa/Kostka", category: "Ostroga piętowa", description: "Aktywne skracanie stopy — unoszenie łuku bez zginania palców. Najważniejsze ćwiczenie proprioceptywne dla mięśni wewnętrznych stopy. 3×12, 5s hold.", default_sets: 3, default_reps: 12, default_duration_seconds: 5, default_rest_seconds: 30 },
  { name: "Eccentric Calf Lower na schodku", body_part: "Stopa/Kostka", category: "Ostroga piętowa", description: "Ekscentryczne opuszczanie łydki ze schodka — protokół Alfredssona dla PF i tendinopatii Achillesa. 3×15, 3 sekundy opuszczanie, 2 razy dziennie.", default_sets: 3, default_reps: 15, default_rest_seconds: 45 },
  { name: "Single-leg Calf Raise progresja", body_part: "Stopa/Kostka", category: "Ostroga piętowa", description: "Jednostronne wspięcia na palcach — progresja po opanowaniu ekscentrycznej łydki. Wzmacnia łydkę i odciąża rozcięgno. 3×15/stronę, co 2 dni.", default_sets: 3, default_reps: 15, default_rest_seconds: 45 },
  { name: "Toe Splay (rozstawianie palców)", body_part: "Stopa/Kostka", category: "Ostroga piętowa", description: "Aktywne rozstawianie palców stóp — aktywacja mięśni drobnych stopy i poprawia kontrolę neuromięśniową. 3×10, 3s hold, codziennie.", default_sets: 3, default_reps: 10, default_duration_seconds: 3, default_rest_seconds: 20 },
  { name: "Rolling piłką golfową (masaż rozcięgna)", body_part: "Stopa/Kostka", category: "Ostroga piętowa", description: "Masaż rozcięgna piłką golfową — rozluźnia napięte struktury podeszwy. Rano i wieczór 3-5 minut, szczególnie przed pierwszym krokiem.", default_sets: 1, default_duration_seconds: 300, default_rest_seconds: 0 },
  { name: "Marble Pickup (palce podnoszą kulki)", body_part: "Stopa/Kostka", category: "Ostroga piętowa", description: "Podnoszenie kulek/kamyków palcami stóp — zaawansowane ćwiczenie mięśni drobnych stopy. 3×10/stronę, codziennie.", default_sets: 3, default_reps: 10, default_rest_seconds: 20 },
  { name: "Intrinsic Foot Strengthening (theraband palce)", body_part: "Stopa/Kostka", category: "Ostroga piętowa", description: "Opór taśmą podczas zginania palców — wzmacnianie mięśni wewnętrznych stopy. 3×15, co 2 dni.", default_sets: 3, default_reps: 15, default_rest_seconds: 30 },

  // A3: Hiperlordoza
  { name: "Posterior Pelvic Tilt (PPT) — nauka", body_part: "Kręgosłup lędźwiowy", category: "Hiperlordoza", description: "Spłaszczanie lordozy lędźwiowej przez tylne pochylenie miednicy w leżeniu. Kluczowe ćwiczenie świadomości miednicy. 3×15, 5s hold, codziennie.", default_sets: 3, default_reps: 15, default_duration_seconds: 5, default_rest_seconds: 20 },
  { name: "Mostek z tylnym pochyleniem miednicy", body_part: "Kręgosłup lędźwiowy", category: "Hiperlordoza", description: "Glute Bridge z aktywnym PPT — buduje pośladki przy zachowaniu neutralnej miednicy. Progresja do Mostek jednostronnego. 3×15, 3s hold.", default_sets: 3, default_reps: 15, default_duration_seconds: 3, default_rest_seconds: 30 },
  { name: "Hip Flexor Stretch pogłębiony (klęk)", body_part: "Kręgosłup lędźwiowy", category: "Hiperlordoza", description: "Głęboki stretch zginacza biodra w wykroku klęcznym. Kluczowy w korekcji hiperlordozy — skrócony psoas/biodro to główna przyczyna. 3×45s/stronę, codziennie.", default_sets: 3, default_duration_seconds: 45, default_rest_seconds: 20 },
  { name: "Child Pose (rozciąganie LS)", body_part: "Kręgosłup lędźwiowy", category: "Hiperlordoza", description: "Pozycja dziecka — rozciąganie całego kręgosłupa LS i prostowników grzbietu. Relaksacja nadmiernie aktywnych mięśni prostowników. 3×45s, codziennie.", default_sets: 3, default_duration_seconds: 45, default_rest_seconds: 20 },
  { name: "Dead Bug z naciskiem na PPT", body_part: "Kręgosłup lędźwiowy", category: "Hiperlordoza", description: "Dead Bug z aktywnym tylnym pochyleniem miednicy przez cały czas. Uczy utrzymania neutralnej miednicy podczas ruchów kończyn. 3×8/stronę.", default_sets: 3, default_reps: 8, default_rest_seconds: 45 },
  { name: "Hollow Body Hold", body_part: "Core/Stabilizacja", category: "Core", description: "Pozycja drążonego ciała — totalna aktywacja mięśni brzucha przy spłaszczonej LS. Zaawansowane ćwiczenie core. 3×20s, codziennie.", default_sets: 3, default_duration_seconds: 20, default_rest_seconds: 30 },
  { name: "McGill Curl-up (flexja bez zginania LS)", body_part: "Kręgosłup lędźwiowy", category: "Hiperlordoza", description: "Unoszenie głowy i ramion bez zginania kręgosłupa LS — ćwiczenie McGilla aktywujące brzuch bez kompresji krążków. 3×10, 10s hold.", default_sets: 3, default_reps: 10, default_duration_seconds: 10, default_rest_seconds: 30 },
  { name: "Wall Squat z PPT (przy ścianie)", body_part: "Kręgosłup lędźwiowy", category: "Hiperlordoza", description: "Przysiad przy ścianie z aktywnym PPT — utrwala neutralną miednicę w pozycji funkcjonalnej. 3×12, co 2 dni.", default_sets: 3, default_reps: 12, default_rest_seconds: 45 },
  { name: "Plank z neutralizacją miednicy", body_part: "Core/Stabilizacja", category: "Hiperlordoza", description: "Deska z aktywnym PPT i kontrolą miednicy. Eliminuje hiperlordozę w plank, zwiększa efektywność ćwiczenia. 3×25s, codziennie.", default_sets: 3, default_duration_seconds: 25, default_rest_seconds: 30 },
  { name: "Standing Hip Flexor Stretch (aktywny)", body_part: "Kręgosłup lędźwiowy", category: "Hiperlordoza", description: "Aktywne rozciąganie zginacza biodra w staniu z PPT — funkcjonalna wersja stretchu psoas. 3×30s/stronę, codziennie.", default_sets: 3, default_duration_seconds: 30, default_rest_seconds: 20 },
  { name: "Psoas Release na wałku (rolowanie)", body_part: "Kręgosłup lędźwiowy", category: "Hiperlordoza", description: "Pasywne rolowanie na foam rollerze w okolicy psoas/biodra. Zmniejsza napięcie mięśniowo-powięziowe przed stretchingiem. 60s/stronę, codziennie.", default_sets: 1, default_duration_seconds: 60, default_rest_seconds: 0 },

  // A4: Skolioza — Schroth-inspired
  { name: "Muscular Cylinder (wydłużanie osiowe)", body_part: "Kręgosłup", category: "Skolioza", description: "Aktywne wydłużanie osiowe kręgosłupa z aktywacją mięśni tułowia — podstawa metody Schroth. 3×5 oddechów, 10s hold, codziennie.", default_sets: 3, default_reps: 5, default_duration_seconds: 10, default_rest_seconds: 30 },
  { name: "Passive Correction w leżeniu na boku", body_part: "Kręgosłup", category: "Skolioza", description: "Pasywna korekcja krzywizny w leżeniu na boku (strona wypukła). Grawitacja pomaga w korekcji bocznej — 5-10 minut, codziennie.", default_sets: 1, default_duration_seconds: 600, default_rest_seconds: 0 },
  { name: "Rotational Angular Breathing (RAB)", body_part: "Kręgosłup", category: "Skolioza", description: "Oddychanie korygujące ze skrętem przeciwrotacyjnym (Schroth). Uczy trójwymiarowej korekcji podczas oddychania. Wymaga demonstracji osobistej przed zadaniem domowym.", default_sets: 3, default_reps: 5, default_rest_seconds: 30 },
  { name: "Asymetryczne rozciąganie (strona wklęsła)", body_part: "Kręgosłup", category: "Skolioza", description: "Rozciąganie po stronie wklęsłej krzywizny — otwiera przestrzeń żebrową i rozluźnia przykurczone mięśnie. Dostosuj do strony krzywizny. 3×30s.", default_sets: 3, default_duration_seconds: 30, default_rest_seconds: 20 },
  { name: "Side Plank asymetryczny (Schroth)", body_part: "Kręgosłup", category: "Skolioza", description: "Deska boczna asymetryczna — dłużej po stronie wklęsłej (20s) niż wypukłej (10s). Korekcja siłowa krzywizny Schroth.", default_sets: 3, default_duration_seconds: 20, default_rest_seconds: 30 },
  { name: "Cat-Cow z derotacją", body_part: "Kręgosłup", category: "Skolioza", description: "Cat-Cow ze świadomą derotacją tułowia. Mobilizacja rotacyjna kręgosłupa w kierunku korekcji. 3×10 powtórzeń, codziennie.", default_sets: 3, default_reps: 10, default_rest_seconds: 30 },
  { name: "Bird-Dog asymetryczny (Schroth)", body_part: "Kręgosłup", category: "Skolioza", description: "Bird-Dog z korekcją Schroth — nacisk na stronę wklęsłą górną, co wzmacnia mięśnie derotacyjne. 3×10/stronę, 3s hold, co 2 dni.", default_sets: 3, default_reps: 10, default_duration_seconds: 3, default_rest_seconds: 45 },
  { name: "Seated Elongation (wydłużanie w siadzie)", body_part: "Kręgosłup", category: "Skolioza", description: "Aktywne wydłużanie kręgosłupa w siadzie z korekcją. Ćwiczenie biurkowe — 3×5 oddechów, 10s hold, do wykonania w pracy.", default_sets: 3, default_reps: 5, default_duration_seconds: 10, default_rest_seconds: 20 },
  { name: "Ćwiczenie łuk (Schroth Bow Exercise)", body_part: "Kręgosłup", category: "Skolioza", description: "Ćwiczenie łuku Schroth — lateral shift z korekcją rotacyjną. Zaawansowane ćwiczenie trójwymiarowej korekcji skoliozy. 3×5, 10s hold.", default_sets: 3, default_reps: 5, default_duration_seconds: 10, default_rest_seconds: 30 },
  { name: "Plank z korekcją tułowia", body_part: "Kręgosłup", category: "Skolioza", description: "Deska przodem ze świadomą korekcją tułowia i eliminacją rotacji kręgosłupa. Wymaga monitorowania korekcji. 3×20s, co 2 dni.", default_sets: 3, default_duration_seconds: 20, default_rest_seconds: 30 },

  // A5: Łokieć — Epicondylitis
  { name: "Wrist Extension Stretch (rozciąganie prostowników)", body_part: "Łokieć", category: "Epicondylitis", description: "Rozciąganie prostowników nadgarstka — kluczowe w epicondylitis bocznej (tennis elbow). 3×30s/stronę, codziennie. Bez bólu ostrego, tylko napięcie.", default_sets: 3, default_duration_seconds: 30, default_rest_seconds: 20 },
  { name: "Wrist Flexion Stretch (rozciąganie zginaczy)", body_part: "Łokieć", category: "Epicondylitis", description: "Rozciąganie zginaczy nadgarstka — podstawowe ćwiczenie w epicondylitis przyśrodkowej (golfer's elbow). 3×30s/stronę, codziennie.", default_sets: 3, default_duration_seconds: 30, default_rest_seconds: 20 },
  { name: "Eccentric Wrist Extension (Tyler Twist)", body_part: "Łokieć", category: "Epicondylitis", description: "Ekscentryczne prostowanie nadgarstka (Tyler Twist / Therabar) — gold standard w epicondylitis bocznej. 3×15, 3s opuszczanie, 2×dziennie. Ból 4-6/10 podczas ćwiczenia jest NORMALNY.", default_sets: 3, default_reps: 15, default_rest_seconds: 45 },
  { name: "Eccentric Wrist Flexion (golfista)", body_part: "Łokieć", category: "Epicondylitis", description: "Ekscentryczne zginanie nadgarstka — gold standard w epicondylitis przyśrodkowej. 3×15, 3s opuszczanie, 2×dziennie. Protokół Alfredssona.", default_sets: 3, default_reps: 15, default_rest_seconds: 45 },
  { name: "Wrist Extension izometryczna", body_part: "Łokieć", category: "Epicondylitis", description: "Izometria prostowników nadgarstka — 5×45s. Najszybsza redukcja bólu (efekt hipoalgetyczny). Wykonuj przed aktywnością i na początku programu.", default_sets: 5, default_duration_seconds: 45, default_rest_seconds: 60 },
  { name: "Wrist Flexion izometryczna", body_part: "Łokieć", category: "Epicondylitis", description: "Izometria zginaczy nadgarstka — 5×45s. Redukcja bólu w golfer's elbow. Wykonuj przed aktywnością.", default_sets: 5, default_duration_seconds: 45, default_rest_seconds: 60 },
  { name: "Forearm Pronation/Supination z obciążeniem", body_part: "Łokieć", category: "Epicondylitis", description: "Nawracanie i odwracanie przedramienia z lekkim obciążeniem. Wzmacnia mięśnie pronatory/supinatory. 3×15/kierunek, co 2 dni.", default_sets: 3, default_reps: 15, default_rest_seconds: 30 },
  { name: "Grip Strengthening (piłka/expander)", body_part: "Łokieć", category: "Epicondylitis", description: "Wzmacnianie chwytu piłką lub ekspanderem. Obciąża mięśnie przedramienia pośrednio. 3×15, 2s hold, codziennie.", default_sets: 3, default_reps: 15, default_duration_seconds: 2, default_rest_seconds: 30 },
  { name: "Finger Extension z gumką", body_part: "Łokieć", category: "Epicondylitis", description: "Rozciąganie palców z gumką oporową — antagonista ćwiczeń chwytu. Balansuje siłę zginaczy i prostowników. 3×15, codziennie.", default_sets: 3, default_reps: 15, default_rest_seconds: 20 },
  { name: "Elbow Flexion/Extension ROM", body_part: "Łokieć", category: "Epicondylitis", description: "Aktywne zginanie i prostowanie łokcia bez obciążenia — utrzymanie pełnego zakresu ruchu. 3×10, codziennie.", default_sets: 3, default_reps: 10, default_rest_seconds: 20 },
  { name: "Scapular Stabilization (wpływ na łokieć)", body_part: "Łokieć", category: "Epicondylitis", description: "Stabilizacja łopatki — redukcja napięcia łańcucha kinematycznego kończyny górnej. 3×12, 3s hold, co 2 dni.", default_sets: 3, default_reps: 12, default_duration_seconds: 3, default_rest_seconds: 45 },
  { name: "Radial Nerve Mobilization (łokieć)", body_part: "Łokieć", category: "Epicondylitis", description: "Mobilizacja nerwu promieniowego przy epicondylitis bocznej z komponentem neuropatycznym. 3×10/stronę, codziennie. Stosuj gdy mrowienie do nadgarstka.", default_sets: 3, default_reps: 10, default_rest_seconds: 20 },

  // A6: Gonarthroza
  { name: "Short Arc Quad (SAQ — zakres 0-30°)", body_part: "Kolano", category: "Gonarthroza", description: "Izolowane prostowanie kolana w małym zakresie (0-30°) — minimalna kompresja rzepki, maksymalna aktywacja VMO. 3×15, codziennie.", default_sets: 3, default_reps: 15, default_rest_seconds: 30 },
  { name: "Chair Stand (siad do stania)", body_part: "Kolano", category: "Gonarthroza", description: "Wstawanie z krzesła — kluczowe ćwiczenie funkcjonalne dla pacjentów z gonartrozą. Minimalna kompresja, wysoka funkcjonalność. 3×10, codziennie.", default_sets: 3, default_reps: 10, default_rest_seconds: 30 },
  { name: "Stationary Bike (niski opór)", body_part: "Kolano", category: "Gonarthroza", description: "Jazda na rowerze stacjonarnym przy niskim oporze. Odciążenie stawu kolanowego, poprawa krążenia mazi, zmniejszenie sztywności. 15-20 minut, co 2 dni.", default_sets: 1, default_duration_seconds: 900, default_rest_seconds: 0 },
  { name: "Hamstring Curl w leżeniu (bierne zginanie)", body_part: "Kolano", category: "Menisk", description: "Bierne/wspomagane zginanie kolana w leżeniu — zakres ruchu po operacji meniska. 3×12, co 2 dni.", default_sets: 3, default_reps: 12, default_rest_seconds: 30 },
  { name: "Lateral Band Walk (minibanda kolana)", body_part: "Kolano", category: "Menisk", description: "Chód boczny z taśmą oporową na kolanach — wzmacnianie abduktorów biodra i stabilizatorów kolana. 3×10/stronę, co 2 dni.", default_sets: 3, default_reps: 10, default_rest_seconds: 45 },

  // Template 15 exercises missing — Achilles tendinopathy (already covered in foot/ankle v1)
  // Adding exercises specifically for gonarthroza
  { name: "SLR z obciążeniem (progresja)", body_part: "Kolano", category: "Gonarthroza", description: "Unoszenie prostej nogi z obciążeniem (opaska z piaskiem). Progresja od SLR bez obciążenia — wzmacnia quadriceps bez kompresji stawu. 3×12, codziennie.", default_sets: 3, default_reps: 12, default_rest_seconds: 30 },
]

// ─── V2 Templates (16–29) ─────────────────────────────────────────────────────

const TEMPLATES_V2 = [
  {
    name: "Stożek rotatorów — Faza 1 (izometria, stan ostry)",
    description: "Pierwsze 2-4 tygodnie bólu barku lub po zaostrzeniu. Zmniejszenie bólu przez izometrię, ochrona stożka.",
    body_part: "Bark",
    exercises: [
      { name: "Wahadło Codmana (Codman Pendulum)", sets: 3, duration: 30 },
      { name: "ER izometryczna przy ścianie (0°)", sets: 5, duration: 10 },
      { name: "IR izometryczna przy ścianie", sets: 5, duration: 10 },
      { name: "Ustawienie łopatki — shrug + retraction", sets: 3, reps: 15, duration: 3 },
      { name: "Ćwiczenia oddechowe przeponowe", sets: 3, reps: 5 },
      { name: "Grip Strengthening (piłka/expander)", sets: 3, reps: 15, duration: 2 },
      { name: "Aktywne wspomagane odwiedzenie (stick)", sets: 3, reps: 10 },
    ],
  },
  {
    name: "Stożek rotatorów — Faza 2 (wzmacnianie ekscentryczne)",
    description: "Tygodnie 4-8. Wprowadzenie ekscentryki i gumy oporowej po ustąpieniu bólu spoczynkowego.",
    body_part: "Bark",
    exercises: [
      { name: "Zewnętrzna rotacja (ER) z gumą — przy ciele", sets: 3, reps: 15, duration: 2 },
      { name: "ER ekscentryczna z gumą (slow lowering)", sets: 3, reps: 12 },
      { name: "Side-lying ER z obciążeniem (progresja)", sets: 3, reps: 12 },
      { name: "Odwiedzenie ramienia w płaszczyźnie łopatki (scaption)", sets: 3, reps: 12 },
      { name: "Full Can (pełna puszka — 30° elewacja)", sets: 3, reps: 12, duration: 2 },
      { name: "Ćwiczenie \"W\" / \"Y\" / \"T\" (prone)", sets: 3, reps: 12, duration: 3 },
      { name: "Push-up Plus (aktywacja serratus anterior)", sets: 3, reps: 12 },
      { name: "Ćwiczenie \"Sleeper Stretch\"", sets: 2, duration: 30 },
    ],
  },
  {
    name: "Stożek rotatorów — Faza 3 (powrót do funkcji)",
    description: "Od 8-12 tygodnia. Wzmacnianie zaawansowane, powrót do aktywności nad głową.",
    body_part: "Bark",
    exercises: [
      { name: "ER w 90° odwiedzenia (L-position) z gumą", sets: 3, reps: 10 },
      { name: "Diagonal PNF D1 z gumą", sets: 3, reps: 10 },
      { name: "Diagonal PNF D2 z gumą", sets: 3, reps: 10 },
      { name: "Prone Row z ER (bent-over)", sets: 3, reps: 12, duration: 2 },
      { name: "Overhead reach przy ścianie (OA)", sets: 3, reps: 10 },
      { name: "Push-up Plus (aktywacja serratus anterior)", sets: 3, reps: 15 },
      { name: "Rozciąganie kapsułki tylnej (Cross-body stretch)", sets: 2, duration: 30 },
    ],
  },
  {
    name: "Ostroga piętowa — stan ostry/subostry (0-6 tyg.)",
    description: "Plantar Fasciitis w fazie bólu porannego i podczas chodzenia. Redukcja bólu, rozciąganie rozcięgna.",
    body_part: "Stopa/Kostka",
    exercises: [
      { name: "Plantar Fascia Stretch — palce cofnięte (stojąc)", sets: 3, duration: 30 },
      { name: "Rolling piłką golfową (masaż rozcięgna)", sets: 1, duration: 300 },
      { name: "Plantar Fascia Stretch przez butelkę z lodem", sets: 1, duration: 300 },
      { name: "Rozciąganie łydki stojąc (gastrocnemius)", sets: 2, duration: 30 },
      { name: "Toe Curl — zwijanie palców ręcznikiem", sets: 3, duration: 20 },
      { name: "Short Foot Exercise (skrócenie stopy)", sets: 3, reps: 12, duration: 5 },
      { name: "Eccentric Calf Lower na schodku", sets: 3, reps: 15 },
    ],
  },
  {
    name: "Ostroga piętowa — wzmacnianie (6+ tyg.)",
    description: "Po 6+ tygodniach gdy ból poranny ustąpił. Protokół ekscentryczny Alfredssona.",
    body_part: "Stopa/Kostka",
    exercises: [
      { name: "Eccentric Calf Lower na schodku", sets: 3, reps: 15 },
      { name: "Single-leg Calf Raise progresja", sets: 3, reps: 15 },
      { name: "Toe Splay (rozstawianie palców)", sets: 3, reps: 10, duration: 3 },
      { name: "Marble Pickup (palce podnoszą kulki)", sets: 3, reps: 10 },
      { name: "Short Foot Exercise (skrócenie stopy)", sets: 3, reps: 12 },
      { name: "Stanie na jednej nodze (równoważnia)", sets: 3, duration: 30 },
      { name: "Plantar Fascia Stretch — palce cofnięte (stojąc)", sets: 2, duration: 30 },
    ],
  },
  {
    name: "Hiperlordoza — korekta postawy (Faza 1)",
    description: "Pierwsze 4 tygodnie. Świadomość miednicy, rozciąganie zginaczy biodra, aktywacja brzucha.",
    body_part: "Kręgosłup lędźwiowy",
    exercises: [
      { name: "Posterior Pelvic Tilt (PPT) — nauka", sets: 3, reps: 15, duration: 5 },
      { name: "Child Pose (rozciąganie LS)", sets: 3, duration: 45 },
      { name: "Hip Flexor Stretch pogłębiony (klęk)", sets: 3, duration: 45 },
      { name: "Dead Bug z naciskiem na PPT", sets: 3, reps: 8 },
      { name: "McGill Curl-up (flexja bez zginania LS)", sets: 3, reps: 10, duration: 10 },
      { name: "Psoas Release na wałku (rolowanie)", sets: 1, duration: 60 },
      { name: "Ćwiczenia oddechowe przeponowe", sets: 3, reps: 5 },
    ],
  },
  {
    name: "Hiperlordoza — wzmacnianie i stabilizacja (Faza 2)",
    description: "Tygodnie 4-12. Wzmacnianie mięśni antygrawitacyjnych przy zachowaniu neutralnej miednicy.",
    body_part: "Kręgosłup lędźwiowy",
    exercises: [
      { name: "Hollow Body Hold", sets: 3, duration: 20 },
      { name: "Mostek z tylnym pochyleniem miednicy", sets: 3, reps: 15, duration: 3 },
      { name: "Plank z neutralizacją miednicy", sets: 3, duration: 25 },
      { name: "Wall Squat z PPT (przy ścianie)", sets: 3, reps: 12 },
      { name: "Bird-Dog", sets: 3, reps: 10, duration: 3 },
      { name: "Hip Flexor Stretch pogłębiony (klęk)", sets: 3, duration: 30 },
      { name: "Standing Hip Flexor Stretch (aktywny)", sets: 3, duration: 30 },
    ],
  },
  {
    name: "Skolioza łagodna (Cobb <25°) — program domowy",
    description: "Skolioza do 25° Cobba. Ćwiczenia ogólnostabilizujące + świadomość ciała.",
    body_part: "Kręgosłup",
    exercises: [
      { name: "Muscular Cylinder (wydłużanie osiowe)", sets: 3, reps: 5, duration: 10 },
      { name: "Rotational Angular Breathing (RAB)", sets: 3, reps: 5 },
      { name: "Side Plank asymetryczny (Schroth)", sets: 3, duration: 20 },
      { name: "Bird-Dog asymetryczny (Schroth)", sets: 3, reps: 10, duration: 3 },
      { name: "Cat-Cow z derotacją", sets: 3, reps: 10 },
      { name: "Seated Elongation (wydłużanie w siadzie)", sets: 3, reps: 5, duration: 10 },
      { name: "Plank (przodem)", sets: 3, duration: 20 },
    ],
  },
  {
    name: "Skolioza umiarkowana (Cobb 25-45°) — Schroth-based",
    description: "Skolioza 25-45° Cobba. Ćwiczenia Schroth-inspired, 3D korekcja. Dostosuj do krzywizny.",
    body_part: "Kręgosłup",
    exercises: [
      { name: "Passive Correction w leżeniu na boku", sets: 1, duration: 600 },
      { name: "Rotational Angular Breathing (RAB)", sets: 3, reps: 5 },
      { name: "Asymetryczne rozciąganie (strona wklęsła)", sets: 3, duration: 30 },
      { name: "Ćwiczenie łuk (Schroth Bow Exercise)", sets: 3, reps: 5, duration: 10 },
      { name: "Side Plank asymetryczny (Schroth)", sets: 3, duration: 25 },
      { name: "Seated Elongation (wydłużanie w siadzie)", sets: 3, reps: 5, duration: 10 },
      { name: "Ćwiczenia oddechowe przeponowe", sets: 3, reps: 5 },
    ],
  },
  {
    name: "Epicondylitis boczna — tenis (stan ostry/izometria)",
    description: "Pierwsze 2-4 tygodnie. Izometria przeciwbólowa, odciążenie, stretching.",
    body_part: "Łokieć",
    exercises: [
      { name: "Wrist Extension izometryczna", sets: 5, duration: 45 },
      { name: "Wrist Extension Stretch (rozciąganie prostowników)", sets: 3, duration: 30 },
      { name: "Grip Strengthening (piłka/expander)", sets: 3, reps: 15, duration: 2 },
      { name: "Forearm Pronation/Supination z obciążeniem", sets: 3, reps: 10 },
      { name: "Scapular Stabilization (wpływ na łokieć)", sets: 3, reps: 12, duration: 3 },
      { name: "Radial Nerve Mobilization (łokieć)", sets: 3, reps: 10 },
    ],
  },
  {
    name: "Epicondylitis boczna — program ekscentryczny (4-12 tyg.)",
    description: "Po ustąpieniu bólu spoczynkowego. Protokół ekscentryczny — gold standard tennis elbow.",
    body_part: "Łokieć",
    exercises: [
      { name: "Eccentric Wrist Extension (Tyler Twist)", sets: 3, reps: 15 },
      { name: "Forearm Pronation/Supination z obciążeniem", sets: 3, reps: 15 },
      { name: "Grip Strengthening (piłka/expander)", sets: 3, reps: 15, duration: 2 },
      { name: "Finger Extension z gumką", sets: 3, reps: 15 },
      { name: "Wrist Extension Stretch (rozciąganie prostowników)", sets: 3, duration: 30 },
      { name: "Scapular Stabilization (wpływ na łokieć)", sets: 3, reps: 12 },
    ],
  },
  {
    name: "Epicondylitis przyśrodkowa — golfista",
    description: "Golfer's elbow — ból po przyśrodkowej stronie łokcia. Ekscentryka zginaczy nadgarstka.",
    body_part: "Łokieć",
    exercises: [
      { name: "Wrist Flexion izometryczna", sets: 5, duration: 45 },
      { name: "Eccentric Wrist Flexion (golfista)", sets: 3, reps: 15 },
      { name: "Wrist Flexion Stretch (rozciąganie zginaczy)", sets: 3, duration: 30 },
      { name: "Forearm Pronation/Supination z obciążeniem", sets: 3, reps: 15 },
      { name: "Grip Strengthening (piłka/expander)", sets: 3, reps: 15 },
      { name: "Elbow Flexion/Extension ROM", sets: 3, reps: 10 },
      { name: "Scapular Stabilization (wpływ na łokieć)", sets: 3, reps: 12 },
    ],
  },
  {
    name: "Gonarthroza — program zachowawczy",
    description: "Choroba zwyrodnieniowa kolana bez wskazań operacyjnych. Redukcja bólu, utrzymanie funkcji.",
    body_part: "Kolano",
    exercises: [
      { name: "Quad Set (izometria czworogłowego)", sets: 3, reps: 10, duration: 10 },
      { name: "SLR z obciążeniem (progresja)", sets: 3, reps: 12 },
      { name: "Short Arc Quad (SAQ — zakres 0-30°)", sets: 3, reps: 15 },
      { name: "Chair Stand (siad do stania)", sets: 3, reps: 10 },
      { name: "Clamshell (mała) z gumą", sets: 3, reps: 15 },
      { name: "Mini Squat (0-45°)", sets: 3, reps: 15 },
      { name: "Stationary Bike (niski opór)", sets: 1, duration: 900 },
      { name: "Calf Raise", sets: 3, reps: 20 },
    ],
  },
  {
    name: "Rehabilitacja po urazie łąkotki",
    description: "Program po meniscektomii artroskopowej lub zachowawczym leczeniu uszkodzenia łąkotki.",
    body_part: "Kolano",
    exercises: [
      { name: "Quad Set (izometria czworogłowego)", sets: 3, reps: 10, duration: 10 },
      { name: "Heel Slide (ślizg pięty)", sets: 3, reps: 15 },
      { name: "Straight Leg Raise (SLR)", sets: 3, reps: 12 },
      { name: "Terminal Knee Extension (TKE) z gumą", sets: 3, reps: 15 },
      { name: "Mini Squat (0-45°)", sets: 3, reps: 12 },
      { name: "Step Up (wchodzenie na stopień)", sets: 3, reps: 10 },
      { name: "Hamstring Curl w leżeniu (bierne zginanie)", sets: 3, reps: 12 },
      { name: "Stanie na jednej nodze (równoważnia)", sets: 3, duration: 20 },
      { name: "Lateral Band Walk (minibanda kolana)", sets: 3, reps: 10 },
    ],
  },
]

// ─── V2 Protocols (missing from DB) ───────────────────────────────────────────

const PROTOCOLS_V2 = [
  {
    name: "Stożek rotatorów — pełna rehabilitacja",
    description: "Protokół 3-fazowy dla impingement barku i uszkodzenia stożka rotatorów.",
    indication: "Zespół ciasnoty podbarkowej, przeciążenie stożka rotatorów bez wskazań operacyjnych",
    body_part: "Bark",
    total_weeks: 16,
    phases: [
      { order: 1, name: "Faza 1 — Izometria (0-4 tyg.)", duration_weeks: 4, description: "Redukcja bólu, izometria, ochrona stożka. Ból max 3/10.", template_name: "Stożek rotatorów — Faza 1 (izometria, stan ostry)" },
      { order: 2, name: "Faza 2 — Ekscentryka (4-8 tyg.)", duration_weeks: 4, description: "Wzmacnianie ekscentryczne, zakres ruchu. Wprowadzenie gumy oporowej.", template_name: "Stożek rotatorów — Faza 2 (wzmacnianie ekscentryczne)" },
      { order: 3, name: "Faza 3 — Powrót do funkcji (8-16 tyg.)", duration_weeks: 8, description: "Wzmacnianie zaawansowane, powrót do aktywności i sportu.", template_name: "Stożek rotatorów — Faza 3 (powrót do funkcji)" },
    ],
  },
  {
    name: "Plantar Fasciitis — pełna rehabilitacja",
    description: "Protokół 2-fazowy dla ostrogi piętowej i zapalenia rozcięgna podeszwowego.",
    indication: "Plantar Fasciitis, ostroga piętowa, ból podeszwowy",
    body_part: "Stopa/Kostka",
    total_weeks: 16,
    phases: [
      { order: 1, name: "Faza 1 — Redukcja bólu (0-6 tyg.)", duration_weeks: 6, description: "Redukcja bólu porannego, stretching rozcięgna, zimno.", template_name: "Ostroga piętowa — stan ostry/subostry (0-6 tyg.)" },
      { order: 2, name: "Faza 2 — Wzmacnianie (6-16 tyg.)", duration_weeks: 10, description: "Protokół ekscentryczny Alfredssona, wzmacnianie mięśni stopy.", template_name: "Ostroga piętowa — wzmacnianie (6+ tyg.)" },
    ],
  },
  {
    name: "Hiperlordoza lędźwiowa — korekcja",
    description: "Protokół 2-fazowy korekcji hiperlordozy — świadomość miednicy, stabilizacja.",
    indication: "Hiperlordoza lędźwiowa, ból LS związany z nadmierną lordozą, przykurcz psoas",
    body_part: "Kręgosłup lędźwiowy",
    total_weeks: 12,
    phases: [
      { order: 1, name: "Faza 1 — Świadomość miednicy (0-4 tyg.)", duration_weeks: 4, description: "Nauka PPT, rozciąganie zginaczy biodra, aktywacja brzucha.", template_name: "Hiperlordoza — korekta postawy (Faza 1)" },
      { order: 2, name: "Faza 2 — Wzmacnianie (4-12 tyg.)", duration_weeks: 8, description: "Wzmacnianie mięśni antygrawitacyjnych z neutralną miednicą.", template_name: "Hiperlordoza — wzmacnianie i stabilizacja (Faza 2)" },
    ],
  },
  {
    name: "Ból szyjny — protokół 3-fazowy",
    description: "Pełny protokół rehabilitacji bólu szyjnego — od ostrego przez aktywną mobilność do stabilizacji.",
    indication: "Ból szyjny napięciowy, przeciążeniowy, cervikalgia",
    body_part: "Kręgosłup szyjny",
    total_weeks: 12,
    phases: [
      { order: 1, name: "Faza 1 — Redukcja bólu (0-3 tyg.)", duration_weeks: 3, description: "Redukcja bólu, ostrożna mobilność, izometria lekka.", template_name: "Ból szyjny — napięciowy / przeciążeniowy" },
      { order: 2, name: "Faza 2 — Aktywna mobilność (3-8 tyg.)", duration_weeks: 5, description: "Głębokie fleksory, pełna rotacja, aktywacja górnego trapeza.", template_name: "Ból szyjny — napięciowy / przeciążeniowy" },
      { order: 3, name: "Faza 3 — Stabilizacja (8-12 tyg.)", duration_weeks: 4, description: "Izometria progresywna, W/Y, mobilizacja piersiowa.", template_name: "Ból szyjny — napięciowy / przeciążeniowy" },
    ],
  },
  {
    name: "Rwa kulszowa — protokół 3-fazowy",
    description: "Pełny protokół rehabilitacji rwy kulszowej — neurodynamika, stabilizacja, powrót do aktywności.",
    indication: "Rwa kulszowa, ischialgia, radikulopatia L4-S1, ból promieniujący do kończyny dolnej",
    body_part: "Kręgosłup lędźwiowy",
    total_weeks: 12,
    phases: [
      { order: 1, name: "Faza 1 — Neurodynamika łagodna (0-3 tyg.)", duration_weeks: 3, description: "Zmniejszenie bólu, łagodna neurodynamika. VAS codziennie.", template_name: "Rwa kulszowa (Sciatica / L4-S1)" },
      { order: 2, name: "Faza 2 — Stabilizacja (3-6 tyg.)", duration_weeks: 3, description: "Stabilizacja LS, progresja neurodynamiki.", template_name: "Rwa kulszowa (Sciatica / L4-S1)" },
      { order: 3, name: "Faza 3 — Wzmacnianie (6-12 tyg.)", duration_weeks: 6, description: "Wzmacnianie, powrót do aktywności fizycznej.", template_name: "Ból kręgosłupa LS — faza przewlekła" },
    ],
  },
  {
    name: "Rwa ramienna — protokół 2-fazowy",
    description: "Protokół rehabilitacji cervicobrachalgii — neurodynamika, odciążenie, stabilizacja.",
    indication: "Rwa ramienna, cervicobrachialgia, radikulopatia C5-C7, ból i mrowienie do kończyny górnej",
    body_part: "Kręgosłup szyjny",
    total_weeks: 12,
    phases: [
      { order: 1, name: "Faza 1 — Odciążenie i neurodynamika (0-4 tyg.)", duration_weeks: 4, description: "Odbarczenie szyjne, neurodynamika slider, głębokie fleksory.", template_name: "Rwa ramienna (Cervicobrachialgia / C5-C7)" },
      { order: 2, name: "Faza 2 — Stabilizacja (4-12 tyg.)", duration_weeks: 8, description: "Izometria progresywna, W, mobilizacja piersiowa, tensor ostrożnie.", template_name: "Ból szyjny — napięciowy / przeciążeniowy" },
    ],
  },
]

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("═══ Seed v2: Ćwiczenia + Szablony + Protokoły ═══\n")

  // 1. Wgraj ćwiczenia v2 — sprawdź istniejące najpierw
  console.log(`▸ Wgrywanie ${EXERCISES_V2.length} nowych ćwiczeń...`)

  const { data: existingEx } = await sb.from("exercises").select("name")
  const existingNames = new Set((existingEx ?? []).map(e => e.name))

  const toInsert = EXERCISES_V2
    .filter(e => !existingNames.has(e.name))
    .map(e => ({
      name: e.name,
      body_part: e.body_part,
      category: e.category,
      description: e.description || null,
      default_sets: e.default_sets || null,
      default_reps: e.default_reps || null,
      default_duration_seconds: e.default_duration_seconds || null,
      default_rest_seconds: e.default_rest_seconds || null,
      practitioner_id: null,
      is_public: true,
    }))

  if (toInsert.length > 0) {
    const { error: exErr } = await sb.from("exercises").insert(toInsert)
    if (exErr) console.error("Błąd ćwiczeń:", exErr.message)
    else console.log(`  ✓ Wgrano ${toInsert.length} nowych ćwiczeń`)
  }
  const skipped = EXERCISES_V2.length - toInsert.length
  if (skipped > 0) console.log(`  ↺ Pominięto ${skipped} już istniejących ćwiczeń`)

  // 2. Pobierz wszystkie ćwiczenia z DB po nazwie (do mapowania)
  const { data: allExercises } = await sb.from("exercises").select("id, name")
  const exMap = {}
  for (const e of allExercises ?? []) exMap[e.name] = e.id

  // 3. Wgraj szablony v2
  console.log(`\n▸ Wgrywanie ${TEMPLATES_V2.length} szablonów...`)
  let templatesOk = 0
  let templatesFailed = 0

  for (const tmpl of TEMPLATES_V2) {
    // Check if template already exists
    const { data: existing } = await sb
      .from("program_templates")
      .select("id")
      .eq("name", tmpl.name)
      .is("practitioner_id", null)
      .single()

    let templateId
    if (existing) {
      templateId = existing.id
      console.log(`  ↺ Szablon istnieje: "${tmpl.name}"`)
    } else {
      const { data: newTmpl, error: tmplErr } = await sb
        .from("program_templates")
        .insert({
          name: tmpl.name,
          description: tmpl.description || null,
          body_part: tmpl.body_part || null,
          practitioner_id: null,
          is_public: true,
        })
        .select("id")
        .single()

      if (tmplErr || !newTmpl) {
        console.error(`  ✗ Błąd szablonu "${tmpl.name}": ${tmplErr?.message}`)
        templatesFailed++
        continue
      }
      templateId = newTmpl.id
    }

    // Delete old items for this template if re-running
    await sb.from("program_template_items").delete().eq("template_id", templateId)

    // Insert items
    const items = []
    let order = 1
    for (const ex of tmpl.exercises) {
      const exId = exMap[ex.name]
      if (!exId) {
        console.warn(`    ! Nie znaleziono ćwiczenia: "${ex.name}"`)
        continue
      }
      items.push({
        template_id: templateId,
        exercise_id: exId,
        order: order++,
        sets: ex.sets || null,
        reps: ex.reps || null,
        duration_seconds: ex.duration || null,
        rest_seconds: ex.rest || null,
        notes: null,
      })
    }

    if (items.length > 0) {
      const { error: itemsErr } = await sb.from("program_template_items").insert(items)
      if (itemsErr) {
        console.error(`    ! Błąd items dla "${tmpl.name}": ${itemsErr.message}`)
        templatesFailed++
        continue
      }
    }

    console.log(`  ✓ ${tmpl.name} (${items.length} ćwiczeń)`)
    templatesOk++
  }

  console.log(`  Szablony: ${templatesOk} ok, ${templatesFailed} błędów`)

  // 4. Pobierz zaktualizowaną mapę szablonów
  const { data: allTemplates } = await sb.from("program_templates").select("id, name")
  const tmplMap = {}
  for (const t of allTemplates ?? []) tmplMap[t.name] = t.id

  // 5. Wgraj brakujące protokoły v2
  console.log(`\n▸ Wgrywanie ${PROTOCOLS_V2.length} protokołów v2...`)
  let protocolsOk = 0

  for (const proto of PROTOCOLS_V2) {
    const { data: existing } = await sb
      .from("rehabilitation_protocols")
      .select("id")
      .eq("name", proto.name)
      .single()

    if (existing) {
      console.log(`  ↺ Protokół istnieje: "${proto.name}"`)
      continue
    }

    const { data: newProto, error: protoErr } = await sb
      .from("rehabilitation_protocols")
      .insert({
        name: proto.name,
        description: proto.description || null,
        indication: proto.indication || null,
        body_part: proto.body_part || null,
        total_weeks: proto.total_weeks || null,
        practitioner_id: null,
        is_public: true,
      })
      .select("id")
      .single()

    if (protoErr || !newProto) {
      console.error(`  ✗ Błąd protokołu "${proto.name}": ${protoErr?.message}`)
      continue
    }

    const phases = proto.phases.map(ph => ({
      protocol_id: newProto.id,
      order: ph.order,
      name: ph.name,
      description: ph.description || null,
      duration_weeks: ph.duration_weeks,
      template_id: tmplMap[ph.template_name] || null,
    }))

    const { error: phErr } = await sb.from("protocol_phases").insert(phases)
    if (phErr) {
      console.error(`  ! Błąd faz dla "${proto.name}": ${phErr.message}`)
      continue
    }

    const missing = proto.phases.filter(ph => !tmplMap[ph.template_name]).map(ph => ph.template_name)
    if (missing.length) console.warn(`    ! Brakujące szablony dla faz: ${missing.join(", ")}`)

    console.log(`  ✓ ${proto.name} (${phases.length} faz)`)
    protocolsOk++
  }

  console.log(`  Protokoły: ${protocolsOk} dodanych`)
  console.log("\n═══ Seed v2 zakończony! ═══")
}

main().catch(console.error)
