"use client"

import { useState, useMemo } from "react"
import { Search, Filter, X, ChevronDown, ChevronUp } from "lucide-react"
import { ExerciseCard } from "./ExerciseCard"

type Exercise = {
  id: string
  name: string
  description: string | null
  body_part: string | null
  category: string | null
  difficulty: number | null
  default_sets: number | null
  default_reps: number | null
  default_duration_seconds: number | null
  thumbnail_url: string | null
  video_url: string | null
  is_favorite: boolean
  is_public: boolean
  practitioner_id: string | null
}

interface Props {
  exercises: Exercise[]
}

const BODY_PART_SHOW_INITIAL = 10

export function ExerciseLibrary({ exercises }: Props) {
  const [search, setSearch] = useState("")
  const [onlyOwn, setOnlyOwn] = useState(false)
  const [onlyPublic, setOnlyPublic] = useState(false)
  const [onlyFavorites, setOnlyFavorites] = useState(false)
  const [selectedBodyParts, setSelectedBodyParts] = useState<Set<string>>(new Set())
  const [showAllBodyParts, setShowAllBodyParts] = useState(false)

  // Compute body part counts from full list
  const bodyPartCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const ex of exercises) {
      if (ex.body_part) {
        map.set(ex.body_part, (map.get(ex.body_part) ?? 0) + 1)
      }
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [exercises])

  const ownCount = exercises.filter((e) => !!e.practitioner_id).length
  const publicCount = exercises.filter((e) => !e.practitioner_id).length

  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      if (search && !ex.name.toLowerCase().includes(search.toLowerCase())) return false
      if (onlyOwn && !ex.practitioner_id) return false
      if (onlyPublic && ex.practitioner_id) return false
      if (onlyFavorites && !ex.is_favorite) return false
      if (selectedBodyParts.size > 0 && (!ex.body_part || !selectedBodyParts.has(ex.body_part))) return false
      return true
    })
  }, [exercises, search, onlyOwn, onlyPublic, onlyFavorites, selectedBodyParts])

  function toggleBodyPart(bp: string) {
    setSelectedBodyParts((prev) => {
      const next = new Set(prev)
      if (next.has(bp)) next.delete(bp)
      else next.add(bp)
      return next
    })
  }

  function clearFilters() {
    setSearch("")
    setOnlyOwn(false)
    setOnlyPublic(false)
    setOnlyFavorites(false)
    setSelectedBodyParts(new Set())
  }

  const hasActiveFilters = onlyOwn || onlyPublic || onlyFavorites || selectedBodyParts.size > 0

  const visibleBodyParts = showAllBodyParts ? bodyPartCounts : bodyPartCounts.slice(0, BODY_PART_SHOW_INITIAL)

  return (
    <div className="flex gap-6">
      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside className="w-56 shrink-0 space-y-5">
        {/* Filter header */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            <Filter size={14} />
            Filtr
          </span>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Wyczyść
            </button>
          )}
        </div>

        {/* Source */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Źródło</p>
          <label className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors text-sm ${onlyOwn ? "bg-navy-500 text-white" : "hover:bg-gray-100 text-gray-700"}`}>
            <span className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={onlyOwn}
                onChange={(e) => { setOnlyOwn(e.target.checked); if (e.target.checked) setOnlyPublic(false) }}
                className="hidden"
              />
              Moje ćwiczenia
            </span>
            <span className={`text-xs ${onlyOwn ? "text-white/70" : "text-gray-400"}`}>({ownCount})</span>
          </label>
          <label className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors text-sm ${onlyPublic ? "bg-navy-500 text-white" : "hover:bg-gray-100 text-gray-700"}`}>
            <span className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={onlyPublic}
                onChange={(e) => { setOnlyPublic(e.target.checked); if (e.target.checked) setOnlyOwn(false) }}
                className="hidden"
              />
              Biblioteka ogólna
            </span>
            <span className={`text-xs ${onlyPublic ? "text-white/70" : "text-gray-400"}`}>({publicCount})</span>
          </label>
        </div>

        {/* Options */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2.5 px-2.5 py-1 cursor-pointer text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <input
              type="checkbox"
              checked={onlyFavorites}
              onChange={(e) => setOnlyFavorites(e.target.checked)}
              className="accent-navy-500 w-3.5 h-3.5"
            />
            Tylko ulubione
          </label>
        </div>

        {/* Body part */}
        {bodyPartCounts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Okolica ciała</p>
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Szukaj okolicy..."
                className="w-full h-7 pl-7 pr-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-400"
              />
            </div>
            <div className="space-y-0.5">
              {visibleBodyParts.map(([bp, count]) => {
                const selected = selectedBodyParts.has(bp)
                return (
                  <label
                    key={bp}
                    className={`flex items-center justify-between px-2 py-1 rounded-lg cursor-pointer text-xs transition-colors ${
                      selected ? "bg-navy-50 text-navy-700 font-medium" : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleBodyPart(bp)}
                        className="accent-navy-500 w-3 h-3"
                      />
                      {bp}
                    </span>
                    <span className={`${selected ? "text-navy-500" : "text-gray-400"}`}>({count})</span>
                  </label>
                )
              })}
            </div>
            {bodyPartCounts.length > BODY_PART_SHOW_INITIAL && (
              <button
                onClick={() => setShowAllBodyParts(!showAllBodyParts)}
                className="flex items-center gap-1 text-xs text-navy-500 hover:text-navy-700 px-2 transition-colors"
              >
                {showAllBodyParts ? (
                  <><ChevronUp size={12} /> Pokaż mniej</>
                ) : (
                  <><ChevronDown size={12} /> Pokaż więcej ({bodyPartCounts.length - BODY_PART_SHOW_INITIAL})</>
                )}
              </button>
            )}
          </div>
        )}
      </aside>

      {/* ── Main grid ─────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Search + active filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Szukaj ćwiczeń..."
              className="w-full h-9 pl-9 pr-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-navy-400 bg-white"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={13} />
              </button>
            )}
          </div>
          <span className="text-xs text-gray-400 shrink-0">
            {filtered.length} {filtered.length === 1 ? "ćwiczenie" : filtered.length < 5 ? "ćwiczenia" : "ćwiczeń"}
          </span>
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {onlyOwn && (
              <span className="inline-flex items-center gap-1 text-xs bg-navy-50 text-navy-700 px-2 py-0.5 rounded-full">
                Moje ćwiczenia
                <button onClick={() => setOnlyOwn(false)}><X size={11} /></button>
              </span>
            )}
            {onlyPublic && (
              <span className="inline-flex items-center gap-1 text-xs bg-navy-50 text-navy-700 px-2 py-0.5 rounded-full">
                Biblioteka ogólna
                <button onClick={() => setOnlyPublic(false)}><X size={11} /></button>
              </span>
            )}
            {onlyFavorites && (
              <span className="inline-flex items-center gap-1 text-xs bg-navy-50 text-navy-700 px-2 py-0.5 rounded-full">
                Tylko ulubione
                <button onClick={() => setOnlyFavorites(false)}><X size={11} /></button>
              </span>
            )}
            {[...selectedBodyParts].map((bp) => (
              <span key={bp} className="inline-flex items-center gap-1 text-xs bg-navy-50 text-navy-700 px-2 py-0.5 rounded-full">
                {bp}
                <button onClick={() => toggleBodyPart(bp)}><X size={11} /></button>
              </span>
            ))}
          </div>
        )}

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map((exercise) => (
              <ExerciseCard key={exercise.id} exercise={exercise} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm">Brak ćwiczeń spełniających kryteria</p>
            <button onClick={clearFilters} className="text-xs text-navy-500 hover:underline mt-2">
              Wyczyść filtry
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
