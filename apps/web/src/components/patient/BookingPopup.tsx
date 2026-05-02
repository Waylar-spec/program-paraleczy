"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { createPortal } from "react-dom"
import { X, Loader2, CalendarDays } from "lucide-react"

const BOOKING_URL = "https://kalendarz.paraleczy.pl/widget/rejestracja"

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function BookingPopup({ isOpen, onClose }: Props) {
  const [loaded, setLoaded] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { if (isOpen) setLoaded(false) }, [isOpen])

  const handleClose = useCallback(() => onClose(), [onClose])

  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isOpen, handleClose])

  if (!mounted || !isOpen) return null

  return createPortal(
    <div className="fixed inset-0 flex items-end sm:items-center justify-center" style={{ zIndex: 99999 }}>
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.6)" }} onClick={handleClose} />
      <div
        className="relative flex flex-col w-full sm:max-w-[1100px] sm:mx-4 bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
        style={{ height: "92svh" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#e05c2a]/10 flex items-center justify-center shrink-0">
              <CalendarDays size={18} className="text-[#e05c2a]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-tight">Zarezerwuj wizytę</p>
              <p className="text-xs text-gray-400 leading-tight">Wybierz specjalistę i termin</p>
            </div>
          </div>
          <button onClick={handleClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <X size={15} className="text-gray-600" />
          </button>
        </div>
        <div className="relative flex-1 min-h-0">
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
              <Loader2 size={28} className="text-[#e05c2a] animate-spin" />
            </div>
          )}
          <iframe src={BOOKING_URL} allow="payment" className="w-full h-full border-0" onLoad={() => setLoaded(true)} />
        </div>
      </div>
    </div>,
    document.body
  )
}

export function BookingButton({ label = "Zarezerwuj wizytę" }: { label?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full h-12 rounded-2xl border-2 border-[#e05c2a] text-[#e05c2a] font-semibold text-sm flex items-center justify-center gap-2"
      >
        <CalendarDays size={17} />
        {label}
      </button>
      <BookingPopup isOpen={open} onClose={() => setOpen(false)} />
    </>
  )
}
