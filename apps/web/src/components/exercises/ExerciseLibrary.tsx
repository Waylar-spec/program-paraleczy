"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { Search, Filter, X, ChevronDown, ChevronUp } from "lucide-react"
import { ExerciseCard } from "./ExerciseCard"

type Exercise = {
  id: string
  name: string
  name_en: string | null
  description: string | null
  body_part: string | null
  category: string | null
  difficulty: number | null
  default_sets: number | null
  default_reps: number | null
  default_duration_seconds: number | null
  thumbnail_url: string | null
  animated_gif_url?: string | null
  video_url: string | null
  is_favorite: boolean
  is_public: boolean
  practitioner_id: string | null
}

interface Props {
  exercises: Exercise[]
}

const DIFFICULTY_LABELS: Record<number, string> = { 1: "Łatwe", 2: "Średnie", 3: "Trudne" }
const DIFFICULTY_COLORS: Record<number, string> = {
  1: "text-green-700 bg-green-50 border-green-200",
  2: "text-yellow-700 bg-yellow-50 border-yellow-200",
  3: "text-red-700 bg-red-50 border-red-200",
}

const BODY_PART_SHOW_INITIAL = 10
const PAGE_SIZE = 40

export function ExerciseLibrary({ exercises }: Props) {
  const [search, setSearch] = useState("")
  const [onlyOwn, setOnlyOwn] = useState(false)
  const [onlyPublic, setOnlyPublic] = useState(false)
  const [onlyFavorites, setOnlyFavorites] = useState(false)
  const [selectedBodyParts, setSelectedBodyParts] = useState<Set<string>>(new Set())
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [selectedDifficulties, setSelectedDifficulties] = useState<Set<number>>(new Set())
  const [showAllBodyParts, setShowAllBodyParts] = useState(false)
  const [bodyPartSearch, setBodyPartSearch] = useState("")
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const bodyPartCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const ex of exercises) {
      if (ex.body_part) map.set(ex.body_part, (map.get(ex.body_part) ?? 0) + 1)
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [exercises])

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const ex of exercises) {
      if (ex.category) map.set(ex.category, (map.get(ex.category) ?? 0) + 1)
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [exercises])

  const difficultyCounts = useMemo(() => {
    const map = new Map<number, number>()
    for (const ex of exercises) {
      if (ex.difficulty) map.set(ex.difficulty, (map.get(ex.difficulty) ?? 0) + 1)
    }
    return map
  }, [exercises])

  const ownCount = exercises.filter((e) => !!e.practitioner_id).length
  const publicCount = exercises.filter((e) => !e.practitioner_id).length

  // Reset visible window whenever filters/search change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [search, onlyOwn, onlyPublic, onlyFavorites, selectedBodyParts, selectedCategories, selectedDifficulties])

  // Infinite scroll sentinel
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((c) => c + PAGE_SIZE)
        }
      },
      { rootMargin: "200px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      if (search) {
        const q = search.toLowerCase()
        if (!ex.name.toLowerCase().includes(q) && !(ex.name_en?.toLowerCase().includes(q))) return false
      }
      if (onlyOwn && !ex.practitioner_id) return false
      if (onlyPublic && ex.practitioner_id) return false
      if (onlyFavorites && !ex.is_favorite) return false
      if (selectedBodyParts.size > 0 && (!ex.body_part || !selectedBodyParts.has(ex.body_part))) return false
      if (selectedCategories.size > 0 && (!ex.category || !selectedCategories.has(ex.category))) return false
      if (selectedDifficulties.size > 0 && (!ex.difficulty || !selectedDifficulties.has(ex.difficulty))) return false
      return true
    })
  }, [exercises, search, onlyOwn, onlyPublic, onlyFavorites, selectedBodyParts, selectedCategories, selectedDifficulties])

  function toggleBodyPart(bp: string) {
    setSelectedBodyParts((prev) => {
      const next = new Set(prev)
      next.has(bp) ? next.delete(bp) : next.add(bp)
      return next
    })
  }

  function toggleCategory(cat: string) {
    setSelectedCategories((prev) => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  function toggleDifficulty(d: number) {
    setSelectedDifficulties((prev) => {
      const next = new Set(prev)
      next.has(d) ? next.delete(d) : next.add(d)
      return next
    })
  }

  function clearFilters() {
    setSearch("")
    setOnlyOwn(false)
    setOnlyPublic(false)
    setOnlyFavorites(false)
    setSelectedBodyParts(new Set())
    setSelectedCategories(new Set())
    setSelectedDifficulties(new Set())
    setBodyPartSearch("")
  }

  const hasActiveFilters =
    onlyOwn || onlyPublic || onlyFavorites ||
    selectedBodyParts.size > 0 || selectedCategories.size > 0 || selectedDifficulties.size > 0

  const filteredBodyParts = useMemo(() => {
    const q = bodyPartSearch.toLowerCase()
    const list = q ? bodyPartCounts.filter(([bp]) => bp.toLowerCase().includes(q)) : bodyPartCounts
    return showAllBodyParts ? list : list.slice(0, BODY_PART_SHOW_INITIAL)
  }, [bodyPartCounts, bodyPartSearch, showAllBodyParts])

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
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Źródło</p>
          <label className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors text-sm ${onlyOwn ? "bg-navy-500 text-white" : "hover:bg-gray-100 text-gray-700"}`}>
            <span className="flex items-center gap-2">
              <input type="checkbox" checked={onlyOwn} onChange={(e) => { setOnlyOwn(e.target.checked); if (e.target.checked) setOnlyPublic(false) }} className="hidden" />
              Moje ćwiczenia
            </span>
            <span className={`text-xs ${onlyOwn ? "text-white/70" : "text-gray-400"}`}>({ownCount})</span>
          </label>
          <label className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors text-sm ${onlyPublic ? "bg-navy-500 text-white" : "hover:bg-gray-100 text-gray-700"}`}>
            <span className="flex items-center gap-2">
              <input type="checkbox" checked={onlyPublic} onChange={(e) => { setOnlyPublic(e.target.checked); if (e.target.checked) setOnlyOwn(false) }} className="hidden" />
              Biblioteka ogólna
            </span>
            <span className={`text-xs ${onlyPublic ? "text-white/70" : "text-gray-400"}`}>({publicCount})</span>
          </label>
        </div>

        {/* Favorites */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2.5 px-2.5 py-1 cursor-pointer text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <input type="checkbox" checked={onlyFavorites} onChange={(e) => setOnlyFavorites(e.target.checked)} className="accent-navy-500 w-3.5 h-3.5" />
            Tylko ulubione
          </label>
        </div>

        {/* Difficulty */}
        {difficultyCounts.size > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Trudność</p>
            <div className="flex flex-col gap-1">
              {([1, 2, 3] as const).map((d) => {
                if (!difficultyCounts.has(d)) return null
                const active = selectedDifficulties.has(d)
                return (
                  <button
                    key={d}
                    onClick={() => toggleDifficulty(d)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      active ? DIFFICULTY_COLORS[d] + " border-current" : "border-transparent text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <span>{DIFFICULTY_LABELS[d]}</span>
                    <span className={active ? "opacity-70" : "text-gray-400"}>({difficultyCounts.get(d)})</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Category */}
        {categoryCounts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Kategoria</p>
            <div className="space-y-0.5">
              {categoryCounts.map(([cat, count]) => {
                const active = selectedCategories.has(cat)
                return (
                  <label
                    key={cat}
                    className={`flex items-center justify-between px-2 py-1 rounded-lg cursor-pointer text-xs transition-colors ${
                      active ? "bg-navy-50 text-navy-700 font-medium" : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <input type="checkbox" checked={active} onChange={() => toggleCategory(cat)} className="accent-navy-500 w-3 h-3" />
                      {cat}
                    </span>
                    <span className={active ? "text-navy-500" : "text-gray-400"}>({count})</span>
                  </label>
                )
              })}
            </div>
          </div>
        )}

        {/* Body part */}
        {bodyPartCounts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Okolica ciała</p>
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={bodyPartSearch}
                onChange={(e) => setBodyPartSearch(e.target.value)}
                placeholder="Szukaj okolicy..."
                className="w-full h-7 pl-7 pr-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-400"
              />
            </div>
            <div className="space-y-0.5">
              {filteredBodyParts.map(([bp, count]) => {
                const selected = selectedBodyParts.has(bp)
                return (
                  <label
                    key={bp}
                    className={`flex items-center justify-between px-2 py-1 rounded-lg cursor-pointer text-xs transition-colors ${
                      selected ? "bg-navy-50 text-navy-700 font-medium" : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <input type="checkbox" checked={selected} onChange={() => toggleBodyPart(bp)} className="accent-navy-500 w-3 h-3" />
                      {bp}
                    </span>
                    <span className={selected ? "text-navy-500" : "text-gray-400"}>({count})</span>
                  </label>
                )
              })}
              {filteredBodyParts.length === 0 && bodyPartSearch && (
                <p className="text-xs text-gray-400 px-2 py-1">Brak wyników</p>
              )}
            </div>
            {!bodyPartSearch && bodyPartCounts.length > BODY_PART_SHOW_INITIAL && (
              <button
                onClick={() => setShowAllBodyParts(!showAllBodyParts)}
                className="flex items-center gap-1 text-xs text-navy-500 hover:text-navy-700 px-2 transition-colors"
              >
                {showAllBodyParts
                  ? <><ChevronUp size={12} /> Pokaż mniej</>
                  : <><ChevronDown size={12} /> Pokaż więcej ({bodyPartCounts.length - BODY_PART_SHOW_INITIAL})</>
                }
              </button>
            )}
          </div>
        )}
      </aside>

      {/* ── Main grid ─────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Search + count */}
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
                Moje ćwiczenia <button onClick={() => setOnlyOwn(false)}><X size={11} /></button>
              </span>
            )}
            {onlyPublic && (
              <span className="inline-flex items-center gap-1 text-xs bg-navy-50 text-navy-700 px-2 py-0.5 rounded-full">
                Biblioteka ogólna <button onClick={() => setOnlyPublic(false)}><X size={11} /></button>
              </span>
            )}
            {onlyFavorites && (
              <span className="inline-flex items-center gap-1 text-xs bg-navy-50 text-navy-700 px-2 py-0.5 rounded-full">
                Tylko ulubione <button onClick={() => setOnlyFavorites(false)}><X size={11} /></button>
              </span>
            )}
            {[...selectedDifficulties].map((d) => (
              <span key={d} className="inline-flex items-center gap-1 text-xs bg-navy-50 text-navy-700 px-2 py-0.5 rounded-full">
                {DIFFICULTY_LABELS[d]} <button onClick={() => toggleDifficulty(d)}><X size={11} /></button>
              </span>
            ))}
            {[...selectedCategories].map((cat) => (
              <span key={cat} className="inline-flex items-center gap-1 text-xs bg-navy-50 text-navy-700 px-2 py-0.5 rounded-full">
                {cat} <button onClick={() => toggleCategory(cat)}><X size={11} /></button>
              </span>
            ))}
            {[...selectedBodyParts].map((bp) => (
              <span key={bp} className="inline-flex items-center gap-1 text-xs bg-navy-50 text-navy-700 px-2 py-0.5 rounded-full">
                {bp} <button onClick={() => toggleBodyPart(bp)}><X size={11} /></button>
              </span>
            ))}
          </div>
        )}

        {/* Grid */}
        {filtered.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filtered.slice(0, visibleCount).map((exercise) => (
                <ExerciseCard key={exercise.id} exercise={exercise} />
              ))}
            </div>
            {/* Sentinel — triggers next page load */}
            <div ref={sentinelRef} className="h-4" />
            {visibleCount < filtered.length && (
              <p className="text-center text-xs text-gray-400 pb-4">
                {filtered.slice(0, visibleCount).length} z {filtered.length} ćwiczeń
              </p>
            )}
          </>
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
