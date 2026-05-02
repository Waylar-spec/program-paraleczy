"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { BookOpen, Users, MessageCircle, LogOut, Settings, ChevronDown, SlidersHorizontal } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { ProgramBuilderButton } from "@/components/exercises/ProgramBuilderButton"

const navItems = [
  { href: "/biblioteka", label: "Biblioteka", icon: BookOpen },
  { href: "/pacjenci", label: "Pacjenci", icon: Users },
  { href: "/komunikacja", label: "Komunikacja", icon: MessageCircle },
  { href: "/ustawienia", label: "Ustawienia", icon: SlidersHorizontal },
]

interface TopbarProps {
  userName?: string
}

export function Topbar({ userName }: TopbarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const initials = userName
    ? userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "??"

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <header className="h-14 border-b border-gray-200 bg-white flex items-center px-6 gap-8 sticky top-0 z-50">
      {/* Logo */}
      <Link href="/pacjenci" className="flex items-center gap-2 shrink-0">
        <Image src="/logo.png" alt="Para Leczy" width={28} height={28} className="rounded-md" />
        <span className="font-semibold text-gray-900 text-sm">Para Leczy</span>
      </Link>

      {/* Nav */}
      <nav className="flex items-center gap-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                active
                  ? "text-navy-600 bg-navy-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-3">
        <ProgramBuilderButton />

        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 outline-none"
          >
            <Avatar className="w-7 h-7">
              <AvatarFallback className="bg-navy-100 text-navy-600 text-xs font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline font-medium">{userName}</span>
            <ChevronDown size={14} className="text-gray-400" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => router.push("/ustawienia")}>
              <Settings size={14} />
              Ustawienia
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-600 gap-2 cursor-pointer"
            >
              <LogOut size={14} />
              Wyloguj się
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
