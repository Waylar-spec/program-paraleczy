"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { ClipboardList, Search, X } from "lucide-react"
import type { Survey } from "@/lib/actions/surveys"

const TABS = [
  { label: "Ćwiczenia", href: "/biblioteka" },
  { label: "Szablony", href: "/biblioteka/szablony" },
  { label: "Protokoły", href: "/biblioteka/protokoly" },
  { label: "Edukacja", href: "/biblioteka/edukacja" },
  { label: "Kwestionariusze", href: "/biblioteka/kwestionariusze" },
]

interface Props {
  surveys: Survey[]
}

export function SurveysLibrary({ surveys }: Props) {
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    if (!search.trim()) return surveys
    const q = search.toLowerCase()
    return surveys.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.description ?? "").toLowerCase().includes(q)
    )
  }, [surveys, search])

  return (
    <>
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab.href === "/biblioteka/kwestionariusze"
                  ? "border-navy-600 text-navy-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      {surveys.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <ClipboardList size={28} className="text-gray-400" />
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">Brak kwestionariuszy</h2>
          <p className="text-sm text-gray-500 max-w-sm">
            Kwestionariusze VAS, Oswestry, Oxford Knee i DASH będą dostępne po uruchomieniu seedera.
          </p>
        </div>
      ) : (
        <>
          {/* Search */}
          <div className="relative max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Szukaj kwestionariuszy..."
              className="w-full h-9 pl-9 pr-8 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-navy-400 bg-white"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {filtered.length === 0 && search && (
            <p className="text-sm text-gray-400 py-4">Brak wyników dla „{search}"</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((survey) => (
              <SurveyCard key={survey.id} survey={survey} />
            ))}
          </div>
        </>
      )}
    </>
  )
}

function SurveyCard({ survey }: { survey: Survey }) {
  const isSystem = survey.practitioner_id === null
  const qCount = survey.question_count ?? 0

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="w-10 h-10 rounded-lg bg-navy-50 flex items-center justify-center shrink-0">
          <ClipboardList size={20} className="text-navy-600" />
        </div>
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

      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-900">{survey.name}</p>
        {survey.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{survey.description}</p>
        )}
        <p className="text-xs text-gray-400 mt-2">
          {qCount} {qCount === 1 ? "pytanie" : qCount < 5 ? "pytania" : "pytań"}
        </p>
      </div>
    </div>
  )
}
