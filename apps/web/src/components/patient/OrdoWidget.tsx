"use client"

import { useEffect, useRef } from "react"

export function OrdoWidget() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const iframe = document.createElement("iframe")
    iframe.src = "https://kalendarz.paraleczy.pl/widget/rejestracja"
    iframe.style.cssText =
      "width:100%;border:none;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.1);min-height:600px;display:block;"
    iframe.setAttribute("scrolling", "no")
    container.appendChild(iframe)

    function onMessage(e: MessageEvent) {
      if (!e.data) return
      if (e.data.type === "ordo-resize") {
        const sy = window.scrollY
        iframe.style.height = e.data.height + "px"
        window.scrollTo(0, sy)
      }
      if (e.data.type === "ordo-scroll-top") {
        container.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }

    window.addEventListener("message", onMessage)
    return () => {
      window.removeEventListener("message", onMessage)
      if (container.contains(iframe)) container.removeChild(iframe)
    }
  }, [])

  return <div ref={containerRef} />
}
