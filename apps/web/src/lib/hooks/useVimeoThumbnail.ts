"use client"

import { useState, useEffect } from "react"

// Module-level cache shared across all components — survives re-renders and
// prevents duplicate network requests for the same Vimeo URL.
const cache = new Map<string, string>()

export function useVimeoThumbnail(videoUrl: string | null): string | null {
  const [thumb, setThumb] = useState<string | null>(() =>
    videoUrl ? (cache.get(videoUrl) ?? null) : null
  )

  useEffect(() => {
    if (!videoUrl || !videoUrl.includes("vimeo")) return
    if (cache.has(videoUrl)) {
      setThumb(cache.get(videoUrl)!)
      return
    }

    const match = videoUrl.match(/vimeo\.com\/(?:video\/)?(\d+)/)
    if (!match) return

    let cancelled = false
    fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${match[1]}&width=640`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        if (data?.thumbnail_url) {
          cache.set(videoUrl, data.thumbnail_url)
          setThumb(data.thumbnail_url)
        }
      })
      .catch(() => {})

    return () => { cancelled = true }
  }, [videoUrl])

  return thumb
}
