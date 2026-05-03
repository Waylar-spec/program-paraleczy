"use client"

import { useState, useMemo } from "react"
import { FileText, ExternalLink, Search, X, Check } from "lucide-react"
import { useProgramBuilder } from "@/store/programBuilder"
import { ContentActions } from "./ContentActions"

type ContentItem = {
  id: string
  name: string
  type: string
  file_url: string | null
  external_url: string | null
  body_part: string | null
  is_favorite: boolean
  practitioner_id: string | null
}

interface Props {
  content: ContentItem[]
}

export function EducationLibrary({ content }: Props) {
  const { hasContent, addContent, removeContent, open, exercises, contentItems, surveyItems } = useProgramBuilder()
  const [search, setSearch] = useState("")
  const totalSelected = exercises.length + contentItems.length + surveyItems.length

  const filtered = useMemo(() => {
    if (!search.trim()) return content
    const q = search.toLowerCase()
    return content.filter((c) =>
      c.name.toLowerCase().includes(q) || c.body_part?.toLowerCase().includes(q)
    )
  }, [content, search])

  function toggleContent(item: ContentItem) {
    if (hasContent(item.id)) {
      removeContent(item.id)
    } else {
      addContent({
        contentId: item.id,
        name: item.name,
        type: item.type,
        fileUrl: item.file_url,
        externalUrl: item.external_url,
      })
      open()
    }
  }

  return (
    <>
      {/* Search */}
      {content.length > 0 && (
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Szukaj materiałów..."
            className="w-full h-9 pl-9 pr-8 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-navy-400 bg-white"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          )}
        </div>
      )}

      {content.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-navy-50 flex items-center justify-center mb-4">
            <FileText size={28} className="text-navy-500" />
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">Brak materiałów edukacyjnych</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-sm">
            Dodaj PDFy lub linki do artykułów dla pacjentów.
          </p>
        </div>
      ) : (
        <>
          {filtered.length === 0 && search && (
            <p className="text-sm text-gray-400 py-4">Brak wyników dla „{search}"</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const selected = hasContent(item.id)
            return (
              <div
                key={item.id}
                className={`relative bg-white rounded-xl border p-4 hover:shadow-sm transition-all flex flex-col gap-3 ${
                  selected ? "border-navy-400 ring-1 ring-navy-300" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleContent(item)}
                  className={`absolute top-3 left-3 z-10 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    selected
                      ? "bg-navy-500 border-navy-500"
                      : "bg-white border-gray-300 hover:border-navy-400"
                  }`}
                >
                  {selected && <Check size={12} className="text-white" strokeWidth={3} />}
                </button>

                <div className="flex items-start gap-3 pl-6">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    item.type === "pdf" ? "bg-red-50" : "bg-blue-50"
                  }`}>
                    {item.type === "pdf"
                      ? <FileText size={20} className="text-red-500" />
                      : <ExternalLink size={20} className="text-blue-500" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">{item.name}</p>
                    {item.body_part && (
                      <span className="text-xs text-gray-400 mt-0.5 block">{item.body_part}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto">
                  <div className="flex gap-2">
                    {(item.file_url || item.external_url) && (
                      <a
                        href={(item.file_url || item.external_url)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-navy-600 hover:text-navy-700 font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {item.type === "pdf" ? "Otwórz PDF" : "Otwórz link"} →
                      </a>
                    )}
                  </div>
                  <ContentActions
                    id={item.id}
                    isFavorite={item.is_favorite}
                    isOwn={!!item.practitioner_id}
                  />
                </div>
              </div>
            )
          })}
          </div>
        </>
      )}

      {/* Sticky builder bar when items selected */}
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
