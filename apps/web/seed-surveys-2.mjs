/**
 * Seed clinical questionnaires:
 *   NDI     — Neck Disability Index (szyja)
 *   OHS     — Oxford Hip Score (biodro)
 *   FAAM    — Foot & Ankle Ability Measure ADL (kostka, uproszczony)
 *   PHQ-9   — Patient Health Questionnaire-9 (depresja)
 *   GAD-7   — Generalized Anxiety Disorder-7 (lęk)
 *
 * Run from apps/web:
 *   node --env-file=.env.local seed-surveys-2.mjs
 */

import { createClient } from "@supabase/supabase-js"

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
)

// ─── helpers ──────────────────────────────────────────────────────────────────

async function upsertSurvey(name, description) {
  const { data: existing } = await sb
    .from("surveys")
    .select("id")
    .eq("name", name)
    .maybeSingle()
  if (existing) {
    console.log(`⏭  skip  ${name}`)
    return null
  }
  const { data, error } = await sb
    .from("surveys")
    .insert({ name, description, is_public: true, practitioner_id: null })
    .select("id")
    .single()
  if (error) { console.error(`✗  ${name}: ${error.message}`); return null }
  return data.id
}

async function addQuestions(surveyId, questions) {
  const rows = questions.map((q, i) => ({
    survey_id: surveyId,
    order: i + 1,
    question: q.question,
    type: q.type,
    options: q.options ?? null,
    min_label: q.min_label ?? null,
    max_label: q.max_label ?? null,
    min_value: q.min_value ?? null,
    max_value: q.max_value ?? null,
  }))
  const { error } = await sb.from("survey_questions").insert(rows)
  if (error) console.error("questions insert error:", error.message)
}

// ─── NDI — Neck Disability Index ─────────────────────────────────────────────
// 10 pytań x 6 opcji (0–5). Wynik 0–50.
// 0–4 brak ograniczeń | 5–14 łagodne | 15–24 umiarkowane | 25–34 znaczne | ≥35 całkowite

const NDI_OPTS_0 = [
  "0 – Ból nie występuje",
  "1 – Bardzo słaby ból",
  "2 – Umiarkowany ból",
  "3 – Dość silny ból",
  "4 – Silny ból",
  "5 – Najsilniejszy ból nie do zniesienia",
]
const NDI_OPTS_CARE = [
  "0 – Zajmuję się sobą normalnie, bez bólu",
  "1 – Zajmuję się sobą normalnie, ale powoduje to ból",
  "2 – Czynności pielęgnacyjne są bolesne, wolno mi to idzie",
  "3 – Potrzebuję pomocy, ale większość czynności wykonuję sam",
  "4 – Większość czynności wymaga pomocy",
  "5 – Nie mogę się ubrać, z trudem się myję i pozostaję w łóżku",
]
const NDI_OPTS_LIFT = [
  "0 – Mogę podnosić ciężkie przedmioty bez bólu",
  "1 – Mogę podnosić ciężkie przedmioty, ale wywołuje to ból",
  "2 – Ból uniemożliwia podnoszenie ciężkich przedmiotów z podłogi, ale mogę przy innym ułożeniu",
  "3 – Ból uniemożliwia podnoszenie ciężkich przedmiotów, ale lekkie mogę",
  "4 – Mogę podnosić jedynie bardzo lekkie przedmioty",
  "5 – Nie mogę nic podnosić ani nosić",
]
const NDI_OPTS_READ = [
  "0 – Mogę czytać, ile chcę, bez bólu szyi",
  "1 – Mogę czytać, ile chcę, z niewielkim bólem",
  "2 – Mogę czytać, ile chcę, z umiarkowanym bólem",
  "3 – Ból uniemożliwia mi czytanie przez dłuższy czas",
  "4 – Mogę czytać zaledwie przez chwilę",
  "5 – Nie mogę czytać wcale",
]
const NDI_OPTS_HEAD = [
  "0 – Nie mam bólów głowy",
  "1 – Mam nieznaczne bóle głowy pojawiające się sporadycznie",
  "2 – Mam umiarkowane bóle głowy pojawiające się sporadycznie",
  "3 – Mam umiarkowane bóle głowy pojawiające się często",
  "4 – Mam silne bóle głowy pojawiające się często",
  "5 – Mam prawie ciągłe bóle głowy",
]
const NDI_OPTS_CONC = [
  "0 – Mogę w pełni się koncentrować, kiedy chcę, bez problemów",
  "1 – Mogę w pełni się koncentrować z nieznacznym trudem",
  "2 – Koncentrowanie się sprawia mi pewną trudność",
  "3 – Koncentrowanie się sprawia mi znaczną trudność",
  "4 – Mam duże trudności z koncentracją",
  "5 – Nie mogę się w ogóle skoncentrować",
]
const NDI_OPTS_WORK = [
  "0 – Mogę pracować tyle, ile chcę",
  "1 – Mogę wykonywać tylko normalną pracę, ale nie więcej",
  "2 – Mogę wykonywać większość normalnej pracy, ale nie wszystko",
  "3 – Nie mogę wykonywać normalnej pracy",
  "4 – Z trudem wykonuję jakąkolwiek pracę",
  "5 – Nie mogę pracować w ogóle",
]
const NDI_OPTS_DRIVE = [
  "0 – Mogę prowadzić samochód bez bólu szyi",
  "1 – Mogę prowadzić, ile chcę, z nieznacznym bólem",
  "2 – Mogę prowadzić, ile chcę, z umiarkowanym bólem",
  "3 – Ból uniemożliwia mi jazdę przez dłuższy czas",
  "4 – Mogę prowadzić zaledwie przez chwilę",
  "5 – Nie mogę prowadzić samochodu wcale",
]
const NDI_OPTS_SLEEP = [
  "0 – Nie mam problemów ze snem",
  "1 – Sen jest nieznacznie zaburzony (< 1 h bezsenności)",
  "2 – Sen jest nieznacznie zaburzony (1–2 h bezsenności)",
  "3 – Sen jest umiarkowanie zaburzony (2–3 h bezsenności)",
  "4 – Sen jest znacznie zaburzony (3–5 h bezsenności)",
  "5 – Sen jest całkowicie zaburzony (5–7 h bezsenności)",
]
const NDI_OPTS_REC = [
  "0 – Mogę uprawiać rekreację bez bólu",
  "1 – Mogę uprawiać większość aktywności rekreacyjnych, z nieznacznym bólem",
  "2 – Ból ogranicza mnie do większości, ale nie wszystkich aktywności rekreacyjnych",
  "3 – Ból ogranicza mnie do kilku aktywności rekreacyjnych",
  "4 – Ból ogranicza prawie każdą aktywność rekreacyjną",
  "5 – Ból nie pozwala na żadną aktywność rekreacyjną",
]

const NDI_QUESTIONS = [
  { question: "Intensywność bólu szyi", type: "multiple_choice", options: NDI_OPTS_0 },
  { question: "Pielęgnacja osobista (mycie, ubieranie się)", type: "multiple_choice", options: NDI_OPTS_CARE },
  { question: "Podnoszenie przedmiotów", type: "multiple_choice", options: NDI_OPTS_LIFT },
  { question: "Czytanie", type: "multiple_choice", options: NDI_OPTS_READ },
  { question: "Bóle głowy", type: "multiple_choice", options: NDI_OPTS_HEAD },
  { question: "Koncentracja uwagi", type: "multiple_choice", options: NDI_OPTS_CONC },
  { question: "Praca", type: "multiple_choice", options: NDI_OPTS_WORK },
  { question: "Prowadzenie samochodu", type: "multiple_choice", options: NDI_OPTS_DRIVE },
  { question: "Sen", type: "multiple_choice", options: NDI_OPTS_SLEEP },
  { question: "Rekreacja i czas wolny", type: "multiple_choice", options: NDI_OPTS_REC },
]

// ─── OHS — Oxford Hip Score ───────────────────────────────────────────────────
// 12 pytań x 5 opcji (1–5, gdzie 1 = najlepszy). Wynik 12–60, niższy = lepszy.

const OHS_OPTS_PAIN = [
  "1 – Żaden",
  "2 – Bardzo słaby, sporadyczny",
  "3 – Łagodny, bez wpływu na sen",
  "4 – Umiarkowany, ból regularne",
  "5 – Silny ból",
]
const OHS_OPTS_WASH = [
  "1 – Bez problemów",
  "2 – Drobne trudności",
  "3 – Umiarkowane trudności",
  "4 – Duże trudności",
  "5 – Niemożliwe",
]
const OHS_OPTS_TRANS = [
  "1 – Zupełnie dobrze",
  "2 – Z drobną trudnością",
  "3 – Z umiarkowaną trudnością, dodatkowe podparcie konieczne",
  "4 – Z dużą trudnością",
  "5 – Niemożliwe bez pomocy",
]
const OHS_OPTS_SOCK = [
  "1 – Zupełnie dobrze",
  "2 – Z drobną trudnością",
  "3 – Z umiarkowaną trudnością",
  "4 – Z dużą trudnością",
  "5 – Niemożliwe",
]
const OHS_OPTS_SHOP = [
  "1 – Zupełnie dobrze",
  "2 – Z drobnymi trudnościami",
  "3 – Z umiarkowanymi trudnościami",
  "4 – Z dużymi trudnościami",
  "5 – Niemożliwe",
]
const OHS_OPTS_WALK = [
  "1 – Brak problemów, > 30 minut",
  "2 – Drobne problemy, 16–30 minut",
  "3 – Umiarkowane problemy, 5–15 minut",
  "4 – Tylko w domu, krótkie dystanse",
  "5 – Nie mogę chodzić",
]
const OHS_OPTS_STAIRS = [
  "1 – Zupełnie swobodnie",
  "2 – Z drobną trudnością",
  "3 – Z umiarkowaną trudnością",
  "4 – Z dużą trudnością",
  "5 – Niemożliwe",
]
const OHS_OPTS_PUBLIC = [
  "1 – Zupełnie dobrze",
  "2 – Z drobnymi trudnościami",
  "3 – Z umiarkowanymi trudnościami",
  "4 – Z dużymi trudnościami",
  "5 – Niemożliwe",
]
const OHS_OPTS_LIMP = [
  "1 – Nigdy, rzadko",
  "2 – Czasami lub tylko na początku marszu",
  "3 – Często, nie tylko na początku",
  "4 – Przez większość czasu",
  "5 – Zawsze",
]
const OHS_OPTS_SUDDEN = [
  "1 – Nigdy",
  "2 – Rzadko",
  "3 – Czasami",
  "4 – Często",
  "5 – Zawsze",
]
const OHS_OPTS_WORK = [
  "1 – Tak, łącznie z ciężką pracą",
  "2 – Tak, umiarkowaną",
  "3 – Tak, lekką",
  "4 – Prawie niemożliwe",
  "5 – Niemożliwe",
]
const OHS_OPTS_NIGHT = [
  "1 – Żadnego bólu",
  "2 – Drobny ból, 1 noc w ciągu 2 tygodni",
  "3 – Umiarkowany ból, kilka nocy w ciągu 2 tygodni",
  "4 – Silny ból, większość nocy",
  "5 – Ból przez cały czas",
]

const OHS_QUESTIONS = [
  { question: "Jak opisuje Pan(i) ból biodra w ciągu ostatnich 4 tygodni?", type: "multiple_choice", options: OHS_OPTS_PAIN },
  { question: "Mycie i wycieranie całego ciała", type: "multiple_choice", options: OHS_OPTS_WASH },
  { question: "Wsiadanie i wysiadanie z samochodu / środków komunikacji", type: "multiple_choice", options: OHS_OPTS_TRANS },
  { question: "Zakładanie skarpet lub pończoch", type: "multiple_choice", options: OHS_OPTS_SOCK },
  { question: "Robienie zakupów i noszenie torby z zakupami", type: "multiple_choice", options: OHS_OPTS_SHOP },
  { question: "Jak długo może Pan(i) chodzić zanim ból stanie się silny?", type: "multiple_choice", options: OHS_OPTS_WALK },
  { question: "Wchodzenie po schodach", type: "multiple_choice", options: OHS_OPTS_STAIRS },
  { question: "Korzystanie z komunikacji publicznej lub wizyty u znajomych", type: "multiple_choice", options: OHS_OPTS_PUBLIC },
  { question: "Czy podczas chodzenia pojawia się utykanie?", type: "multiple_choice", options: OHS_OPTS_LIMP },
  { question: "Czy pojawia się nagły, przenikliwy ból lub uczucie 'blokady' biodra?", type: "multiple_choice", options: OHS_OPTS_SUDDEN },
  { question: "Czy biodro pozwala na pracę lub codzienne obowiązki?", type: "multiple_choice", options: OHS_OPTS_WORK },
  { question: "Ból nocny wybudzający ze snu", type: "multiple_choice", options: OHS_OPTS_NIGHT },
]

// ─── FAAM-ADL (skrócony) — Foot & Ankle Ability Measure ──────────────────────
// 10 pytań dot. codziennych aktywności. Skala 4-stopniowa.

const FAAM_OPTS = [
  "0 – Żadnych trudności",
  "1 – Nieznaczne trudności",
  "2 – Umiarkowane trudności",
  "3 – Duże trudności",
  "4 – Niemożliwe",
]

const FAAM_QUESTIONS = [
  { question: "Stanie przez dłuższy czas (bez bólu/trudności)", type: "multiple_choice", options: FAAM_OPTS },
  { question: "Chodzenie po równej nawierzchni", type: "multiple_choice", options: FAAM_OPTS },
  { question: "Chodzenie bez butów po twardej nawierzchni", type: "multiple_choice", options: FAAM_OPTS },
  { question: "Chodzenie po pochyłości w górę", type: "multiple_choice", options: FAAM_OPTS },
  { question: "Chodzenie po pochyłości w dół", type: "multiple_choice", options: FAAM_OPTS },
  { question: "Wchodzenie po schodach", type: "multiple_choice", options: FAAM_OPTS },
  { question: "Schodzenie po schodach", type: "multiple_choice", options: FAAM_OPTS },
  { question: "Chodzenie po nierównym terenie", type: "multiple_choice", options: FAAM_OPTS },
  { question: "Wstawanie z krzesła", type: "multiple_choice", options: FAAM_OPTS },
  { question: "Stanie na palcach (wspięcie)", type: "multiple_choice", options: FAAM_OPTS },
  {
    question: "Jak ocenia Pan(i) poziom funkcjonowania stopy/kostki (ogólnie)?",
    type: "scale",
    min_value: 0, max_value: 100,
    min_label: "0 – Pełna niesprawność", max_label: "100 – Pełna sprawność",
  },
]

// ─── PHQ-9 — Patient Health Questionnaire ────────────────────────────────────
// 9 pytań. Wynik 0–27. ≥10 depresja umiarkowana.

const PHQ_OPTS = [
  "0 – Wcale",
  "1 – Przez kilka dni",
  "2 – Przez ponad połowę dni",
  "3 – Prawie każdego dnia",
]

const PHQ9_QUESTIONS = [
  { question: "Małe zainteresowanie lub brak przyjemności z wykonywania rzeczy", type: "multiple_choice", options: PHQ_OPTS },
  { question: "Uczucie smutku, depresji lub beznadziejności", type: "multiple_choice", options: PHQ_OPTS },
  { question: "Trudności z zasypianiem lub snem, lub sen za długi", type: "multiple_choice", options: PHQ_OPTS },
  { question: "Uczucie zmęczenia lub braku energii", type: "multiple_choice", options: PHQ_OPTS },
  { question: "Słaby apetyt lub przejadanie się", type: "multiple_choice", options: PHQ_OPTS },
  { question: "Złe samopoczucie lub poczucie, że jest się nieudacznikiem lub że zawiodło się siebie lub rodzinę", type: "multiple_choice", options: PHQ_OPTS },
  { question: "Trudności ze skupieniem się na rzeczach takich jak czytanie lub oglądanie telewizji", type: "multiple_choice", options: PHQ_OPTS },
  { question: "Poruszanie się lub mówienie tak powolne, że inni to zauważają; lub odwrotnie — podenerwowanie lub niepokój powodujące większą aktywność niż zwykle", type: "multiple_choice", options: PHQ_OPTS },
  { question: "Myśli, że lepiej byłoby nie żyć lub myśli o skrzywdzeniu siebie w jakiś sposób", type: "multiple_choice", options: PHQ_OPTS },
]

// ─── GAD-7 — Generalized Anxiety Disorder ────────────────────────────────────
// 7 pytań. Wynik 0–21. ≥10 lęk umiarkowany.

const GAD_OPTS = PHQ_OPTS // te same 4 opcje

const GAD7_QUESTIONS = [
  { question: "Uczucie nerwowości, niepokoju lub napięcia", type: "multiple_choice", options: GAD_OPTS },
  { question: "Niemożność zatrzymania lub kontrolowania martwienia się", type: "multiple_choice", options: GAD_OPTS },
  { question: "Nadmierne martwienie się o różne rzeczy", type: "multiple_choice", options: GAD_OPTS },
  { question: "Trudności z relaksowaniem się", type: "multiple_choice", options: GAD_OPTS },
  { question: "Tak duże podenerwowanie, że trudno usiedzieć w miejscu", type: "multiple_choice", options: GAD_OPTS },
  { question: "Łatwe wpadanie w irytację lub rozdrażnienie", type: "multiple_choice", options: GAD_OPTS },
  { question: "Uczucie strachu, jakby miało się wydarzyć coś strasznego", type: "multiple_choice", options: GAD_OPTS },
]

// ─── main ─────────────────────────────────────────────────────────────────────

const SURVEYS = [
  {
    name: "NDI — Wskaźnik Niepełnosprawności Szyi",
    description: "Neck Disability Index. 10 pytań o funkcjonowanie szyi. Wynik 0–50 (0 = brak ograniczeń, 50 = całkowita niesprawność).",
    questions: NDI_QUESTIONS,
  },
  {
    name: "Oxford Hip Score (OHS)",
    description: "Ocena funkcji stawu biodrowego. 12 pytań. Wynik 12–60 (niższy = lepszy). Stosowany po endoprotezoplastyce i w chorobie zwyrodnieniowej.",
    questions: OHS_QUESTIONS,
  },
  {
    name: "FAAM — Funkcja Stopy i Kostki",
    description: "Foot & Ankle Ability Measure (ADL). Ocena aktywności dnia codziennego przy dysfunkcji stopy/kostki.",
    questions: FAAM_QUESTIONS,
  },
  {
    name: "PHQ-9 — Kwestionariusz Zdrowia Pacjenta (Depresja)",
    description: "Patient Health Questionnaire-9. Przesiewowy test depresji. Wynik ≥10 sugeruje depresję umiarkowaną (wynik 0–27).",
    questions: PHQ9_QUESTIONS,
  },
  {
    name: "GAD-7 — Zaburzenia Lękowe Uogólnione",
    description: "Generalized Anxiety Disorder-7. Przesiewowy test lęku. Wynik ≥10 sugeruje lęk umiarkowany (wynik 0–21).",
    questions: GAD7_QUESTIONS,
  },
]

let ok = 0, skip = 0, fail = 0

for (const s of SURVEYS) {
  const id = await upsertSurvey(s.name, s.description)
  if (!id) { skip++; continue }
  await addQuestions(id, s.questions)
  console.log(`✓  ${s.name}  (${s.questions.length} pytań)`)
  ok++
}

console.log(`\nGotowe: ${ok} dodanych, ${skip} pominiętych, ${fail} błędów`)
