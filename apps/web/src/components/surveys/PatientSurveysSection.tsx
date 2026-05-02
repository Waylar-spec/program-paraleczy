"use client"

import { ClipboardList, CheckCircle2, Clock } from "lucide-react"
import type { PatientSurveyAssignment, SurveyResponse } from "@/lib/actions/surveys"

const SCHEDULE_LABELS: Record<string, string> = {
  on_start: "Na początku",
  on_end: "Na końcu",
  weekly: "Co tydzień",
  custom: "Indywidualnie",
}

interface Props {
  assignments: PatientSurveyAssignment[]
  responses: SurveyResponse[]
}

export function PatientSurveysSection({ assignments, responses }: Props) {
  if (assignments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <ClipboardList size={24} className="mx-auto mb-2 text-gray-300" />
        <p className="text-sm">Brak przypisanych kwestionariuszy</p>
        <p className="text-xs mt-1">Przypisz kwestionariusz do programu pacjenta</p>
      </div>
    )
  }

  // Group responses by survey_id, take latest 5 each
  const responsesBySurvey: Record<string, SurveyResponse[]> = {}
  for (const r of responses) {
    if (!responsesBySurvey[r.survey_id]) responsesBySurvey[r.survey_id] = []
    if (responsesBySurvey[r.survey_id].length < 5) {
      responsesBySurvey[r.survey_id].push(r)
    }
  }

  return (
    <div className="space-y-4">
      {assignments.map((assignment) => {
        const surveyResponses = responsesBySurvey[assignment.survey_id] ?? []
        const lastResponse = assignment.last_response_at
          ? new Date(assignment.last_response_at).toLocaleDateString("pl-PL", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : null

        return (
          <div key={assignment.id} className="border border-gray-100 rounded-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
              <div className="flex items-center gap-2 min-w-0">
                <ClipboardList size={16} className="text-navy-600 shrink-0" />
                <span className="text-sm font-medium text-gray-900 truncate">{assignment.surveys.name}</span>
                <span className="text-xs text-gray-400 bg-white border border-gray-200 rounded-full px-2 py-0.5 shrink-0">
                  {SCHEDULE_LABELS[assignment.schedule] ?? assignment.schedule}
                </span>
                <span className="text-xs text-gray-400 truncate hidden sm:block">
                  — {assignment.program_name}
                </span>
              </div>
              {lastResponse ? (
                <div className="flex items-center gap-1.5 text-xs text-green-600 shrink-0 ml-2">
                  <CheckCircle2 size={13} />
                  <span>{lastResponse}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-amber-500 shrink-0 ml-2">
                  <Clock size={13} />
                  <span>Brak</span>
                </div>
              )}
            </div>

            {/* Responses table */}
            {surveyResponses.length > 0 ? (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-2 text-gray-500 font-medium">Data</th>
                    <th className="text-left px-4 py-2 text-gray-500 font-medium">Wynik</th>
                  </tr>
                </thead>
                <tbody>
                  {surveyResponses.map((r) => {
                    const score = computeScore(r.answers)
                    return (
                      <tr key={r.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-600 whitespace-nowrap">
                          {new Date(r.completed_at).toLocaleDateString("pl-PL", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-2 text-gray-700">
                          {score !== null ? (
                            <span className="font-semibold text-navy-700">{score} pkt</span>
                          ) : (
                            <span className="text-gray-400 italic">
                              {Object.keys(r.answers).length} odpowiedzi
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <div className="px-4 py-3 text-xs text-gray-400 italic">
                Pacjent jeszcze nie wypełnił tego kwestionariusza
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function computeScore(answers: Record<string, unknown>): number | null {
  const vals = Object.values(answers)
  if (vals.length === 0) return null
  const nums = vals.map((v) => (typeof v === "number" ? v : Number(v))).filter((n) => !isNaN(n))
  if (nums.length === 0) return null
  return nums.reduce((a, b) => a + b, 0)
}
