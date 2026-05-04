"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ClipboardList, X } from "lucide-react"

type PendingSurvey = {
  id: string
  surveyName: string
  programName: string
  schedule: string
}

interface Props {
  pending: PendingSurvey[]
  kod: string
}

const STORAGE_KEY = "survey_popup_dismissed"

export function SurveyPopup({ pending, kod }: Props) {
  const [visible, setVisible] = useState(false)
  const [current, setCurrent] = useState<PendingSurvey | null>(null)

  useEffect(() => {
    if (!pending.length) return
    const dismissed = sessionStorage.getItem(STORAGE_KEY)
    const dismissed_ids: string[] = dismissed ? JSON.parse(dismissed) : []
    const first = pending.find((s) => !dismissed_ids.includes(s.id))
    if (first) {
      setCurrent(first)
      // small delay so the page renders first
      const t = setTimeout(() => setVisible(true), 600)
      return () => clearTimeout(t)
    }
  }, [pending])

  function dismiss() {
    if (!current) return
    const dismissed = sessionStorage.getItem(STORAGE_KEY)
    const ids: string[] = dismissed ? JSON.parse(dismissed) : []
    ids.push(current.id)
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
    setVisible(false)
  }

  if (!visible || !current) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-navy-50 px-5 pt-5 pb-4 flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-navy-500 flex items-center justify-center shrink-0">
            <ClipboardList size={22} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm">Kwestionariusz do wypełnienia</p>
            <p className="text-xs text-gray-500 mt-0.5">{current.programName}</p>
          </div>
          <button onClick={dismiss} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <p className="text-base font-semibold text-gray-900 mb-1">{current.surveyName}</p>
          <p className="text-sm text-gray-500">
            Fizjoterapeuta poprosił Cię o wypełnienie tego kwestionariusza. Zajmie to tylko chwilę.
          </p>
        </div>

        {/* Actions */}
        <div className="px-5 pb-6 flex gap-3">
          <button
            onClick={dismiss}
            className="flex-1 h-11 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Przypomnij później
          </button>
          <Link
            href={`/p/${kod}/kwestionariusze/${current.id}`}
            className="flex-1 h-11 rounded-xl bg-navy-500 hover:bg-navy-600 text-white text-sm font-semibold flex items-center justify-center transition-colors"
          >
            Wypełnij teraz
          </Link>
        </div>
      </div>
    </div>
  )
}
