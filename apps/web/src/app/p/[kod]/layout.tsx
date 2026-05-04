import { MessageCircle, Dumbbell, Phone } from "lucide-react"
import Link from "next/link"
import { BookingNavItem } from "@/components/patient/BookingNavItem"

const PHONE = "665064377"

export default async function KodLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ kod: string }>
}) {
  const { kod } = await params

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {children}

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-gray-200 z-30 flex">
        <Link
          href={`/p/${kod}`}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-navy-600 hover:bg-gray-50 transition-colors"
        >
          <Dumbbell size={20} />
          <span className="text-xs font-medium">Programy</span>
        </Link>
        <Link
          href={`/p/${kod}/czat`}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-gray-400 hover:bg-gray-50 transition-colors"
        >
          <MessageCircle size={20} />
          <span className="text-xs font-medium">Czat</span>
        </Link>
        <BookingNavItem />
        <a
          href={`tel:${PHONE}`}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-gray-400 hover:bg-gray-50 transition-colors"
        >
          <Phone size={20} />
          <span className="text-xs font-medium">Zadzwoń</span>
        </a>
      </nav>
    </div>
  )
}
