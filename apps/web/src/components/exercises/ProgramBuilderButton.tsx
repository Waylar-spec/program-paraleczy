"use client"

import { useProgramBuilder } from "@/store/programBuilder"
import { ProgramBuilderPanel } from "./ProgramBuilderPanel"

export function ProgramBuilderButton() {
  const { exercises, contentItems, open } = useProgramBuilder()
  const count = exercises.length + contentItems.length

  return (
    <>
      <button
        onClick={open}
        className="relative inline-flex items-center gap-1.5 h-7 px-3 rounded-lg bg-navy-500 hover:bg-navy-600 text-white text-xs font-medium transition-colors"
      >
        Edytor programów
        {count > 0 && (
          <span className="ml-0.5 bg-white text-navy-600 rounded-full w-4 h-4 text-[10px] font-bold flex items-center justify-center leading-none">
            {count}
          </span>
        )}
      </button>
      <ProgramBuilderPanel />
    </>
  )
}
