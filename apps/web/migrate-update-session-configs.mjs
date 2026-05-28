import pg from '/Users/wojciechdymek/Documents/Local Sites/Program.paraleczy/node_modules/.pnpm/pg@8.20.0/node_modules/pg/lib/index.js'
const { Client } = pg

const client = new Client({
  connectionString: 'postgresql://postgres.xehgkblqiixwhnhjupuv:VUYeoo9AdgdCTDH3@aws-0-eu-west-1.pooler.supabase.com:6543/postgres'
})

await client.connect()

const runningConfig = {
  color: 'emerald',
  totalMinutes: 23,
  steps: [
    'Marsz 5 min — rozgrzewka, spokojne tempo',
    'Lekki trucht 1 min → marsz 2 min — powtórz 5 razy',
    'Marsz 5 min — schłodzenie',
    'Oddychaj swobodnie przez cały czas — jeśli nie możesz mówić zdań, zwolnij',
    'Ląduj na śródstopiu, nie na pięcie',
  ]
}

const aerobicConfig = {
  color: 'sky',
  totalMinutes: 30,
  steps: [
    'Wybierz aktywność: rower stacjonarny, pływanie, marsz, ergometr wioślarski',
    '5 min — rozgrzewka, bardzo spokojne tempo',
    '20 min — stałe, umiarkowane tempo (strefa 2: możliwość swobodnej rozmowy)',
    '5 min — schłodzenie, zmniejsz tempo',
    'Tętno docelowe: 50–70% HRmax',
  ]
}

await client.query(
  `UPDATE exercises SET running_config = $1 WHERE name = 'Stopniowy powrót do biegania' AND is_public = true`,
  [JSON.stringify(runningConfig)]
)
console.log('✅ Updated "Stopniowy powrót do biegania"')

await client.query(
  `UPDATE exercises SET running_config = $1 WHERE name = 'Ćwiczenia aerobowe' AND is_public = true`,
  [JSON.stringify(aerobicConfig)]
)
console.log('✅ Updated "Ćwiczenia aerobowe"')

await client.end()
