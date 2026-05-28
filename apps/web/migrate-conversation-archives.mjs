import pg from '/Users/wojciechdymek/Documents/Local Sites/Program.paraleczy/node_modules/.pnpm/pg@8.20.0/node_modules/pg/lib/index.js'
const { Client } = pg

const client = new Client({
  connectionString: 'postgresql://postgres.xehgkblqiixwhnhjupuv:VUYeoo9AdgdCTDH3@aws-0-eu-west-1.pooler.supabase.com:6543/postgres'
})

await client.connect()

await client.query(`
  CREATE TABLE IF NOT EXISTS conversation_archives (
    practitioner_id uuid NOT NULL,
    patient_id      uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    created_at      timestamptz DEFAULT now(),
    PRIMARY KEY (practitioner_id, patient_id)
  );
`)

console.log('✅ conversation_archives table ready')
await client.end()
