// Run from apps/web:
// node --env-file=.env.local ../../scripts/add-template-surveys-rls.mjs

import { createRequire } from "module"
import { fileURLToPath } from "url"
import path from "path"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const webDir = path.resolve(__dirname, "../apps/web")
const require = createRequire(path.join(webDir, "package.json"))
const pg = require("pg")

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set")
  process.exit(1)
}

const client = new pg.Client({ connectionString: DATABASE_URL })
await client.connect()

const sql = `
-- Make sure table exists
CREATE TABLE IF NOT EXISTS program_template_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES program_templates(id) ON DELETE CASCADE,
  survey_id uuid NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  schedule text NOT NULL DEFAULT 'on_start',
  "order" integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  UNIQUE(template_id, survey_id)
);

-- Enable RLS
ALTER TABLE program_template_surveys ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (idempotent)
DROP POLICY IF EXISTS "Practitioners can view their own template surveys" ON program_template_surveys;
DROP POLICY IF EXISTS "Practitioners can insert their own template surveys" ON program_template_surveys;
DROP POLICY IF EXISTS "Practitioners can delete their own template surveys" ON program_template_surveys;

-- SELECT: own templates + public templates
CREATE POLICY "Practitioners can view their own template surveys"
  ON program_template_surveys FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM program_templates pt
      WHERE pt.id = program_template_surveys.template_id
        AND (pt.practitioner_id = auth.uid() OR pt.is_public = true)
    )
  );

-- INSERT: only own templates
CREATE POLICY "Practitioners can insert their own template surveys"
  ON program_template_surveys FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM program_templates pt
      WHERE pt.id = program_template_surveys.template_id
        AND pt.practitioner_id = auth.uid()
    )
  );

-- DELETE: only own templates
CREATE POLICY "Practitioners can delete their own template surveys"
  ON program_template_surveys FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM program_templates pt
      WHERE pt.id = program_template_surveys.template_id
        AND pt.practitioner_id = auth.uid()
    )
  );
`

try {
  await client.query(sql)
  console.log("✓ RLS policies added to program_template_surveys")
} catch (err) {
  console.error("Error:", err.message)
  process.exit(1)
} finally {
  await client.end()
}
