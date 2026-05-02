"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, CheckCircle2 } from "lucide-react"
import { submitSurveyResponse } from "@/lib/actions/surveys"
import type { SurveyQuestion } from "@/lib/actions/surveys"

interface Props {
  patientId: string
  surveyId: string
  assignmentId: string
  questions: SurveyQuestion[]
  kod: string
}

export function SurveyForm({ patientId, surveyId, assignmentId, questions, kod }: Props) {
  const router = useRouter()
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  function setAnswer(questionId: string, value: unknown) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const allAnswered = questions.every((q) => answers[q.id] !== undefined && answers[q.id] !== "")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!allAnswered) return
    setSubmitting(true)
    try {
      await submitSurveyResponse(patientId, surveyId, assignmentId, answers)
      setDone(true)
    } catch {
      alert("Nie udało się wysłać odpowiedzi. Spróbuj ponownie.")
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
          <CheckCircle2 size={32} className="text-green-500" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Kwestionariusz wysłany!</h2>
          <p className="text-sm text-gray-500 mt-1">
            Twoje odpowiedzi zostały zapisane. Dziękujemy!
          </p>
        </div>
        <button
          onClick={() => router.push(`/p/${kod}/kwestionariusze`)}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-navy-500 hover:bg-navy-600 text-white text-sm font-medium transition-colors"
        >
          Wróć do listy
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ChevronLeft size={16} />
        Wróć
      </button>

      <div className="space-y-4">
        {questions.map((q, idx) => (
          <QuestionCard
            key={q.id}
            question={q}
            index={idx}
            value={answers[q.id]}
            onChange={(val) => setAnswer(q.id, val)}
          />
        ))}
      </div>

      <div className="pt-2 pb-6">
        <button
          type="submit"
          disabled={submitting || !allAnswered}
          className="w-full h-12 rounded-xl bg-navy-500 hover:bg-navy-600 disabled:opacity-50 text-white font-medium transition-colors"
        >
          {submitting ? "Wysyłanie..." : "Wyślij kwestionariusz"}
        </button>
        {!allAnswered && (
          <p className="text-xs text-center text-gray-400 mt-2">
            Odpowiedz na wszystkie pytania przed wysłaniem
          </p>
        )}
      </div>
    </form>
  )
}

function QuestionCard({
  question,
  index,
  value,
  onChange,
}: {
  question: SurveyQuestion
  index: number
  value: unknown
  onChange: (val: unknown) => void
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
      <p className="text-sm font-medium text-gray-900">
        <span className="text-navy-500 font-semibold mr-1.5">{index + 1}.</span>
        {question.question}
      </p>

      {question.type === "scale" && (
        <ScaleInput
          min={question.min_value ?? 0}
          max={question.max_value ?? 10}
          minLabel={question.min_label}
          maxLabel={question.max_label}
          value={value as number | undefined}
          onChange={onChange}
        />
      )}

      {question.type === "multiple_choice" && question.options && (
        <MultipleChoiceInput
          options={question.options}
          value={value as number | undefined}
          onChange={onChange}
          minValue={question.min_value ?? 0}
        />
      )}

      {question.type === "yesno" && (
        <YesNoInput
          value={value as boolean | undefined}
          onChange={onChange}
        />
      )}

      {question.type === "text" && (
        <textarea
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          placeholder="Twoja odpowiedź..."
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-navy-400 resize-none"
        />
      )}
    </div>
  )
}

function ScaleInput({
  min,
  max,
  minLabel,
  maxLabel,
  value,
  onChange,
}: {
  min: number
  max: number
  minLabel: string | null
  maxLabel: string | null
  value: number | undefined
  onChange: (val: number) => void
}) {
  const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i)

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5 flex-wrap">
        {steps.map((step) => (
          <button
            key={step}
            type="button"
            onClick={() => onChange(step)}
            className={`w-10 h-10 rounded-xl text-sm font-semibold border-2 transition-all ${
              value === step
                ? "border-navy-500 bg-navy-500 text-white"
                : step <= 3
                ? "border-green-200 text-green-700 hover:border-green-400 hover:bg-green-50"
                : step <= 6
                ? "border-yellow-200 text-yellow-700 hover:border-yellow-400 hover:bg-yellow-50"
                : "border-red-200 text-red-700 hover:border-red-400 hover:bg-red-50"
            }`}
          >
            {step}
          </button>
        ))}
      </div>
      {(minLabel || maxLabel) && (
        <div className="flex justify-between text-xs text-gray-400">
          {minLabel && <span>{minLabel}</span>}
          {maxLabel && <span>{maxLabel}</span>}
        </div>
      )}
    </div>
  )
}

function MultipleChoiceInput({
  options,
  value,
  onChange,
  minValue,
}: {
  options: string[]
  value: number | undefined
  onChange: (val: number) => void
  minValue: number
}) {
  return (
    <div className="space-y-2">
      {options.map((opt, idx) => {
        const score = minValue + idx
        const selected = value === score
        return (
          <label
            key={idx}
            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
              selected
                ? "border-navy-500 bg-navy-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <input
              type="radio"
              name={`q-${opt}`}
              checked={selected}
              onChange={() => onChange(score)}
              className="mt-0.5 accent-navy-500 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <span className={`text-sm ${selected ? "text-navy-700 font-medium" : "text-gray-700"}`}>
                {opt}
              </span>
              <span className="ml-2 text-xs text-gray-400">({score} pkt)</span>
            </div>
          </label>
        )
      })}
    </div>
  )
}

function YesNoInput({
  value,
  onChange,
}: {
  value: boolean | undefined
  onChange: (val: boolean) => void
}) {
  return (
    <div className="flex gap-3">
      {[
        { label: "Tak", val: true },
        { label: "Nie", val: false },
      ].map(({ label, val }) => (
        <button
          key={label}
          type="button"
          onClick={() => onChange(val)}
          className={`flex-1 h-11 rounded-xl text-sm font-medium border-2 transition-all ${
            value === val
              ? "border-navy-500 bg-navy-500 text-white"
              : "border-gray-200 text-gray-700 hover:border-gray-300"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
