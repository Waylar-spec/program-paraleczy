"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { pl } from "date-fns/locale"
import { User, Search, X, Trash2, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react"
import { deletePatient, unarchivePatient } from "@/lib/actions/patients"
import { toast } from "sonner"

type Program = {
  id: string
  name: string
  status: string
  start_date: string
  end_date: string | null
}

type Patient = {
  id: string
  first_name: string
  last_name: string
  birth_year: number | null
  gender: string | null
  access_code: string
  last_seen_at: string | null
  archived_at: string | null
  patient_programs: Program[]
}

interface PatientsListProps {
  patients: Patient[]
  isArchived?: boolean
  search: string
  page: number
  totalPages: number
  count: number
}

function getActiveProgram(programs: Program[]) {
  return programs.find((p) => p.status === "active") ?? programs[0] ?? null
}

export function PatientsList({
  patients,
  isArchived = false,
  search,
  page,
  totalPages,
  count,
}: PatientsListProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [localSearch, setLocalSearch] = useState(search)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Keep local input in sync when URL-driven search changes
  useEffect(() => {
    setLocalSearch(search)
  }, [search])

  /** Build a URL for this page preserving the archiwum flag */
  function buildUrl({ q, strona }: { q?: string; strona?: number }) {
    const params = new URLSearchParams()
    if (isArchived) params.set("archiwum", "1")
    const finalQ = q !== undefined ? q : search
    if (finalQ.trim()) params.set("q", finalQ.trim())
    const finalPage = strona !== undefined ? strona : page
    if (finalPage > 0) params.set("strona", String(finalPage))
    const qs = params.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  function handleSearchChange(value: string) {
    setLocalSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      router.replace(buildUrl({ q: value, strona: 0 }))
    }, 350)
  }

  function clearSearch() {
    setLocalSearch("")
    if (debounceRef.current) clearTimeout(debounceRef.current)
    router.replace(buildUrl({ q: "", strona: 0 }))
  }

  async function handleDelete(id: string) {
    setLoadingId(id)
    try {
      await deletePatient(id)
      toast.success("Pacjent usunięty")
      router.refresh()
    } catch {
      toast.error("Nie udało się usunąć pacjenta")
    } finally {
      setLoadingId(null)
      setConfirmDeleteId(null)
    }
  }

  async function handleUnarchive(id: string) {
    setLoadingId(id)
    try {
      await unarchivePatient(id)
      toast.success("Pacjent przywrócony")
      router.refresh()
    } catch {
      toast.error("Nie udało się przywrócić pacjenta")
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={localSearch}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Szukaj pacjentów..."
          className="w-full h-9 pl-9 pr-8 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-navy-400 bg-white"
        />
        {localSearch && (
          <button
            onClick={clearSearch}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={13} />
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Table header */}
        <div
          className={`grid gap-4 px-5 py-3 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wide ${
            isArchived ? "grid-cols-[40px_1fr_120px_auto]" : "grid-cols-[40px_1fr_120px_1fr]"
          }`}
        >
          <div></div>
          <div>Pacjent</div>
          <div>Rok ur.</div>
          <div>{isArchived ? "Akcje" : "Aktywny program"}</div>
        </div>

        {/* Rows */}
        {patients.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">
            {localSearch ? `Brak wyników dla "${localSearch}"` : "Brak pacjentów"}
          </div>
        ) : (
          patients.map((patient) => {
            const activeProgram = getActiveProgram(patient.patient_programs)
            const endDate = activeProgram?.end_date ? new Date(activeProgram.end_date) : null
            const isConfirming = confirmDeleteId === patient.id
            const isLoading = loadingId === patient.id

            const rowContent = (
              <>
                <div className="text-gray-400 text-sm text-center">
                  <User size={16} className="mx-auto" />
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-900">
                    {patient.first_name}{" "}
                    <span className="font-semibold">{patient.last_name}</span>
                  </span>
                  {patient.last_seen_at && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Ostatnio widziany{" "}
                      {formatDistanceToNow(new Date(patient.last_seen_at), {
                        addSuffix: true,
                        locale: pl,
                      })}
                    </p>
                  )}
                </div>

                <div className="text-sm text-gray-600">{patient.birth_year ?? "—"}</div>
              </>
            )

            if (isArchived) {
              return (
                <div
                  key={patient.id}
                  className={`grid grid-cols-[40px_1fr_120px_auto] gap-4 px-5 py-3.5 border-b border-gray-50 items-center last:border-0 transition-colors ${
                    isConfirming ? "bg-red-50" : ""
                  }`}
                >
                  {rowContent}
                  <div className="flex items-center gap-1.5 justify-end">
                    {isConfirming ? (
                      <>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          disabled={isLoading}
                          className="h-7 px-2 rounded-lg bg-white border border-gray-200 text-xs text-gray-600 hover:bg-gray-50"
                        >
                          Anuluj
                        </button>
                        <button
                          onClick={() => handleDelete(patient.id)}
                          disabled={isLoading}
                          className="h-7 px-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-medium disabled:opacity-50"
                        >
                          {isLoading ? "..." : "Usuń bezpowrotnie"}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleUnarchive(patient.id)}
                          disabled={isLoading}
                          title="Przywróć pacjenta"
                          className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-navy-600 hover:border-navy-300 transition-colors disabled:opacity-50"
                        >
                          <RotateCcw size={13} />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(patient.id)}
                          title="Usuń pacjenta"
                          className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-300 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            }

            return (
              <Link
                key={patient.id}
                href={`/pacjenci/${patient.id}`}
                className="grid grid-cols-[40px_1fr_120px_1fr] gap-4 px-5 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition-colors items-center last:border-0"
              >
                {rowContent}

                <div>
                  {activeProgram ? (
                    <div>
                      <p className="text-sm text-navy-600 font-medium leading-tight">
                        {activeProgram.name}
                      </p>
                      {endDate && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          kończy się{" "}
                          {endDate.toLocaleDateString("pl-PL", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Brak programu</span>
                  )}
                </div>
              </Link>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Strona {page + 1} z {totalPages} · {count} pacjentów łącznie
          </p>
          <div className="flex items-center gap-1.5">
            {page > 0 ? (
              <Link
                href={buildUrl({ strona: page - 1 })}
                className="h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft size={15} />
              </Link>
            ) : (
              <span className="h-8 w-8 rounded-lg border border-gray-100 flex items-center justify-center text-gray-300 cursor-not-allowed">
                <ChevronLeft size={15} />
              </span>
            )}
            {page + 1 < totalPages ? (
              <Link
                href={buildUrl({ strona: page + 1 })}
                className="h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <ChevronRight size={15} />
              </Link>
            ) : (
              <span className="h-8 w-8 rounded-lg border border-gray-100 flex items-center justify-center text-gray-300 cursor-not-allowed">
                <ChevronRight size={15} />
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
