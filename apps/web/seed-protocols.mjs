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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
)

// ─── 5 DODATKOWYCH KWESTIONARIUSZY ───────────────────────────────────────────

const surveys = [
  // 1. NDI — Neck Disability Index
  {
    survey: {
      name: "NDI — Niepełnosprawność szyjna",
      description: "Neck Disability Index — ocena niepełnosprawności spowodowanej bólem szyi (10 sekcji, 0–50 pkt). Wynik ≤4 = brak niepełnosprawności, 5–14 = łagodna, 15–24 = umiarkowana, 25–34 = poważna, ≥35 = całkowita.",
    },
    questions: [
      { order: 1, question: "Intensywność bólu szyi", type: "multiple_choice", options: ["Nie mam teraz bólu", "Ból jest bardzo łagodny", "Ból jest umiarkowany", "Ból jest dość silny", "Ból jest bardzo silny", "Ból jest nie do zniesienia"], min_value: 0, max_value: 5 },
      { order: 2, question: "Samoobsługa (mycie, ubieranie itp.)", type: "multiple_choice", options: ["Radzę sobie normalnie bez nasilania bólu", "Radzę sobie normalnie, ale ból się nasila", "Samoobsługa jest bolesna i jestem powolny/a", "Potrzebuję trochę pomocy, ale radzę sobie z większością", "Każdego dnia potrzebuję pomocy", "Nie mogę się ubrać, myję się z trudnością i zostaję w łóżku"], min_value: 0, max_value: 5 },
      { order: 3, question: "Unoszenie przedmiotów", type: "multiple_choice", options: ["Mogę podnosić ciężkie przedmioty bez bólu", "Mogę podnosić ciężkie, ale nasila to ból", "Ból uniemożliwia unoszenie ciężkich przedmiotów z podłogi, ale radzę sobie jeśli są dogodnie ustawione", "Ból uniemożliwia unoszenie ciężkich, ale radzę sobie z lekkimi", "Mogę podnosić tylko bardzo lekkie", "Nie mogę nic podnosić ani przenosić"], min_value: 0, max_value: 5 },
      { order: 4, question: "Czytanie", type: "multiple_choice", options: ["Czytam tyle ile chcę bez bólu szyi", "Czytam tyle ile chcę przy niewielkim bólu", "Czytam tyle ile chcę przy umiarkowanym bólu", "Nie mogę czytać tyle ile chcę z powodu umiarkowanego bólu", "Ledwie mogę czytać z powodu silnego bólu", "Nie mogę czytać wcale"], min_value: 0, max_value: 5 },
      { order: 5, question: "Bóle głowy", type: "multiple_choice", options: ["Nie mam żadnych bólów głowy", "Mam nieznaczne bóle głowy, rzadko", "Mam umiarkowane bóle głowy, rzadko", "Mam umiarkowane bóle głowy, często", "Mam silne bóle głowy, często", "Mam bóle głowy prawie cały czas"], min_value: 0, max_value: 5 },
      { order: 6, question: "Koncentracja", type: "multiple_choice", options: ["Koncentruję się w pełni bez trudności", "Koncentruję się w pełni z niewielką trudnością", "Mam pewne trudności z koncentracją", "Mam spore trudności z koncentracją", "Mam duże trudności z koncentracją", "Nie mogę się w ogóle skupić"], min_value: 0, max_value: 5 },
      { order: 7, question: "Praca (zawodowa i domowa)", type: "multiple_choice", options: ["Mogę pracować tyle ile chcę", "Mogę wykonywać tylko swoją zwykłą pracę, nie więcej", "Mogę wykonywać większość swojej pracy, ale nie więcej", "Nie mogę wykonywać swojej zwykłej pracy", "Ledwie mogę wykonywać jakąkolwiek pracę", "Nie mogę pracować w ogóle"], min_value: 0, max_value: 5 },
      { order: 8, question: "Prowadzenie samochodu", type: "multiple_choice", options: ["Prowadzę bez trudności", "Prowadzę z niewielkim bólem szyi", "Prowadzę z umiarkowanym bólem szyi", "Nie prowadzę z powodu umiarkowanego bólu", "Ledwie prowadzę z powodu silnego bólu", "Nie prowadzę w ogóle"], min_value: 0, max_value: 5 },
      { order: 9, question: "Sen", type: "multiple_choice", options: ["Nie mam problemów ze snem", "Mój sen jest nieznacznie zaburzony (mniej niż 1 godz. bezsenności)", "Mój sen jest nieznacznie zaburzony (1–2 godz. bezsenności)", "Mój sen jest umiarkowanie zaburzony (2–3 godz. bezsenności)", "Mój sen jest poważnie zaburzony (3–5 godz. bezsenności)", "Mój sen jest całkowicie zaburzony (5–7 godz. bezsenności)"], min_value: 0, max_value: 5 },
      { order: 10, question: "Aktywność rekreacyjna", type: "multiple_choice", options: ["Jestem w stanie wykonywać wszystkie moje aktywności", "Jestem w stanie wykonywać większość, ale nie wszystkie", "Mogę wykonywać tylko kilka moich aktywności z powodu bólu", "Mogę wykonywać tylko kilka moich aktywności z powodu bólu", "Ledwie mogę wykonywać jakiekolwiek aktywności z powodu bólu", "Nie mogę wykonywać żadnych aktywności"], min_value: 0, max_value: 5 },
    ],
  },

  // 2. KOOS — Knee injury and Osteoarthritis Outcome Score (wersja skrócona)
  {
    survey: {
      name: "KOOS — Wyniki leczenia kolana",
      description: "Knee injury and Osteoarthritis Outcome Score — ocena dolegliwości kolana w 5 domenach: ból, objawy, aktywność codziennia, sport/rekreacja, jakość życia. Wyższy wynik = lepszy stan (0–100).",
    },
    questions: [
      { order: 1, question: "Jak często odczuwasz ból kolana? (ogólnie)", type: "multiple_choice", options: ["Nigdy", "Co miesiąc", "Co tydzień", "Codziennie", "Cały czas"], min_value: 0, max_value: 4 },
      { order: 2, question: "Ból przy chodzeniu po równej powierzchni", type: "multiple_choice", options: ["Brak bólu", "Minimalny", "Umiarkowany", "Silny", "Ekstremalny"], min_value: 0, max_value: 4 },
      { order: 3, question: "Ból przy wchodzeniu/schodzeniu ze schodów", type: "multiple_choice", options: ["Brak bólu", "Minimalny", "Umiarkowany", "Silny", "Ekstremalny"], min_value: 0, max_value: 4 },
      { order: 4, question: "Ból w nocy leżąc w łóżku", type: "multiple_choice", options: ["Brak bólu", "Minimalny", "Umiarkowany", "Silny", "Ekstremalny"], min_value: 0, max_value: 4 },
      { order: 5, question: "Jak poważna jest sztywność kolana rano po przebudzeniu?", type: "multiple_choice", options: ["Brak", "Minimalna", "Umiarkowana", "Poważna", "Bardzo poważna"], min_value: 0, max_value: 4 },
      { order: 6, question: "Trudności przy wstawaniu z pozycji siedzącej", type: "multiple_choice", options: ["Brak trudności", "Minimalne", "Umiarkowane", "Poważne", "Ekstremalne"], min_value: 0, max_value: 4 },
      { order: 7, question: "Trudności przy kucaniu", type: "multiple_choice", options: ["Brak trudności", "Minimalne", "Umiarkowane", "Poważne", "Niemożliwe"], min_value: 0, max_value: 4 },
      { order: 8, question: "Trudności przy uprawianiu sportu lub aktywności rekreacyjnej", type: "multiple_choice", options: ["Brak trudności", "Minimalne", "Umiarkowane", "Poważne", "Niemożliwe"], min_value: 0, max_value: 4 },
      { order: 9, question: "Jak często jesteś świadomy/a problemów z kolanem?", type: "multiple_choice", options: ["Nigdy", "Co miesiąc", "Co tydzień", "Codziennie", "Cały czas"], min_value: 0, max_value: 4 },
      { order: 10, question: "Jak bardzo zmienił się Twój styl życia z powodu kolana?", type: "multiple_choice", options: ["Wcale", "Trochę", "Umiarkowanie", "Bardzo", "Całkowicie"], min_value: 0, max_value: 4 },
    ],
  },

  // 3. HOOS — Hip disability and Osteoarthritis Outcome Score (wersja skrócona)
  {
    survey: {
      name: "HOOS — Wyniki leczenia biodra",
      description: "Hip disability and Osteoarthritis Outcome Score — ocena dolegliwości biodra. Wyższy wynik = lepszy stan (0–100).",
    },
    questions: [
      { order: 1, question: "Jak często odczuwasz ból biodra? (ogólnie)", type: "multiple_choice", options: ["Nigdy", "Co miesiąc", "Co tydzień", "Codziennie", "Cały czas"], min_value: 0, max_value: 4 },
      { order: 2, question: "Ból przy chodzeniu po równej powierzchni", type: "multiple_choice", options: ["Brak bólu", "Minimalny", "Umiarkowany", "Silny", "Ekstremalny"], min_value: 0, max_value: 4 },
      { order: 3, question: "Ból przy wchodzeniu i schodzeniu ze schodów", type: "multiple_choice", options: ["Brak bólu", "Minimalny", "Umiarkowany", "Silny", "Ekstremalny"], min_value: 0, max_value: 4 },
      { order: 4, question: "Ból po siedzeniu lub leżeniu", type: "multiple_choice", options: ["Brak bólu", "Minimalny", "Umiarkowany", "Silny", "Ekstremalny"], min_value: 0, max_value: 4 },
      { order: 5, question: "Jak poważna jest sztywność biodra rano po przebudzeniu?", type: "multiple_choice", options: ["Brak", "Minimalna", "Umiarkowana", "Poważna", "Bardzo poważna"], min_value: 0, max_value: 4 },
      { order: 6, question: "Trudności przy wstawaniu z krzesła", type: "multiple_choice", options: ["Brak trudności", "Minimalne", "Umiarkowane", "Poważne", "Ekstremalne"], min_value: 0, max_value: 4 },
      { order: 7, question: "Trudności przy zakładaniu skarpetek/pończoch", type: "multiple_choice", options: ["Brak trudności", "Minimalne", "Umiarkowane", "Poważne", "Niemożliwe"], min_value: 0, max_value: 4 },
      { order: 8, question: "Trudności przy uprawianiu sportu lub aktywności rekreacyjnej", type: "multiple_choice", options: ["Brak trudności", "Minimalne", "Umiarkowane", "Poważne", "Niemożliwe"], min_value: 0, max_value: 4 },
      { order: 9, question: "Jak często jesteś świadomy/a problemów z biodrem?", type: "multiple_choice", options: ["Nigdy", "Co miesiąc", "Co tydzień", "Codziennie", "Cały czas"], min_value: 0, max_value: 4 },
      { order: 10, question: "Jak bardzo zmienił się Twój styl życia z powodu biodra?", type: "multiple_choice", options: ["Wcale", "Trochę", "Umiarkowanie", "Bardzo", "Całkowicie"], min_value: 0, max_value: 4 },
    ],
  },

  // 4. QuickDASH — skrócony kwestionariusz kończyny górnej
  {
    survey: {
      name: "QuickDASH — Kończyna górna (skrócony)",
      description: "Skrócona wersja kwestionariusza DASH (11 pytań). Ocenia funkcję i objawy kończyny górnej. Wynik 0 = brak trudności, 100 = maksymalne trudności.",
    },
    questions: [
      { order: 1, question: "Otwieranie słoika", type: "multiple_choice", options: ["Bez trudności", "Niewielkie trudności", "Umiarkowane trudności", "Duże trudności", "Niemożliwe"], min_value: 1, max_value: 5 },
      { order: 2, question: "Ciężka praca domowa (mycie podłóg, przenoszenie skrzynek)", type: "multiple_choice", options: ["Bez trudności", "Niewielkie trudności", "Umiarkowane trudności", "Duże trudności", "Niemożliwe"], min_value: 1, max_value: 5 },
      { order: 3, question: "Noszenie torby na zakupy lub teczki", type: "multiple_choice", options: ["Bez trudności", "Niewielkie trudności", "Umiarkowane trudności", "Duże trudności", "Niemożliwe"], min_value: 1, max_value: 5 },
      { order: 4, question: "Mycie pleców", type: "multiple_choice", options: ["Bez trudności", "Niewielkie trudności", "Umiarkowane trudności", "Duże trudności", "Niemożliwe"], min_value: 1, max_value: 5 },
      { order: 5, question: "Użycie noża do krojenia jedzenia", type: "multiple_choice", options: ["Bez trudności", "Niewielkie trudności", "Umiarkowane trudności", "Duże trudności", "Niemożliwe"], min_value: 1, max_value: 5 },
      { order: 6, question: "Aktywności rekreacyjne wymagające pewnej siły (golf, uderzenie piłki, tenis)", type: "multiple_choice", options: ["Bez trudności", "Niewielkie trudności", "Umiarkowane trudności", "Duże trudności", "Niemożliwe / nie dotyczy"], min_value: 1, max_value: 5 },
      { order: 7, question: "Praca (normalna lub dodatkowa)", type: "multiple_choice", options: ["Bez trudności", "Niewielkie trudności", "Umiarkowane trudności", "Duże trudności", "Niemożliwe"], min_value: 1, max_value: 5 },
      { order: 8, question: "Ból ramienia, barku lub ręki w ciągu ostatniego tygodnia", type: "multiple_choice", options: ["Brak", "Łagodny", "Umiarkowany", "Silny", "Ekstremalny"], min_value: 1, max_value: 5 },
      { order: 9, question: "Mrowienie (mrówki) w ramieniu, barku lub dłoni w ciągu ostatniego tygodnia", type: "multiple_choice", options: ["Brak", "Łagodne", "Umiarkowane", "Silne", "Ekstremalne"], min_value: 1, max_value: 5 },
      { order: 10, question: "Trudności ze snem spowodowane bólem ramienia, barku lub ręki", type: "multiple_choice", options: ["Brak trudności", "Niewielkie trudności", "Umiarkowane trudności", "Duże trudności", "Niemożliwe (nie spałem/am wcale)"], min_value: 1, max_value: 5 },
      { order: 11, question: "Poczucie mniejszej zdolności lub mniejszej pewności siebie z powodu problemów z ramieniem, barkiem lub ręką", type: "multiple_choice", options: ["Wcale się nie zgadzam", "Trochę się zgadzam", "Umiarkowanie się zgadzam", "Zgadzam się", "Całkowicie się zgadzam"], min_value: 1, max_value: 5 },
    ],
  },

  // 5. VISA-A — ścięgno Achillesa
  {
    survey: {
      name: "VISA-A — Ścięgno Achillesa",
      description: "Victorian Institute of Sport Assessment – Achilles. Ocena nasilenia tendinopatii ścięgna Achillesa. Wynik 100 = całkowite zdrowie, wyniki poniżej 80 wskazują na istotną dysfunkcję.",
    },
    questions: [
      { order: 1, question: "Przez ile minut możesz chodzić po płaskim terenie bez bólu lub po jakim czasie ból się nasila?", type: "multiple_choice", options: ["0 minut", "1–5 minut", "6–10 minut", "11–20 minut", "Powyżej 20 minut"], min_value: 0, max_value: 10 },
      { order: 2, question: "Czy masz ból rano po przebudzeniu podczas pierwszych kroków?", type: "scale", min_label: "Silny ból", max_label: "Brak bólu", min_value: 0, max_value: 10 },
      { order: 3, question: "Czy masz ból po rozciąganiu łydki w pozycji stojącej (rozciąganie 10×)?", type: "multiple_choice", options: ["Tak — silny ból", "Tak — umiarkowany ból", "Tak — nieznaczny ból", "Minimalny ból lub brak"], min_value: 0, max_value: 10 },
      { order: 4, question: "Czy masz ból przy opadaniu pięty na jednej nodze (10 powtórzeń)?", type: "multiple_choice", options: ["Nie mogę wykonać", "Silny ból", "Umiarkowany ból", "Brak bólu"], min_value: 0, max_value: 10 },
      { order: 5, question: "Czy masz ból przy wspięciu na palce jednonóż (10 powtórzeń)?", type: "multiple_choice", options: ["Nie mogę wykonać", "Silny ból", "Umiarkowany ból", "Brak bólu"], min_value: 0, max_value: 10 },
      { order: 6, question: "Ile pełnych wspięć na palce jednonóż możesz wykonać bez bólu?", type: "multiple_choice", options: ["0", "1–4", "5–9", "10–14", "15–19", "20–25"], min_value: 0, max_value: 10 },
      { order: 7, question: "Czy jesteś aktualnie uprawiający/a sport lub inne aktywności fizyczne?", type: "multiple_choice", options: ["Nie uprawiam sportu z powodu bólu", "Zredukowana aktywność z powodu bólu", "Uprawiam sport, ale zmodyfikowany ze względu na ból", "Uprawiam sport bez ograniczeń"], min_value: 0, max_value: 10 },
      { order: 8, question: "Proszę ukończyć poniższe zadanie: Zrób 5 wspięć na palce jednonóż, a następnie oceń ból bezpośrednio po.", type: "scale", min_label: "Nie mogłem/am wykonać", max_label: "Brak bólu", min_value: 0, max_value: 10 },
    ],
  },
]

// ─── 3 PROTOKOŁY REHABILITACYJNE ─────────────────────────────────────────────

const protocols = [
  {
    protocol: {
      name: "Protokół rehabilitacji po rekonstrukcji ACL",
      description: "Kompleksowy, 24-tygodniowy protokół powrotu do zdrowia po rekonstrukcji więzadła krzyżowego przedniego (ACL). Obejmuje 5 faz — od kontroli bólu i obrzęku po pełny powrót do sportu.",
      indication: "Rekonstrukcja ACL (autograft, allograft). Dotyczy również urazów więzadeł krzyżowych bez operacji przy wskazaniach konserwatywnych.",
      total_weeks: 24,
      body_part: "Kolano",
    },
    phases: [
      {
        order: 1,
        name: "Faza 1 — Wczesna rehabilitacja (tydzień 1–2)",
        description: "Głównym celem jest kontrola bólu i obrzęku, odbudowa pełnego wyprostu i wczesna aktywacja mięśniowa. Pacjent porusza się przy pomocy kul.",
        goals: "Zmniejszenie bólu i obrzęku\nOsiągnięcie pełnego wyprostu kolana\nWczesna aktywacja mięśnia czworogłowego (Quad Set)\nChód z pomocą kul — prawidłowy wzorzec",
        duration_weeks: 2,
        template_name: "Rehabilitacja kolana po ACL – faza wczesna",
      },
      {
        order: 2,
        name: "Faza 2 — Mobilizacja i odciążony zakres ruchu (tydzień 3–6)",
        description: "Stopniowe odzyskiwanie zakresu ruchu do 120°+, rezygnacja z kul, poprawa chodu. Aktywacja VMO i ćwiczenia propriocepcji.",
        goals: "Zakres zgięcia kolana ≥120°\nChód bez kul\nPropriorecepcja w staniu na jednej nodze\nAktywacja VMO i mięśni pośladkowych",
        duration_weeks: 4,
        template_name: "Rehabilitacja kolana po ACL – faza wczesna",
      },
      {
        order: 3,
        name: "Faza 3 — Siła i stabilizacja (tydzień 7–12)",
        description: "Odbudowa siły mięśniowej czworogłowego i hamstringów do ≥70% symetrii. Progresja ćwiczeń zamkniętych łańcuchów kinematycznych, trening ekscentryczny.",
        goals: "Siła czworogłowego ≥70% kończyny zdrowej\nPełny zakres ruchu\nTrening ekscentryczny (nordic curl progresja)\nCzas stania jednonóż ≥30s",
        duration_weeks: 6,
        template_name: "Rehabilitacja kolana po ACL – faza siłowa",
      },
      {
        order: 4,
        name: "Faza 4 — Trening funkcjonalny (tydzień 13–20)",
        description: "Progresja do aktywności sportowych — bieg, skoki, zmiany kierunku. Siła ≥85% symetrii. Testy powrotu do sportu.",
        goals: "Siła ≥85% symetrii\nBezbolesny bieg\nYBalance Test ≥90% symetrii\nSingle-leg hop test ≥85% symetrii",
        duration_weeks: 8,
        template_name: "Profilaktyka urazów sportowych – kończyna dolna",
      },
      {
        order: 5,
        name: "Faza 5 — Powrót do sportu (tydzień 21–24)",
        description: "Pełny powrót do specyfiki sportowej. Testy kwalifikacyjne powrotu do sportu. Profilaktyka nawrotu urazu.",
        goals: "Siła ≥90% symetrii\nWszystkie testy powrotu do sportu pozytywne\nBezbolesny udział w treningach drużynowych\nEdukacja pacjenta — profilaktyka re-urazu",
        duration_weeks: 4,
        template_name: "Profilaktyka urazów sportowych – kończyna dolna",
      },
    ],
  },

  {
    protocol: {
      name: "Protokół rehabilitacji barku po artroskopii",
      description: "12-tygodniowy protokół rehabilitacji po artroskopii barku (rekonstrukcja stożka rotatorów, SLAP, stabilizacja). Stopniowe przywracanie zakresu ruchu, siły i funkcji.",
      indication: "Artroskopia barku: rekonstrukcja stożka rotatorów (częściowa lub pełna), naprawa SLAP, kapsulorafta (stabilizacja niestabilności). Może być stosowany po konwatywnym leczeniu niestabilności.",
      total_weeks: 12,
      body_part: "Bark",
    },
    phases: [
      {
        order: 1,
        name: "Faza 1 — Ochronna (tydzień 1–3)",
        description: "Ramię w chuście/ortezie. Wahadło Codmana, aktywna asysta z kijem. Unikanie rotacji zewnętrznej i unoszenia powyżej 90° przez pierwsze 3 tygodnie.",
        goals: "Kontrola bólu i obrzęku\nZgięcie pasywne do 90°, rotacja zewnętrzna do 0–30° (wg wskazań chirurga)\nAktywacja mięśni łopatki — shrug i retrakcja\nEdukacja pacjenta — pozycje ochronne",
        duration_weeks: 3,
        template_name: "Rehabilitacja barku – faza wczesna",
      },
      {
        order: 2,
        name: "Faza 2 — Aktywna mobilizacja (tydzień 4–6)",
        description: "Rezygnacja z chuśty w ciągu dnia. Pełny pasywny zakres ruchu. Aktywna praca stożka rotatorów z gumą przy ciele. Stabilizacja łopatki.",
        goals: "Pełny pasywny zakres ruchu\nAktywna rotacja zewnętrzna 0–45°\nAktywacja serratus anterior (Push-up Plus)\nBez bólu przy czynnościach codziennych",
        duration_weeks: 3,
        template_name: "Rehabilitacja barku – faza wczesna",
      },
      {
        order: 3,
        name: "Faza 3 — Siła stożka rotatorów (tydzień 7–10)",
        description: "Progresja siły mięśniowej — stożek rotatorów, środkowy i dolny trapez, serratus anterior. Ćwiczenia w pełnym zakresie. Scaption, W-Y-T.",
        goals: "Siła rotacji zewnętrznej ≥70% strony przeciwnej\nPełny aktywny zakres ruchu\nBezbolesne uniesienie ramienia nad głowę\nFunkcja: czesanie, sięganie do półki",
        duration_weeks: 4,
        template_name: "Rehabilitacja barku – faza siłowa",
      },
      {
        order: 4,
        name: "Faza 4 — Powrót do aktywności (tydzień 11–12)",
        description: "Pełna siła mięśniowa, powrót do aktywności zawodowych i rekreacyjnych. Ćwiczenia sportowo-specyficzne. Profilaktyka nawrotu.",
        goals: "Siła ≥90% strony przeciwnej\nBezbolesna aktywność ponad głową\nPowrót do sportu / pracy fizycznej\nEdukacja — profilaktyka i ergonomia",
        duration_weeks: 2,
        template_name: "Rehabilitacja barku – faza siłowa",
      },
    ],
  },

  {
    protocol: {
      name: "Protokół rehabilitacji po endoprotezie stawu (TKA/THA)",
      description: "12-tygodniowy protokół rehabilitacji po alloplastyce stawu kolanowego (TKA) lub biodrowego (THA). Bezpieczny powrót do samodzielnego funkcjonowania i aktywności.",
      indication: "Całkowita alloplastyka stawu kolanowego (TKA) lub biodrowego (THA) z powodu zaawansowanej artrozy lub RZS. Stosować zgodnie z ograniczeniami ruchowymi ustalonymi przez chirurga.",
      total_weeks: 12,
      body_part: "Biodro",
    },
    phases: [
      {
        order: 1,
        name: "Faza 1 — Szpitalna i wczesna domowa (tydzień 1–2)",
        description: "Wczesna mobilizacja pooperacyjna — wstawanie z łóżka, chód z balkonnikiem/kulami. Profilaktyka przeciwzakrzepowa. Ćwiczenia oddechowe i izometria.",
        goals: "Samodzielne wstawanie z łóżka\nChód z pomocą (balkonik / kule)\nProfilaktyka zakrzepicy (ćwiczenia pumpingowe stopy)\nKontrola bólu pooperacyjnego",
        duration_weeks: 2,
        template_name: "Rehabilitacja biodra po endoprotezie (THA)",
      },
      {
        order: 2,
        name: "Faza 2 — Ambulatoryjna — poprawa chodu (tydzień 3–6)",
        description: "Odejście od balkonika, przejście na kule łokciowe. Poprawa wzorca chodu, zakres ruchu, wzmacnianie mięśni pośladkowych i czworogłowych.",
        goals: "Chód z jedną kulą lub bez kul (THA: przestrzeganie ograniczeń biodrowych)\nZgięcie stawu ≥90° (TKA) / 100° (THA)\nWchodzenie i schodzenie ze schodów\nSamodzielna opieka własna",
        duration_weeks: 4,
        template_name: "Rehabilitacja biodra po endoprotezie (THA)",
      },
      {
        order: 3,
        name: "Faza 3 — Wzmacnianie funkcjonalne (tydzień 7–10)",
        description: "Progresja siły kończyny operowanej. Step up/down, mostki, propriocepcja. Zwiększanie dystansu marszu. Powrót do jazdy samochodem (po konsultacji).",
        goals: "Symetria chodu bez utykania\nWchodzenie po schodach naprzemiennie\nSiła kończyny operowanej ≥70% zdrowej\nPowrót do jazdy samochodem",
        duration_weeks: 4,
        template_name: "Rehabilitacja kolana po ACL – faza siłowa",
      },
      {
        order: 4,
        name: "Faza 4 — Pełna aktywność (tydzień 11–12)",
        description: "Powrót do aktywności codziennych i rekreacyjnych. Pływanie, rower stacjonarny, Nordic walking. Edukacja i długoterminowa opieka nad protezą.",
        goals: "Samodzielne funkcjonowanie bez pomocy\nAktywność rekreacyjna niska-umiarkowana intensywność\nEdukacja — opieka nad protezą, kiedy dzwonić do lekarza\nProfilaktyka upadków",
        duration_weeks: 2,
        template_name: "Profilaktyka urazów sportowych – kończyna dolna",
      },
    ],
  },
]

// ─── HELPERS ─────────────────────────────────────────────────────────────────

async function upsertSurvey({ survey, questions }) {
  const { data: existing } = await supabase
    .from("surveys")
    .select("id")
    .eq("name", survey.name)
    .is("practitioner_id", null)
    .maybeSingle()

  if (existing) {
    console.log(`  ⏭  skip survey: ${survey.name}`)
    return
  }

  const { data, error } = await supabase
    .from("surveys")
    .insert({ ...survey, is_public: true, practitioner_id: null })
    .select("id")
    .single()

  if (error) { console.error(`  ✗  ${survey.name}:`, error.message); return }

  const items = questions.map(q => ({
    survey_id: data.id,
    order: q.order,
    question: q.question,
    type: q.type,
    options: q.options ? JSON.stringify(q.options) : null,
    min_label: q.min_label ?? null,
    max_label: q.max_label ?? null,
    min_value: q.min_value ?? 0,
    max_value: q.max_value ?? 10,
  }))

  const { error: qErr } = await supabase.from("survey_questions").insert(items)
  if (qErr) console.error(`  ✗  pytania dla ${survey.name}:`, qErr.message)
  else console.log(`  ✓  ${survey.name} (${questions.length} pytań)`)
}

async function upsertProtocol({ protocol, phases }) {
  const { data: existing } = await supabase
    .from("rehabilitation_protocols")
    .select("id")
    .eq("name", protocol.name)
    .is("practitioner_id", null)
    .maybeSingle()

  if (existing) {
    console.log(`  ⏭  skip protocol: ${protocol.name}`)
    return
  }

  const { data, error } = await supabase
    .from("rehabilitation_protocols")
    .insert({ ...protocol, is_public: true, practitioner_id: null })
    .select("id")
    .single()

  if (error) { console.error(`  ✗  ${protocol.name}:`, error.message); return }

  console.log(`  ✓  protocol: ${protocol.name}`)

  for (const phase of phases) {
    // look up template_id if specified
    let templateId = null
    if (phase.template_name) {
      const { data: tmpl } = await supabase
        .from("program_templates")
        .select("id")
        .eq("name", phase.template_name)
        .maybeSingle()
      templateId = tmpl?.id ?? null
      if (!templateId) console.warn(`     ⚠  template not found: ${phase.template_name}`)
    }

    const { error: phErr } = await supabase.from("protocol_phases").insert({
      protocol_id: data.id,
      order: phase.order,
      name: phase.name,
      description: phase.description,
      goals: phase.goals,
      duration_weeks: phase.duration_weeks,
      template_id: templateId,
    })

    if (phErr) console.error(`     ✗  faza "${phase.name}":`, phErr.message)
    else console.log(`     → faza ${phase.order}: ${phase.name} (${phase.duration_weeks} tyg.)${templateId ? " ✓ szablon" : ""}`)
  }
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Seeding dodatkowe kwestionariusze (5) ===")
  for (const s of surveys) await upsertSurvey(s)

  console.log("\n=== Seeding protokoły rehabilitacyjne (3) ===")
  for (const p of protocols) await upsertProtocol(p)

  console.log("\nGotowe!")
}

main().catch(console.error)
