"use client"

import { useState, useEffect, useRef } from "react"
import { Dumbbell } from "lucide-react"
import { useProgramBuilder } from "@/store/programBuilder"
import { ProgramBuilderPanel } from "./ProgramBuilderPanel"

export function ProgramBuilderButton() {
  const { exercises, contentItems, open, isOpen } = useProgramBuilder()
  const count = exercises.length + contentItems.length
  const [hovered, setHovered] = useState(false)
  const [flash, setFlash] = useState(false)
  const prevCount = useRef(count)

  // Flash the badge whenever count increases
  useEffect(() => {
    if (count > prevCount.current) {
      setFlash(true)
      const t = setTimeout(() => setFlash(false), 500)
      prevCount.current = count
      return () => clearTimeout(t)
    }
    prevCount.current = count
  }, [count])

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={open}
        className="relative inline-flex items-center gap-1.5 h-7 px-3 rounded-lg bg-navy-500 hover:bg-navy-600 text-white text-xs font-medium transition-colors"
      >
        Edytor programów
        {count > 0 && (
          <span
            key={count}
            className={`ml-0.5 bg-white text-navy-600 rounded-full w-4 h-4 text-[10px] font-bold flex items-center justify-center leading-none transition-transform ${
              flash ? "scale-125" : "scale-100"
            }`}
          >
            {count}
          </span>
        )}
      </button>

      {/* Hover preview — hidden when builder is open */}
      {hovered && !isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden pointer-events-none">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-700">Wybrana treść ({count})</p>
          </div>

          {count === 0 ? (
            <div className="px-4 py-4 text-center">
              <Dumbbell size={20} className="text-gray-300 mx-auto mb-1.5" />
              <p className="text-xs text-gray-400">Brak wybranych ćwiczeń</p>
            </div>
          ) : (
            <div className="max-h-48 overflow-hidden">
              {exercises.slice(0, 5).map((ex) => (
                <div key={ex.itemId} className="flex items-center gap-2.5 px-4 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 shrink-0 overflow-hidden flex items-center justify-center">
                    {(ex.thumbnailUrl ?? ex.animatedGifUrl)
                      ? <img src={(ex.thumbnailUrl ?? ex.animatedGifUrl)!} alt={ex.name} className="w-full h-full object-contain" />
                      : <Dumbbell size={12} className="text-gray-300" />
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-800 truncate">{ex.name}</p>
                    <p className="text-[10px] text-gray-400">
                      {ex.sets}s · {ex.reps ? `${ex.reps} powt.` : ""}
                      {ex.durationSeconds ? ` · ${ex.durationSeconds}s` : ""}
                    </p>
                  </div>
                </div>
              ))}
              {exercises.length > 5 && (
                <div className="px-4 py-2 text-center">
                  <p className="text-[11px] text-gray-400">+{exercises.length - 5} więcej ćwiczeń</p>
                </div>
              )}
            </div>
          )}

          <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100">
            <p className="text-[11px] text-gray-400 text-center">Kliknij, aby otworzyć edytor</p>
          </div>
        </div>
      )}

      <ProgramBuilderPanel />
    </div>
  )
}
