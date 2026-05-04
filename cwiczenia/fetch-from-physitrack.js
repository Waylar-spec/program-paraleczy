#!/usr/bin/env node
// Skrypt pobierający ćwiczenia z Physitrack Typesense API
// Uruchom: node fetch-from-physitrack.js

const API_KEY = 'Y2l3VGU4R3U5dGh1NHFwZmNQeUxVWHlpRkZVbmNsR3pnUWdsQ292NGlOYz1Bc0dKeyJmaWx0ZXJfYnkiOiJwcm92aWRlcl9pZHM6WzMzNzM3LCAtMV0iLCJleGNsdWRlX2ZpZWxkcyI6InByb3ZpZGVyX2lkcyxmYXZvdXJpdGVkX2J5LHNoYXJlZF9mYXZvdXJpdGVkX2J5LHBhdGllbnRfaWQsZmF2b3VyaXRlZF9jb3VudCIsImluY2x1ZGVfZmllbGRzIjoibmFtZV9wbCxuYW1lX2VuLGlkLGNyZWF0ZWRfYXQsYW5pbWF0ZWRfdGh1bWJuYWlsX3VybCx0aHVtYm5haWxfdXJsLGRpZmZpY3VsdHksYXV0aG9yX2luaXRpYWxzLGhhc19saW5lX2RyYXdpbmcsdmlkZW9fdXJsLHN5c3RlbSxvcmlnaW5hbF9pZCxsb2NhbGVzIn0=';
const COLLECTION = 'exercises_production_pl';
const HOST = 'search-pl.physitrack.com';

// Wszystkie ćwiczenia z FizjoDesk Guide v2
const EXERCISES = [
  // A1 — Stożek rotatorów
  { group: 'stożek_rotatorów', name_pl: 'ER izometryczna (ściana, 0°)', en: 'external rotation isometric wall', params: '3×10 pow., 10s hold', frequency: 'codziennie' },
  { group: 'stożek_rotatorów', name_pl: 'ER izometryczna (90° odwiedzenia)', en: 'isometric shoulder external rotation 90 abduction', params: '3×10 pow., 10s hold', frequency: 'co 2. dzień' },
  { group: 'stożek_rotatorów', name_pl: 'IR izometryczna (ściana)', en: 'internal rotation isometric wall shoulder', params: '3×10 pow., 10s hold', frequency: 'codziennie' },
  { group: 'stożek_rotatorów', name_pl: 'ER ekscentryczna z gumą (slow lowering)', en: 'eccentric external rotation band slow lowering', params: '3×12 pow., 3s lowering', frequency: 'co 2. dzień' },
  { group: 'stożek_rotatorów', name_pl: 'Side-lying ER z obciążeniem (progresja)', en: 'side lying external rotation weight', params: '3×12 pow., 2s hold', frequency: 'co 2. dzień' },
  { group: 'stożek_rotatorów', name_pl: 'ER w 90° odwiedzenia (L-position) z gumą', en: 'external rotation 90 degrees L position band', params: '3×10 pow.', frequency: 'co 2. dzień' },
  { group: 'stożek_rotatorów', name_pl: 'Diagonal PNF D1 (z gumą)', en: 'PNF D1 diagonal shoulder band', params: '3×10/str.', frequency: 'co 2. dzień' },
  { group: 'stożek_rotatorów', name_pl: 'Diagonal PNF D2 (z gumą)', en: 'PNF D2 diagonal shoulder band', params: '3×10/str.', frequency: 'co 2. dzień' },
  { group: 'stożek_rotatorów', name_pl: 'Full Can (pełna puszka — 30° elewacja)', en: 'full can exercise scaption elevation', params: '3×12 pow., 2s hold', frequency: 'co 2. dzień' },
  { group: 'stożek_rotatorów', name_pl: 'Prone Row z ER (bent-over)', en: 'prone row external rotation', params: '3×12 pow., 2s hold', frequency: 'co 2. dzień' },
  // A2 — Ostroga piętowa / Plantar Fasciitis
  { group: 'ostroga_piętowa', name_pl: 'Plantar Fascia Stretch — palce cofnięte (stojąc)', en: 'plantar fascia stretch standing toes extended', params: '3×30s/str.', frequency: 'rano (przed wstaniem)' },
  { group: 'ostroga_piętowa', name_pl: 'Plantar Fascia Stretch — przez butelkę z lodem', en: 'plantar fascia stretch ice bottle', params: '1×5 min/str.', frequency: 'po aktywności' },
  { group: 'ostroga_piętowa', name_pl: 'Toe Curl (zwijanie palców — ręcznik)', en: 'towel toe curl', params: '3×20s', frequency: 'codziennie' },
  { group: 'ostroga_piętowa', name_pl: 'Short Foot Exercise (skrócenie stopy)', en: 'short foot exercise', params: '3×12 pow., 5s hold', frequency: 'codziennie' },
  { group: 'ostroga_piętowa', name_pl: 'Eccentric Calf Lower na schodku', en: 'eccentric calf lower step decline', params: '3×15 pow., 3s lowering', frequency: '2×/dzień' },
  { group: 'ostroga_piętowa', name_pl: 'Single-leg Calf Raise progresja', en: 'single leg calf raise progression', params: '3×15/str.', frequency: 'co 2. dzień' },
  { group: 'ostroga_piętowa', name_pl: 'Toe Splay (rozstawianie palców)', en: 'toe splay', params: '3×10 pow., 3s hold', frequency: 'codziennie' },
  { group: 'ostroga_piętowa', name_pl: 'Rolling piłką golfową (masaż rozcięgna)', en: 'golf ball rolling plantar fascia massage', params: '1×3-5 min/str.', frequency: 'rano i wieczór' },
  { group: 'ostroga_piętowa', name_pl: 'Marble Pickup (palce podnoszą kulki)', en: 'marble pickup toes', params: '3×10 pow./str.', frequency: 'codziennie' },
  { group: 'ostroga_piętowa', name_pl: 'Intrinsic foot strengthening (theraband palce)', en: 'intrinsic foot strengthening theraband toes', params: '3×15 pow.', frequency: 'co 2. dzień' },
  // A3 — Hiperlordoza lędźwiowa
  { group: 'hiperlordoza', name_pl: 'Posterior Pelvic Tilt (leżenie, spłaszczanie LS)', en: 'posterior pelvic tilt supine', params: '3×15 pow., 5s hold', frequency: 'codziennie' },
  { group: 'hiperlordoza', name_pl: 'Mostek z tylnym pochyleniem miednicy', en: 'bridge posterior pelvic tilt', params: '3×15 pow., 3s hold', frequency: 'codziennie' },
  { group: 'hiperlordoza', name_pl: 'Hip Flexor Stretch (wykrok klęczny, pogłębiony)', en: 'hip flexor stretch kneeling lunge deep', params: '3×45s/str.', frequency: 'codziennie' },
  { group: 'hiperlordoza', name_pl: 'Rozciąganie prostownika grzbietu (child pose)', en: "child's pose back extension stretch", params: '3×45s', frequency: 'codziennie' },
  { group: 'hiperlordoza', name_pl: 'Dead Bug (nacisk na PPT)', en: 'dead bug posterior pelvic tilt', params: '3×8/str.', frequency: 'codziennie' },
  { group: 'hiperlordoza', name_pl: 'Hollow Body Hold', en: 'hollow body hold', params: '3×20s', frequency: 'codziennie' },
  { group: 'hiperlordoza', name_pl: 'McGill Curl-up (flexja bez zgięcia LS)', en: 'McGill curl up', params: '3×10 pow., 10s hold', frequency: 'codziennie' },
  { group: 'hiperlordoza', name_pl: 'Wall Squat z PPT (plecy przy ścianie)', en: 'wall squat posterior pelvic tilt', params: '3×12 pow.', frequency: 'co 2. dzień' },
  { group: 'hiperlordoza', name_pl: 'Plank z neutralizacją miednicy', en: 'plank neutral pelvis', params: '3×25s', frequency: 'codziennie' },
  { group: 'hiperlordoza', name_pl: 'Standing Hip Flexor Stretch (aktywny)', en: 'standing hip flexor stretch active', params: '3×30s/str.', frequency: 'codziennie' },
  { group: 'hiperlordoza', name_pl: 'Psoas Release na wałku (pasywne rolowanie)', en: 'foam roller psoas release', params: '1×60s/str.', frequency: 'codziennie' },
  // A4 — Skolioza
  { group: 'skolioza', name_pl: 'Muscular Cylinder (wydłużanie osiowe — stanie)', en: 'muscular cylinder axial elongation Schroth standing', params: '3×5 odd., 10s hold', frequency: 'codziennie', manual_add_required: true },
  { group: 'skolioza', name_pl: 'Passive Correction w leżeniu na boku (strona wypukła)', en: 'side lying passive correction scoliosis', params: '1×5-10 min', frequency: 'codziennie' },
  { group: 'skolioza', name_pl: 'Rotational Angular Breathing (RAB)', en: 'rotational angular breathing Schroth scoliosis', params: '3×5 wdechów', frequency: 'codziennie' },
  { group: 'skolioza', name_pl: 'Asymetryczne rozciąganie (strona wklęsła)', en: 'asymmetric stretch scoliosis concave', params: '3×30s', frequency: 'codziennie' },
  { group: 'skolioza', name_pl: 'Side Plank — po stronie wklęsłej (dłużej)', en: 'side plank', params: '3×20s (wkł.) / 10s (wyp.)', frequency: 'codziennie' },
  { group: 'skolioza', name_pl: 'Cat-Cow z rotacją (derotacja)', en: 'cat cow rotation derotation', params: '3×10 pow.', frequency: 'codziennie' },
  { group: 'skolioza', name_pl: 'Bird-Dog asymetryczny (strona wklęsła górna)', en: 'bird dog asymmetric', params: '3×10/str., 3s hold', frequency: 'co 2. dzień' },
  { group: 'skolioza', name_pl: 'Seated elongation (siedzenie z elongacją)', en: 'seated elongation scoliosis', params: '3×5 oddechów, 10s hold', frequency: 'codziennie' },
  { group: 'skolioza', name_pl: 'Ćwiczenie "Łuk" (bow exercise — Schroth)', en: 'bow exercise Schroth scoliosis', params: '3×5 pow., 10s hold', frequency: 'codziennie' },
  { group: 'skolioza', name_pl: 'Plank z korekcją tułowia', en: 'plank trunk correction', params: '3×20s', frequency: 'co 2. dzień' },
  // A5 — Ból łokcia
  { group: 'ból_łokcia', name_pl: 'Wrist Extension Stretch (rozciąganie prostowników)', en: 'wrist extension stretch', params: '3×30s/str.', frequency: 'codziennie' },
  { group: 'ból_łokcia', name_pl: 'Wrist Flexion Stretch (rozciąganie zginaczy)', en: 'wrist flexion stretch', params: '3×30s/str.', frequency: 'codziennie' },
  { group: 'ból_łokcia', name_pl: 'Eccentric Wrist Extension (Tyler Twist / Therabar)', en: 'eccentric wrist extension Tyler Twist therabar', params: '3×15 pow., 3s lowering', frequency: '2×/dzień' },
  { group: 'ból_łokcia', name_pl: 'Eccentric Wrist Flexion (golfista)', en: 'eccentric wrist flexion golfer elbow', params: '3×15 pow., 3s lowering', frequency: '2×/dzień' },
  { group: 'ból_łokcia', name_pl: 'Wrist Extension izometryczna', en: 'wrist extension isometric', params: '5×45s', frequency: 'codziennie' },
  { group: 'ból_łokcia', name_pl: 'Wrist Flexion izometryczna', en: 'wrist flexion isometric', params: '5×45s', frequency: 'codziennie' },
  { group: 'ból_łokcia', name_pl: 'Forearm Pronation/Supination z obciążeniem', en: 'forearm pronation supination weight', params: '3×15/kier.', frequency: 'co 2. dzień' },
  { group: 'ból_łokcia', name_pl: 'Grip Strengthening (piłka/expander)', en: 'grip strengthening ball', params: '3×15 pow., 2s hold', frequency: 'codziennie' },
  { group: 'ból_łokcia', name_pl: 'Finger Extension (gumka na palcach)', en: 'finger extension rubber band', params: '3×15 pow.', frequency: 'codziennie' },
  { group: 'ból_łokcia', name_pl: 'Elbow Flexion/Extension (bez obciążenia — ROM)', en: 'elbow flexion extension range of motion', params: '3×10 pow.', frequency: 'codziennie' },
  { group: 'ból_łokcia', name_pl: 'Scapular stabilization (wpływa na łokieć)', en: 'scapular stabilization', params: '3×12 pow., 3s hold', frequency: 'co 2. dzień' },
  { group: 'ból_łokcia', name_pl: 'Neural mobilization — Radial Nerve (neurodynamika)', en: 'radial nerve mobilization neural', params: '3×10/str.', frequency: 'codziennie' },
  // A6 — Gonarthroza
  { group: 'gonarthroza', name_pl: 'Quad Set izometryczny (różne kąty)', en: 'quad set isometric quadriceps', params: '3×10 pow., 10s hold', frequency: 'codziennie' },
  { group: 'gonarthroza', name_pl: 'SLR z obciążeniem (progresja)', en: 'straight leg raise weight quadriceps', params: '3×12 pow.', frequency: 'codziennie' },
  { group: 'gonarthroza', name_pl: 'Short Arc Quad (SAQ — zakres 0-30°)', en: 'short arc quad', params: '3×15 pow.', frequency: 'codziennie' },
  { group: 'gonarthroza', name_pl: 'Mini Squat (0-45°)', en: 'mini squat knee', params: '3×15 pow.', frequency: 'co 2. dzień' },
  { group: 'gonarthroza', name_pl: 'Chair Stand (sit-to-stand)', en: 'sit to stand chair', params: '3×10 pow.', frequency: 'codziennie' },
  { group: 'gonarthroza', name_pl: 'Step Up 10cm (niski stopień)', en: 'step up low step knee', params: '3×12/str.', frequency: 'co 2. dzień' },
  { group: 'gonarthroza', name_pl: 'Clamshell z gumą (siła abduktorów biodra)', en: 'clamshell resistance band hip abductor', params: '3×15/str.', frequency: 'codziennie' },
  { group: 'gonarthroza', name_pl: 'Hip Abduction stojąc (odciążenie kolana)', en: 'hip abduction standing', params: '3×15/str.', frequency: 'co 2. dzień' },
  { group: 'gonarthroza', name_pl: 'Stationary Bike (niski opór)', en: 'stationary bike low resistance', params: '1×15-20 min', frequency: 'co 2. dzień' },
  { group: 'gonarthroza', name_pl: 'Water walking / pływanie (jeśli dostępne)', en: 'water walking aquatic therapy', params: '1×20-30 min', frequency: 'co 2. dzień' },
  // A7 — Menisk
  { group: 'menisk', name_pl: 'Quad Set', en: 'quad set static quadriceps', params: '3×10 pow., 10s hold', frequency: 'codziennie' },
  { group: 'menisk', name_pl: 'Heel Slide (zakres ruchu)', en: 'heel slide range of motion knee', params: '3×15 pow.', frequency: 'codziennie' },
  { group: 'menisk', name_pl: 'SLR', en: 'straight leg raise', params: '3×12 pow.', frequency: 'codziennie' },
  { group: 'menisk', name_pl: 'Terminal Knee Extension (TKE) z gumą', en: 'terminal knee extension band', params: '3×15 pow.', frequency: 'codziennie' },
  { group: 'menisk', name_pl: 'Mini Squat (ostrożnie — zakres do granicy bólu)', en: 'mini squat pain free', params: '3×12 pow.', frequency: 'co 2. dzień' },
  { group: 'menisk', name_pl: 'Step Up (10cm, bez bólu)', en: 'step up pain free meniscus', params: '3×10/str.', frequency: 'co 2. dzień' },
  { group: 'menisk', name_pl: 'Hamstring Curl (leżenie — bierne zginanie)', en: 'hamstring curl prone', params: '3×12 pow.', frequency: 'co 2. dzień' },
  { group: 'menisk', name_pl: 'Propriocepcja — stanie na jednej nodze', en: 'single leg balance proprioception', params: '3×20s/str.', frequency: 'codziennie' },
  { group: 'menisk', name_pl: 'Lateral Band Walk', en: 'lateral band walk', params: '3×10/str.', frequency: 'co 2. dzień' },
];

async function searchExercise(exercise) {
  const q = encodeURIComponent(exercise.en);
  const url = `https://${HOST}/collections/${COLLECTION}/documents/search?q=${q}&query_by=name_en,name_pl&per_page=3`;
  const res = await fetch(url, {
    headers: { 'x-typesense-api-key': API_KEY },
  });
  const data = await res.json();
  const best = data.hits?.[0]?.document ?? null;
  return {
    ...exercise,
    physitrack_id: best?.id ?? null,
    physitrack_name_en: best?.name_en ?? null,
    physitrack_name_pl: best?.name_pl ?? null,
    thumbnail_url: best?.thumbnail_url ?? null,
    video_url: best?.video_url ?? null,
    animated_gif_url: best?.animated_thumbnail_url ?? null,
    difficulty: best?.difficulty ?? null,
    locales: best?.locales ?? null,
    found_in_physitrack: !!best,
    manual_add_required: exercise.manual_add_required ?? !best,
  };
}

async function main() {
  const fs = await import('fs');
  const path = await import('path');
  const outDir = '/Users/wojciechdymek/Local Sites/Program.paraleczy/cwiczenia';

  console.log(`Searching ${EXERCISES.length} exercises in Physitrack...`);
  const results = [];
  for (const [i, ex] of EXERCISES.entries()) {
    const result = await searchExercise(ex);
    results.push(result);
    process.stdout.write(`\r${i + 1}/${EXERCISES.length} — ${ex.group}: ${ex.name_pl.substring(0, 40)}`);
  }
  console.log('\nDone!');

  // Save raw results
  const rawPath = path.join(outDir, 'fizjodesk_v2_physitrack_raw.json');
  fs.writeFileSync(rawPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`Saved raw data → ${rawPath}`);

  // Save grouped by category
  const grouped = {};
  for (const r of results) {
    if (!grouped[r.group]) grouped[r.group] = [];
    grouped[r.group].push(r);
  }
  const groupedPath = path.join(outDir, 'fizjodesk_v2_grouped.json');
  fs.writeFileSync(groupedPath, JSON.stringify(grouped, null, 2), 'utf8');
  console.log(`Saved grouped data → ${groupedPath}`);

  // Summary
  const found = results.filter(r => r.found_in_physitrack).length;
  const needManual = results.filter(r => r.manual_add_required).length;
  console.log(`\nPodsumowanie: ${found}/${results.length} znalezionych w Physitrack, ${needManual} do ręcznego dodania`);
  results.filter(r => r.manual_add_required).forEach(r => console.log(`  ⚠️  ${r.group}: ${r.name_pl}`));
}

main().catch(console.error);
