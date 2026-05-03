"use client"

import { useState, useMemo } from "react"
import { ClipboardList, Search, X, Check } from "lucide-react"
import { useProgramBuilder } from "@/store/programBuilder"
import type { Survey } from "@/lib/actions/surveys"

interface Props {
  surveys: Survey[]
}

export function SurveysLibrary({ surveys }: Props) {
  const [search, setSearch] = useState("")
  const { hasSurvey, addSurvey, removeSurvey, exercises, contentItems, surveyItems } = useProgramBuilder()
  const totalSelected = exercises.length + contentItems.length + surveyItems.length

  const filtered = useMemo(() => {
    if (!search.trim()) return surveys
    const q = search.toLowerCase()
    return surveys.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.description ?? "").toLowerCase().includes(q)
    )
  }, [surveys, search])

  function toggleSurvey(survey: Survey) {
    if (hasSurvey(survey.id)) {
      removeSurvey(survey.id)
    } else {
      addSurvey({ surveyId: survey.id, name: survey.name, schedule: "on_start" })
    }
  }

  if (surveys.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <ClipboardList size={28} className="text-gray-400" />
        </div>
        <h2 className="text-lg font-medium text-gray-900 mb-2">Brak kwestionariuszy</h2>
        <p className="text-sm text-gray-500 max-w-sm">
          Kwestionariusze VAS, Oswestry, Oxford Knee i DASH są dostępne w bibliotece systemowej.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Szukaj kwestionariuszy..."
          className="w-full h-9 pl-9 pr-8 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-navy-400 bg-white"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={13} />
          </button>
        )}
      </div>

      {filtered.length === 0 && search && (
        <p className="text-sm text-gray-400 py-4">Brak wyników dla „{search}"</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((survey) => {
          const selected = hasSurvey(survey.id)
          const isSystem = survey.practitioner_id === null
          const qCount = survey.question_count ?? 0

          return (
            <div
              key={survey.id}
              onClick={() => toggleSurvey(survey)}
              className={`relative bg-white rounded-xl border p-4 cursor-pointer hover:shadow-sm transition-all flex flex-col gap-3 ${
                selected
                  ? "border-navy-400 ring-1 ring-navy-300"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {/* Checkbox */}
              <div
                className={`absolute top-3 left-3 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  selected
                    ? "bg-navy-500 border-navy-500"
                    : "bg-white border-gray-300 hover:border-navy-400"
                }`}
              >
                {selected && <Check size={12} className="text-white" strokeWidth={3} />}
              </div>

              <div className="flex items-start gap-3 pl-6">
                <div className="w-10 h-10 rounded-lg bg-navy-50 flex items-center justify-center shrink-0">
                  <ClipboardList size={20} className="text-navy-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 leading-tight">{survey.name}</p>
                  {survey.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{survey.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pl-6 mt-auto">
                <span className="text-xs text-gray-400">
                  {qCount} {qCount === 1 ? "pytanie" : qCount < 5 ? "pytania" : "pytań"}
                </span>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    isSystem
                      ? "bg-blue-50 text-blue-600"
                      : "bg-green-50 text-green-600"
                  }`}
                >
                  {isSystem ? "Systemowy" : "Własny"}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Sticky builder bar */}
      {totalSelected > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
          <button
            onClick={open}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-navy-500 hover:bg-navy-600 text-white text-sm font-medium shadow-lg transition-colors"
          >
            Edytor programów
            <span className="bg-white text-navy-600 rounded-full w-5 h-5 text-[10px] font-bold flex items-center justify-center leading-none">
              {totalSelected}
            </span>
          </button>
        </div>
      )}
    </>
  )
}
