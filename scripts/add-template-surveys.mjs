// Run from apps/web:
// node --env-file=.env.local ../../scripts/add-template-surveys.mjs

import { createRequire } from "module"
import { fileURLToPath } from "url"
import path from "path"

// Resolve pg from apps/web/node_modules
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const webDir = path.resolve(__dirname, "../apps/web")
const require = createRequire(path.join(webDir, "package.json"))
const pg = require("pg")

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set. Please set it in .env.local")
  process.exit(1)
}

const client = new pg.Client({ connectionString: DATABASE_URL })
await client.connect()

const sql = `
CREATE TABLE IF NOT EXISTS program_template_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES program_templates(id) ON DELETE CASCADE,
  survey_id uuid NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  schedule text NOT NULL DEFAULT 'on_start',
  "order" integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  UNIQUE(template_id, survey_id)
);
`

try {
  await client.query(sql)
  console.log("✓ program_template_surveys table created (or already exists)")
} catch (err) {
  console.error("Error creating table:", err.message)
  process.exit(1)
} finally {
  await client.end()
}
