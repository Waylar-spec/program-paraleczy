# Program.paraleczy — Mapa projektu

## Czym jest ten projekt

Platforma dla fizjoterapeutów (Para Leczy / Mgr Wojciech Dymek) wzorowana na Physitrack.
Dwa główne wyróżniki względem Physitrack:

1. **Przypisywanie gotowych ćwiczeń / szablonów / PDFów** do pacjenta na określony czas
2. **Programy rehabilitacyjne** — wielofazowe protokoły (np. "Powrót po operacji ACL") z pełnym opisem,
   do których można podpiąć pacjenta i śledzić postęp fazami

---

## Stack technologiczny

### Backend
- **Runtime:** Node.js 20 LTS
- **Framework:** Hono (szybki, edge-ready, świetne TypeScript DX)
- **Baza danych:** PostgreSQL 16 via Supabase (auth, storage, realtime wbudowane)
- **ORM:** Drizzle ORM (type-safe, blisko SQL, szybkie migracje)
- **Auth:** Supabase Auth (JWT, RLS na poziomie bazy)
- **File storage:** Supabase Storage (wideo ćwiczeń, PDFy, zdjęcia)
- **Background jobs:** pg_cron lub Trigger.dev (przypomnienia, powiadomienia)

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Język:** TypeScript
- **Style:** Tailwind CSS 4 + shadcn/ui
- **State:** Zustand (klient) + React Query / TanStack Query (server state)
- **Formularze:** React Hook Form + Zod
- **Tabele/listy:** TanStack Table
- **Drag & drop:** dnd-kit (edytor programów)
- **PDF generowanie:** react-pdf lub Puppeteer (karta domowa ćwiczeń)
- **Wideo player:** Video.js lub natywny HTML5

### Komunikacja realtime
- **Supabase Realtime** — czat klinicysta ↔ pacjent, obecność online
- **Push notyfikacje:** Web Push API + service worker

### Telemedycyna (faza 2)
- **Daily.co** lub **Livekit** — wideo rozmowy klinicysta-pacjent

### Hosting / Infrastruktura
- **Frontend + API:** Vercel (Next.js natywnie)
- **Baza:** Supabase (managed Postgres)
- **CDN / Storage:** Supabase Storage + Cloudflare CDN

### Narzędzia dev
- **Monorepo:** pnpm workspaces
- **Linting:** ESLint + Prettier
- **Testing:** Vitest (unit) + Playwright (e2e)
- **CI/CD:** GitHub Actions → Vercel

---

## Architektura modułów

```
program.paraleczy/
├── apps/
│   ├── web/          # Next.js — panel klinicysty
│   └── patient/      # Next.js — panel pacjenta (lub osobna subdomena)
├── packages/
│   ├── db/           # Drizzle schema + migracje
│   ├── ui/           # Wspólne komponenty (shadcn)
│   └── shared/       # Typy TypeScript, walidacja Zod
└── CLAUDE.md
```

---

## Mapa funkcji — co budujemy

### MODUŁ 1: Biblioteka treści

#### 1a. Ćwiczenia
- [ ] Przeglądarka ćwiczeń (grid/lista, wyszukiwarka, filtry)
- [ ] Filtry: staw/okolica ciała, trudność, źródło (moje / gotowe)
- [ ] Ulubione ćwiczenia (gwiazdka)
- [ ] Dodawanie własnego ćwiczenia (nazwa, opis, wideo upload, zdjęcie, parametry domyślne)
- [ ] Edycja ćwiczenia
- [ ] Parametry ćwiczenia: serie, powtórzenia, czas trwania, strona (lewa/prawa), przerwa, notatka

#### 1b. Szablony programów
- [ ] Przeglądarka szablonów (własne + gotowe kliniczne)
- [ ] Tworzenie szablonu z ćwiczeń
- [ ] Zapis programu jako szablon
- [ ] Filtry szablonów: staw, autor, ulubione

#### 1c. Edukacja (PDFy i wideo)
- [ ] Upload PDFów edukacyjnych (np. "Ergonomia w pracy", "Ból przewlekły")
- [ ] Przeglądarka materiałów edukacyjnych
- [ ] Przypisywanie materiałów do programu

#### 1d. Kwestionariusze (PROMs)
- [ ] Biblioteka kwestionariuszy (VAS, Oswestry, Oxford Knee, DASH, własne)
- [ ] Tworzenie własnego kwestionariusza
- [ ] Przypisywanie kwestionariusza do programu (harmonogram: start, koniec, co tydzień)

---

### MODUŁ 2: Edytor programów

- [ ] Drag & drop builder — dodawanie ćwiczeń, PDFów, kwestionariuszy
- [ ] Ustawianie parametrów per-ćwiczenie (serie, reps, itd.)
- [ ] Notatka do ćwiczenia (dla pacjenta)
- [ ] Podgląd programu (widok pacjenta)
- [ ] Zapis programu jako szablon
- [ ] Generowanie PDF / karty domowej ćwiczeń
- [ ] QR kod do dostępu bez logowania (EasyLink-style)

---

### MODUŁ 3: Pacjenci

#### 3a. Lista pacjentów
- [ ] Tabela: imię, rok urodzenia, aktywny program, data końca, status komunikacji
- [ ] Sortowanie i wyszukiwanie
- [ ] Filtry: wszyscy / aktywni / zakończeni
- [ ] Dodawanie nowego pacjenta (imię, nazwisko, e-mail, telefon, rok urodzenia, płeć, notatki)

#### 3b. Profil pacjenta
- [ ] Dane podstawowe + "ostatnio widziany"
- [ ] Lista przypisanych programów (aktywne + historia)
- [ ] Przypisz nowy program (modal: dodaj kolejny / zakończ aktywne)
- [ ] Skopiuj link do logowania pacjenta
- [ ] Pobierz dane pacjenta (CSV/PDF)
- [ ] Edytuj dane pacjenta

#### 3c. Podgląd programu pacjenta
- [ ] Zakładka "Współpraca z programem" — adherence (% wykonanych ćwiczeń), wykres bólu
- [ ] Zakładka "Miary wyników" — wyniki kwestionariuszy w czasie
- [ ] Zakładka "Porównania" — porównanie między programami
- [ ] Alerty: niskie zaangażowanie, wysoki ból, niewypełniony kwestionariusz

#### 3d. Raport pacjentów
- [ ] Niewypełnione kwestionariusze (imię, nazwa, liczba pominiętych, data)
- [ ] Nieotwarte treści edukacyjne
- [ ] Niskie zaangażowanie
- [ ] Export CSV

---

### MODUŁ 4: Programy rehabilitacyjne ⭐ (wyróżnik)

> To jest nasz główny wyróżnik względem Physitrack.
> "Program" = wielofazowy protokół kliniczny z pełnym opisem powrotu do zdrowia.
> Np. "Powrót po operacji ACL" składa się z faz: Faza 1 (tydzień 1-2), Faza 2 (tydzień 3-6), itd.
> Klinicysta podpina pacjenta do programu i śledzi przez które fazy przechodzi.

- [ ] Tworzenie programu rehabilitacyjnego (nazwa, opis, czas trwania, wskazania)
- [ ] Dodawanie faz do programu (nazwa fazy, czas trwania w tygodniach, opis)
- [ ] Przypisywanie szablonów ćwiczeń do każdej fazy
- [ ] Dołączanie PDFów edukacyjnych i kwestionariuszy do faz
- [ ] Biblioteka programów (własne + gotowe — ACL, endoproteza kolana, bark, kręgosłup, itd.)
- [ ] Podpięcie pacjenta do programu → automatyczne przechodzenie przez fazy
- [ ] Widok postępu pacjenta w programie (która faza, adherence, ból)
- [ ] Możliwość ręcznego przesunięcia pacjenta do następnej/poprzedniej fazy
- [ ] Komentarze/notatki klinicysty per faza

---

### MODUŁ 5: Komunikacja

- [ ] Czat klinicysta ↔ pacjent (Supabase Realtime)
- [ ] Licznik nieprzeczytanych wiadomości
- [ ] Push notyfikacje dla pacjenta (przypomnienia o ćwiczeniach)
- [ ] Alerty dla klinicysty (wysoki ból, brak aktywności, wiadomość)
- [ ] Ustawienia powiadomień (e-mail / push, progi)

---

### MODUŁ 6: Telemedycyna (Faza 2)

- [ ] Wideo rozmowa 1:1 klinicysta-pacjent
- [ ] Rejestr połączeń (data, czas trwania)
- [ ] Ustawienia: czy pacjent może inicjować rozmowę
- [ ] Szablon e-maila z zaproszeniem do rozmowy

---

### MODUŁ 7: Ustawienia konta

- [ ] Moja praktyka (nazwa, adres, logo, strona www)
- [ ] Udostępnianie (dodaj współpracownika, dziel ćwiczenia/pacjentów/szablony)
- [ ] Powiadomienia (preferencje e-mail/push, progi)
- [ ] Integracje (API klucze)
- [ ] 2FA
- [ ] Subskrypcja / billing

---

### MODUŁ 8: Aplikacja pacjenta

- [ ] Logowanie kodem dostępu (8 znaków) lub linkiem
- [ ] Lista aktywnych programów
- [ ] Odtwarzanie ćwiczeń (wideo/zdjęcia, timer, serie/reps)
- [ ] Raportowanie bólu po sesji
- [ ] Zaznaczanie ćwiczeń jako wykonane
- [ ] Wypełnianie kwestionariuszy
- [ ] Przeglądanie materiałów edukacyjnych (PDFy)
- [ ] Czat z fizjoterapeutą
- [ ] Widok postępu (streak, adherence)

---

## Kolejność developmentu (priorytety)

### Sprint 1 — Fundament
1. Setup monorepo (pnpm + Next.js + Supabase + Drizzle)
2. Auth (logowanie klinicysty)
3. Schema bazy danych (users, patients, exercises, programs, templates)
4. CRUD ćwiczeń (biblioteka + dodawanie własnych)
5. CRUD pacjentów

### Sprint 2 — Core flow
6. Edytor programów (drag & drop)
7. Szablony programów
8. Przypisywanie programu do pacjenta
9. Aplikacja pacjenta (basic — kod dostępu, lista ćwiczeń, timer)
10. Adherence tracking

### Sprint 3 — Programy rehabilitacyjne ⭐
11. CRUD programów wielofazowych
12. Podpięcie pacjenta do programu
13. Automatyczne przejścia faz
14. Widok postępu klinicysty

### Sprint 4 — Raportowanie i komunikacja
15. PROMs (kwestionariusze)
16. Raporty adherence, ból, wyniki
17. Czat realtime
18. Push notyfikacje

### Sprint 5 — Polish + Telemedycyna
19. Generowanie PDF karty domowej
20. QR kod dostępu
21. Telemedycyna (wideo rozmowy)
22. Billing / subskrypcje

---

## Baza danych — główne encje (szkic)

```
users (klinicyści)
patients (powiązani z user_id)
exercises (globalne + własne per user)
exercise_programs (szablony programów)
exercise_program_items (ćwiczenia w szablonie + parametry)
patient_programs (przypisanie szablonu do pacjenta + daty)
patient_program_sessions (sesje ćwiczeń pacjenta)
patient_exercise_logs (wykonane ćwiczenia + ból)
rehabilitation_protocols (programy wielofazowe ⭐)
protocol_phases (fazy protokołu)
protocol_phase_templates (szablony ćwiczeń per faza)
patient_protocols (pacjent podpięty do protokołu)
educational_content (PDFy, wideo)
surveys (kwestionariusze)
survey_questions
patient_survey_responses
messages (czat)
```

---

## Zmienne środowiskowe (szablon .env)

```
DATABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=
NEXT_PUBLIC_APP_URL=
```

---

## Ważne decyzje projektowe

- Aplikacja pacjenta = **oddzielna subdomena** `pacjent.paraleczy.pl` lub ścieżka `/p/[code]`
- Pacjent loguje się **kodem 8-znakowym** (bez konieczności rejestracji)
- Klinicysta może mieć **wielu współpracowników** — wspólna lista pacjentów i szablonów
- Programy wielofazowe to nasz **wyróżnik #1** — priorytet w designie i UX
- Wszystko **po polsku** w UI (docelowo możliwość zmiany języka)
