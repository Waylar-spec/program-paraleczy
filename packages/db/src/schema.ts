import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  pgEnum,
  jsonb,
  smallint,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// ─── Enums ───────────────────────────────────────────────────────────────────

export const genderEnum = pgEnum("gender", ["male", "female", "other"])
export const programStatusEnum = pgEnum("program_status", [
  "active",
  "completed",
  "paused",
])
export const contentTypeEnum = pgEnum("content_type", ["pdf", "video", "link"])
export const surveyScheduleEnum = pgEnum("survey_schedule", [
  "on_start",
  "on_end",
  "weekly",
  "custom",
])
export const sideEnum = pgEnum("side", ["left", "right", "both"])

// ─── Users (klinicyści — zarządzani przez Supabase Auth) ─────────────────────

export const practitioners = pgTable("practitioners", {
  id: uuid("id").primaryKey(), // = auth.users.id z Supabase
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  practiceName: text("practice_name"),
  practiceAddress: text("practice_address"),
  practiceCity: text("practice_city"),
  practicePostalCode: varchar("practice_postal_code", { length: 10 }),
  practiceWebsite: text("practice_website"),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// ─── Patients (pacjenci) ──────────────────────────────────────────────────────

export const patients = pgTable("patients", {
  id: uuid("id").primaryKey().defaultRandom(),
  practitionerId: uuid("practitioner_id")
    .notNull()
    .references(() => practitioners.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: varchar("phone", { length: 20 }),
  birthYear: smallint("birth_year"),
  gender: genderEnum("gender"),
  notes: text("notes"),
  accessCode: varchar("access_code", { length: 8 }).notNull().unique(), // kod logowania pacjenta
  lastSeenAt: timestamp("last_seen_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// ─── Exercises (biblioteka ćwiczeń) ──────────────────────────────────────────

export const exercises = pgTable("exercises", {
  id: uuid("id").primaryKey().defaultRandom(),
  practitionerId: uuid("practitioner_id").references(() => practitioners.id, {
    onDelete: "cascade",
  }), // null = globalne/systemowe
  name: text("name").notNull(),
  description: text("description"),
  videoUrl: text("video_url"),
  thumbnailUrl: text("thumbnail_url"),
  animatedGifUrl: text("animated_gif_url"),
  bodyPart: text("body_part"), // kolano, bark, biodro, kręgosłup, itd.
  category: text("category"), // MSK, neurologia, sport, itd.
  difficulty: smallint("difficulty"), // 1-3
  defaultSets: smallint("default_sets"),
  defaultReps: smallint("default_reps"),
  defaultDuration: smallint("default_duration_seconds"),
  defaultRest: smallint("default_rest_seconds"),
  isPublic: boolean("is_public").default(false).notNull(),
  isFavorite: boolean("is_favorite").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// ─── Program Templates (szablony programów ćwiczeń) ──────────────────────────

export const programTemplates = pgTable("program_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  practitionerId: uuid("practitioner_id").references(() => practitioners.id, {
    onDelete: "cascade",
  }), // null = systemowy
  name: text("name").notNull(),
  description: text("description"),
  bodyPart: text("body_part"),
  durationWeeks: smallint("duration_weeks"),
  isPublic: boolean("is_public").default(false).notNull(),
  isFavorite: boolean("is_favorite").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const programTemplateItems = pgTable("program_template_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  templateId: uuid("template_id")
    .notNull()
    .references(() => programTemplates.id, { onDelete: "cascade" }),
  exerciseId: uuid("exercise_id")
    .notNull()
    .references(() => exercises.id),
  order: smallint("order").notNull(),
  sets: smallint("sets"),
  reps: smallint("reps"),
  durationSeconds: smallint("duration_seconds"),
  restSeconds: smallint("rest_seconds"),
  side: sideEnum("side"),
  notes: text("notes"),
})

// ─── Educational Content (materiały edukacyjne) ───────────────────────────────

export const educationalContent = pgTable("educational_content", {
  id: uuid("id").primaryKey().defaultRandom(),
  practitionerId: uuid("practitioner_id").references(() => practitioners.id, {
    onDelete: "cascade",
  }),
  name: text("name").notNull(),
  type: contentTypeEnum("type").notNull(),
  fileUrl: text("file_url"),
  externalUrl: text("external_url"),
  bodyPart: text("body_part"),
  ageGroup: text("age_group"), // adult, child, teen
  isFavorite: boolean("is_favorite").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// ─── Surveys / PROMs (kwestionariusze) ───────────────────────────────────────

export const surveys = pgTable("surveys", {
  id: uuid("id").primaryKey().defaultRandom(),
  practitionerId: uuid("practitioner_id").references(() => practitioners.id, {
    onDelete: "cascade",
  }), // null = systemowy (VAS, Oswestry, itd.)
  name: text("name").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const surveyQuestions = pgTable("survey_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  surveyId: uuid("survey_id")
    .notNull()
    .references(() => surveys.id, { onDelete: "cascade" }),
  order: smallint("order").notNull(),
  question: text("question").notNull(),
  type: text("type").notNull(), // scale, text, yesno, multiple_choice
  options: jsonb("options"), // dla multiple_choice
  minLabel: text("min_label"),
  maxLabel: text("max_label"),
  minValue: smallint("min_value"),
  maxValue: smallint("max_value"),
})

// ─── Patient Programs (przypisane programy) ───────────────────────────────────

export const patientPrograms = pgTable("patient_programs", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  practitionerId: uuid("practitioner_id")
    .notNull()
    .references(() => practitioners.id),
  templateId: uuid("template_id").references(() => programTemplates.id),
  name: text("name").notNull(),
  welcomeMessage: text("welcome_message"),
  status: programStatusEnum("status").default("active").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const patientProgramItems = pgTable("patient_program_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  programId: uuid("program_id")
    .notNull()
    .references(() => patientPrograms.id, { onDelete: "cascade" }),
  exerciseId: uuid("exercise_id")
    .notNull()
    .references(() => exercises.id),
  order: smallint("order").notNull(),
  sets: smallint("sets"),
  reps: smallint("reps"),
  durationSeconds: smallint("duration_seconds"),
  restSeconds: smallint("rest_seconds"),
  side: sideEnum("side"),
  notes: text("notes"),
})

export const patientProgramContent = pgTable("patient_program_content", {
  id: uuid("id").primaryKey().defaultRandom(),
  programId: uuid("program_id")
    .notNull()
    .references(() => patientPrograms.id, { onDelete: "cascade" }),
  contentId: uuid("content_id")
    .notNull()
    .references(() => educationalContent.id),
  order: smallint("order").notNull(),
})

export const patientProgramSurveys = pgTable("patient_program_surveys", {
  id: uuid("id").primaryKey().defaultRandom(),
  programId: uuid("program_id")
    .notNull()
    .references(() => patientPrograms.id, { onDelete: "cascade" }),
  surveyId: uuid("survey_id")
    .notNull()
    .references(() => surveys.id),
  schedule: surveyScheduleEnum("schedule").notNull(),
  customIntervalDays: smallint("custom_interval_days"),
})

// ─── Patient Exercise Logs (adherence + ból) ──────────────────────────────────

export const patientExerciseLogs = pgTable("patient_exercise_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  programId: uuid("program_id")
    .notNull()
    .references(() => patientPrograms.id),
  programItemId: uuid("program_item_id").references(
    () => patientProgramItems.id
  ),
  completedSets: smallint("completed_sets"),
  completedReps: smallint("completed_reps"),
  painBefore: smallint("pain_before"), // 0-10 VAS
  painAfter: smallint("pain_after"), // 0-10 VAS
  notes: text("notes"),
  loggedAt: timestamp("logged_at").defaultNow().notNull(),
})

// ─── Patient Survey Responses ─────────────────────────────────────────────────

export const patientSurveyResponses = pgTable("patient_survey_responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  surveyId: uuid("survey_id")
    .notNull()
    .references(() => surveys.id),
  programSurveyId: uuid("program_survey_id").references(
    () => patientProgramSurveys.id
  ),
  answers: jsonb("answers").notNull(), // { questionId: value }
  completedAt: timestamp("completed_at").defaultNow().notNull(),
})

// ─── Rehabilitation Protocols ⭐ (programy wielofazowe — nasz wyróżnik) ───────

export const rehabilitationProtocols = pgTable("rehabilitation_protocols", {
  id: uuid("id").primaryKey().defaultRandom(),
  practitionerId: uuid("practitioner_id").references(() => practitioners.id, {
    onDelete: "cascade",
  }), // null = systemowy (ACL, endoproteza, itd.)
  name: text("name").notNull(), // "Powrót po operacji ACL"
  description: text("description"),
  indication: text("indication"), // wskazanie kliniczne
  totalWeeks: smallint("total_weeks"),
  bodyPart: text("body_part"),
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const protocolPhases = pgTable("protocol_phases", {
  id: uuid("id").primaryKey().defaultRandom(),
  protocolId: uuid("protocol_id")
    .notNull()
    .references(() => rehabilitationProtocols.id, { onDelete: "cascade" }),
  order: smallint("order").notNull(),
  name: text("name").notNull(), // "Faza 1 — Wczesna rehabilitacja"
  description: text("description"),
  goals: text("goals"), // cele fazy
  durationWeeks: smallint("duration_weeks").notNull(),
  templateId: uuid("template_id").references(() => programTemplates.id), // szablon ćwiczeń dla tej fazy
})

export const protocolPhaseContent = pgTable("protocol_phase_content", {
  id: uuid("id").primaryKey().defaultRandom(),
  phaseId: uuid("phase_id")
    .notNull()
    .references(() => protocolPhases.id, { onDelete: "cascade" }),
  contentId: uuid("content_id").references(() => educationalContent.id),
  surveyId: uuid("survey_id").references(() => surveys.id),
  order: smallint("order").notNull(),
})

export const patientProtocols = pgTable("patient_protocols", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  practitionerId: uuid("practitioner_id")
    .notNull()
    .references(() => practitioners.id),
  protocolId: uuid("protocol_id")
    .notNull()
    .references(() => rehabilitationProtocols.id),
  currentPhaseId: uuid("current_phase_id").references(() => protocolPhases.id),
  startDate: timestamp("start_date").notNull(),
  status: programStatusEnum("status").default("active").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// ─── Messages (czat) ──────────────────────────────────────────────────────────

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  practitionerId: uuid("practitioner_id")
    .notNull()
    .references(() => practitioners.id),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  senderType: text("sender_type").notNull(), // "practitioner" | "patient"
  content: text("content").notNull(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// ─── Relations ────────────────────────────────────────────────────────────────

export const practitionersRelations = relations(practitioners, ({ many }) => ({
  patients: many(patients),
  exercises: many(exercises),
  programTemplates: many(programTemplates),
  protocols: many(rehabilitationProtocols),
}))

export const patientsRelations = relations(patients, ({ one, many }) => ({
  practitioner: one(practitioners, {
    fields: [patients.practitionerId],
    references: [practitioners.id],
  }),
  programs: many(patientPrograms),
  protocols: many(patientProtocols),
  messages: many(messages),
  exerciseLogs: many(patientExerciseLogs),
}))

export const patientProgramsRelations = relations(
  patientPrograms,
  ({ one, many }) => ({
    patient: one(patients, {
      fields: [patientPrograms.patientId],
      references: [patients.id],
    }),
    template: one(programTemplates, {
      fields: [patientPrograms.templateId],
      references: [programTemplates.id],
    }),
    items: many(patientProgramItems),
    content: many(patientProgramContent),
    surveys: many(patientProgramSurveys),
  })
)

export const rehabilitationProtocolsRelations = relations(
  rehabilitationProtocols,
  ({ many }) => ({
    phases: many(protocolPhases),
  })
)

export const protocolPhasesRelations = relations(
  protocolPhases,
  ({ one, many }) => ({
    protocol: one(rehabilitationProtocols, {
      fields: [protocolPhases.protocolId],
      references: [rehabilitationProtocols.id],
    }),
    template: one(programTemplates, {
      fields: [protocolPhases.templateId],
      references: [programTemplates.id],
    }),
    content: many(protocolPhaseContent),
  })
)
