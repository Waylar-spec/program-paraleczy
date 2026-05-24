"use client"

import { useRef, useState } from "react"
import { Plus, X, Loader2, ImageIcon, ClipboardPaste } from "lucide-react"
import { uploadExerciseImage } from "@/lib/actions/exercises"
import { toast } from "sonner"

interface Props {
  value: string[]
  onChange: (urls: string[]) => void
  max?: number
}

function resizeToWebP(file: File | Blob, maxWidth: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => {
      const scale = img.width > maxWidth ? maxWidth / img.width : 1
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement("canvas")
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext("2d")
      if (!ctx) { reject(new Error("canvas context unavailable")); return }
      ctx.drawImage(img, 0, 0, w, h)
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("toBlob failed")), "image/webp", 0.85)
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file instanceof File ? file : new File([file], "img"))
  })
}

export function StepImagesUploader({ value, onChange, max = 4 }: Props) {
  const [uploading, setUploading] = useState<number | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  async function handleFile(index: number, file: File | Blob, name = "step.webp") {
    setUploading(index)
    try {
      const webpBlob = await resizeToWebP(file, 1200)
      const fd = new FormData()
      fd.append("file", webpBlob, name.replace(/\.[^.]+$/, "") + ".webp")
      const result = await uploadExerciseImage(fd)
      if ("error" in result) { toast.error("Błąd uploadu: " + result.error); return }
      const next = [...value]
      next[index] = result.url
      onChange(next.filter(Boolean))
    } catch (err) {
      toast.error("Błąd uploadu: " + (err instanceof Error ? err.message : String(err)))
    } finally {
      setUploading(null)
    }
  }

  function removeImage(index: number) {
    const next = [...value]
    next.splice(index, 1)
    onChange(next)
  }

  function handlePaste(e: React.ClipboardEvent) {
    const file = Array.from(e.clipboardData.items)
      .find(item => item.type.startsWith("image/"))?.getAsFile()
    if (!file) return
    e.preventDefault()
    const firstEmpty = Array.from({ length: max }, (_, i) => i).find(i => !value[i])
    if (firstEmpty === undefined) {
      toast.error("Wszystkie sloty są zajęte — usuń zdjęcie, żeby wkleić nowe")
      return
    }
    handleFile(firstEmpty, file)
  }

  const slots = Array.from({ length: max }, (_, i) => value[i] ?? null)

  return (
    <div className="space-y-1.5" onPaste={handlePaste}>
      <label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
        Zdjęcia kroków (maks. {max})
        <span className="text-gray-400 font-normal flex items-center gap-1">
          — <ClipboardPaste size={11} /> Ctrl+V wkleja do następnego wolnego slotu
        </span>
      </label>
      <div className="grid grid-cols-4 gap-2">
        {slots.map((url, i) => (
          <div key={i} className="relative aspect-square">
            {url ? (
              <>
                <img src={url} alt={`Krok ${i + 1}`} className="w-full h-full object-cover rounded-lg border border-gray-200" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-colors"
                >
                  <X size={10} className="text-gray-500 hover:text-red-500" />
                </button>
                <button
                  type="button"
                  onClick={() => inputRefs.current[i]?.click()}
                  className="absolute inset-0 rounded-lg bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100"
                >
                  <span className="text-white text-[10px] font-medium">Zmień</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => inputRefs.current[i]?.click()}
                disabled={uploading !== null}
                className="w-full h-full rounded-lg border-2 border-dashed border-gray-200 hover:border-navy-300 hover:bg-navy-50/30 transition-colors flex flex-col items-center justify-center gap-1"
              >
                {uploading === i ? (
                  <Loader2 size={16} className="text-navy-400 animate-spin" />
                ) : (
                  <>
                    <ImageIcon size={16} className="text-gray-300" />
                    <span className="text-[10px] text-gray-400">{i + 1}</span>
                  </>
                )}
              </button>
            )}
            <input
              ref={(el) => { inputRefs.current[i] = el }}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(i, file, file.name)
                e.target.value = ""
              }}
            />
          </div>
        ))}
      </div>
      <p className="text-[10px] text-gray-400">JPG / PNG / WebP — kompresowane do WebP przed uploadem</p>
    </div>
  )
}
