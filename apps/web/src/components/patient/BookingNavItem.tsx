"use client"

import { CalendarDays } from "lucide-react"
import { useParams, usePathname } from "next/navigation"
import Link from "next/link"

export function BookingNavItem() {
  const params = useParams()
  const pathname = usePathname()
  const kod = params?.kod as string
  const href = `/p/${kod}/wizyta`
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
        isActive ? "text-[#e05c2a]" : "text-[#e05c2a] hover:bg-orange-50"
      }`}
    >
      <CalendarDays size={20} />
      <span className="text-xs font-medium">Umów wizytę</span>
    </Link>
  )
}
