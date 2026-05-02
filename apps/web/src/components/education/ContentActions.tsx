"use client"

import { useState } from "react"
import { Star, Trash2 } from "lucide-react"
import { toggleEducationFavorite, deleteEducationalContent } from "@/lib/actions/education"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Props {
  id: string
  isFavorite: boolean
  isOwn: boolean
}

export function ContentActions({ id, isFavorite, isOwn }: Props) {
  const router = useRouter()
  const [fav, setFav] = useState(isFavorite)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleFavorite() {
    const next = !fav
    setFav(next)
    try {
      await toggleEducationFavorite(id, next)
      router.refresh()
    } catch {
      setFav(!next)
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
      return
    }
    setDeleting(true)
    try {
      await deleteEducationalContent(id)
      toast.success("Usunięto")
      router.refresh()
    } catch {
      toast.error("Błąd usuwania")
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleFavorite}
        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Star size={14} className={fav ? "text-yellow-400 fill-yellow-400" : "text-gray-400"} />
      </button>
      {isOwn && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          className={`p-1.5 rounded-lg transition-colors ${
            confirmDelete
              ? "bg-red-500 text-white"
              : "hover:bg-red-50 text-gray-400 hover:text-red-500"
          }`}
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  )
}
