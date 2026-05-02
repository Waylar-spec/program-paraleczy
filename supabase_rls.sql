-- Grant schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant table privileges to authenticated role
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Enable RLS on all tables
ALTER TABLE practitioners ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE educational_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_program_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_program_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_program_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE rehabilitation_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_phase_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- practitioners: each user manages their own row
CREATE POLICY "practitioners_self" ON practitioners
  FOR ALL USING (id = auth.uid());

-- patients: practitioners access their own patients
CREATE POLICY "patients_own" ON patients
  FOR ALL USING (practitioner_id = auth.uid());

-- exercises: practitioners access their own exercises
CREATE POLICY "exercises_own" ON exercises
  FOR ALL USING (practitioner_id = auth.uid());

-- program_templates: practitioners access their own templates
CREATE POLICY "program_templates_own" ON program_templates
  FOR ALL USING (practitioner_id = auth.uid());

-- program_template_items: via program template ownership
CREATE POLICY "program_template_items_own" ON program_template_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM program_templates pt
      WHERE pt.id = template_id AND pt.practitioner_id = auth.uid()
    )
  );

-- educational_content: practitioners access their own content
CREATE POLICY "educational_content_own" ON educational_content
  FOR ALL USING (practitioner_id = auth.uid());

-- surveys: practitioners access their own surveys
CREATE POLICY "surveys_own" ON surveys
  FOR ALL USING (practitioner_id = auth.uid());

-- survey_questions: via survey ownership
CREATE POLICY "survey_questions_own" ON survey_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM surveys s
      WHERE s.id = survey_id AND s.practitioner_id = auth.uid()
    )
  );

-- patient_programs: via patient ownership
CREATE POLICY "patient_programs_own" ON patient_programs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = patient_id AND p.practitioner_id = auth.uid()
    )
  );

-- patient_program_items: via patient_programs
CREATE POLICY "patient_program_items_own" ON patient_program_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM patient_programs pp
      JOIN patients p ON p.id = pp.patient_id
      WHERE pp.id = program_id AND p.practitioner_id = auth.uid()
    )
  );

-- patient_program_content: via patient_programs
CREATE POLICY "patient_program_content_own" ON patient_program_content
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM patient_programs pp
      JOIN patients p ON p.id = pp.patient_id
      WHERE pp.id = program_id AND p.practitioner_id = auth.uid()
    )
  );

-- patient_program_surveys: via patient_programs
CREATE POLICY "patient_program_surveys_own" ON patient_program_surveys
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM patient_programs pp
      JOIN patients p ON p.id = pp.patient_id
      WHERE pp.id = program_id AND p.practitioner_id = auth.uid()
    )
  );

-- patient_exercise_logs: via patient ownership
CREATE POLICY "patient_exercise_logs_own" ON patient_exercise_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = patient_id AND p.practitioner_id = auth.uid()
    )
  );

-- patient_survey_responses: via patient ownership
CREATE POLICY "patient_survey_responses_own" ON patient_survey_responses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = patient_id AND p.practitioner_id = auth.uid()
    )
  );

-- rehabilitation_protocols: practitioners access their own
CREATE POLICY "rehabilitation_protocols_own" ON rehabilitation_protocols
  FOR ALL USING (practitioner_id = auth.uid());

-- protocol_phases: via protocol ownership
CREATE POLICY "protocol_phases_own" ON protocol_phases
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM rehabilitation_protocols rp
      WHERE rp.id = protocol_id AND rp.practitioner_id = auth.uid()
    )
  );

-- protocol_phase_content: via protocol phases
CREATE POLICY "protocol_phase_content_own" ON protocol_phase_content
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM protocol_phases pp
      JOIN rehabilitation_protocols rp ON rp.id = pp.protocol_id
      WHERE pp.id = phase_id AND rp.practitioner_id = auth.uid()
    )
  );

-- patient_protocols: via patient ownership
CREATE POLICY "patient_protocols_own" ON patient_protocols
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = patient_id AND p.practitioner_id = auth.uid()
    )
  );

-- messages: practitioner can see their messages
CREATE POLICY "messages_own" ON messages
  FOR ALL USING (practitioner_id = auth.uid());
