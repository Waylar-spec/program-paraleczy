"use client"

import { Dumbbell, MessageCircle, CalendarDays, Phone, Pill } from "lucide-react"
import { useParams, usePathname } from "next/navigation"
import Link from "next/link"

const PHONE = "665064377"

export function PatientBottomNav() {
  const params = useParams()
  const pathname = usePathname()
  const kod = params?.kod as string

  const items = [
    { href: `/p/${kod}`, icon: Dumbbell, label: "Programy", exact: true },
    { href: `/p/${kod}/suplementy`, icon: Pill, label: "Suplementy", exact: false },
    { href: `/p/${kod}/czat`, icon: MessageCircle, label: "Czat", exact: false },
    { href: `/p/${kod}/wizyta`, icon: CalendarDays, label: "Umów wizytę", exact: false, accent: "text-[#e05c2a]" },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-gray-200 z-30 flex">
      {items.map(({ href, icon: Icon, label, exact, accent }) => {
        const isActive = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors hover:bg-gray-50 ${
              isActive
                ? (accent ?? "text-navy-600")
                : accent
                  ? accent + " opacity-70"
                  : "text-gray-400"
            }`}
          >
            <Icon size={20} />
            <span className="text-xs font-medium">{label}</span>
          </Link>
        )
      })}
      <a
        href={`tel:${PHONE}`}
        className="flex-1 flex flex-col items-center justify-center gap-0.5 text-gray-400 hover:bg-gray-50 transition-colors"
      >
        <Phone size={20} />
        <span className="text-xs font-medium">Zadzwoń</span>
      </a>
    </nav>
  )
}
