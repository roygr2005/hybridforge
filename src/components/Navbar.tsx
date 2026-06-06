'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Zap, Dumbbell, Activity, TrendingUp, Bot, User, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useLang } from '@/hooks/useLang'
import { useAuth } from '@/hooks/useAuth'
import clsx from 'clsx'

export default function Navbar() {
  const { t, lang, setLang } = useLang()
  const { profile, signOut } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const links = [
    { href: '/dashboard',  label: t.nav.dashboard,  icon: <Activity size={18} /> },
    { href: '/strength',   label: t.nav.strength,   icon: <Dumbbell size={18} /> },
    { href: '/endurance',  label: t.nav.endurance,  icon: <Activity size={18} /> },
    { href: '/progress',   label: t.nav.progress,   icon: <TrendingUp size={18} /> },
    { href: '/ai-coach',   label: t.nav.aiCoach,    icon: <Bot size={18} /> },
    { href: '/profile',    label: t.nav.profile,    icon: <User size={18} /> },
  ]

  async function handleSignOut() {
    await signOut()
    router.push('/')
  }

  return (
    <nav className="bg-gray-900 text-white shadow-lg border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-orange-400">
          <Zap size={22} fill="currentColor" />
          HybridForge
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors',
                pathname.startsWith(l.href)
                  ? 'bg-orange-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              )}
            >
              {l.icon}
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
            className="text-xs px-2 py-1 rounded border border-gray-600 text-gray-300 hover:border-orange-400 hover:text-orange-400 transition-colors font-medium"
          >
            {lang === 'fr' ? '🇬🇧 EN' : '🇫🇷 FR'}
          </button>
          {profile?.is_premium && (
            <span className="text-xs px-2 py-0.5 bg-yellow-500 text-black rounded-full font-semibold">Premium</span>
          )}
          <button onClick={handleSignOut} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
            <LogOut size={16} /> {t.nav.logout}
          </button>
        </div>

        <button className="md:hidden text-gray-300" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-gray-800 px-4 pb-4 flex flex-col gap-1">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className={clsx(
                'flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm',
                pathname.startsWith(l.href) ? 'bg-orange-600 text-white' : 'text-gray-300 hover:bg-gray-700'
              )}
            >
              {l.icon} {l.label}
            </Link>
          ))}
          <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-700">
            <button onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')} className="text-xs px-2 py-1 rounded border border-gray-600 text-gray-300">
              {lang === 'fr' ? '🇬🇧 EN' : '🇫🇷 FR'}
            </button>
            <button onClick={handleSignOut} className="flex items-center gap-1.5 text-sm text-gray-400">
              <LogOut size={16} /> {t.nav.logout}
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
