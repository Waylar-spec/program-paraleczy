import Link from "next/link"
import { ClipboardList } from "lucide-react"

const TABS = [
  { label: "Ćwiczenia", href: "/biblioteka" },
  { label: "Szablony", href: "/biblioteka/szablony" },
  { label: "Protokoły", href: "/biblioteka/protokoly" },
  { label: "Edukacja", href: "/biblioteka/edukacja" },
  { label: "Kwestionariusze", href: "/biblioteka/kwestionariusze" },
]

export default function KwestionariuszePage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Biblioteka</h1>
          <p className="text-sm text-gray-500 mt-1">Kwestionariusze i narzędzia oceny</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab.href === "/biblioteka/kwestionariusze"
                  ? "border-navy-600 text-navy-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <ClipboardList size={28} className="text-gray-400" />
        </div>
        <h2 className="text-lg font-medium text-gray-900 mb-2">Kwestionariusze — wkrótce</h2>
        <p className="text-sm text-gray-500 max-w-sm">
          VAS, Oswestry, Oxford Knee i inne narzędzia oceny będą dostępne w kolejnej wersji.
        </p>
      </div>
    </div>
  )
}
