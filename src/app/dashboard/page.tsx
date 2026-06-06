'use client'
import { useEffect, useState } from 'react'
import ProtectedLayout from '@/components/ProtectedLayout'
import StatCard from '@/components/StatCard'
import WeatherWidget from '@/components/WeatherWidget'
import { useAuth } from '@/hooks/useAuth'
import { useLang } from '@/hooks/useLang'
import { createClient } from '@/lib/supabase'
import { Dumbbell, Activity } from 'lucide-react'
import Link from 'next/link'
import type { StrengthSession, EnduranceSession } from '@/types/database'

const sportIcons: Record<string, string> = { running:'🏃', cycling:'🚴', swimming:'🏊', rowing:'🚣', other:'⚡' }

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const { t, lang } = useLang(profile?.lang as 'fr' | 'en' | undefined)
  const supabase = createClient()

  const [strengthSessions, setStrengthSessions] = useState<StrengthSession[]>([])
  const [enduranceSessions, setEnduranceSessions] = useState<EnduranceSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('strength_sessions').select('*').eq('user_id', user.id).order('session_date', { ascending: false }).limit(20),
      supabase.from('endurance_sessions').select('*').eq('user_id', user.id).order('session_date', { ascending: false }).limit(20),
    ]).then(([s, e]) => {
      setStrengthSessions(s.data ?? [])
      setEnduranceSessions(e.data ?? [])
      setLoading(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
  const weekStr = weekAgo.toISOString().split('T')[0]
  const weeklySessions = strengthSessions.filter(s => s.session_date >= weekStr)
  const weeklyEndurance = enduranceSessions.filter(s => s.session_date >= weekStr)

  const distanceBySport: Record<string, number> = {}
  weeklyEndurance.forEach(s => {
    if (!s.distance_km) return
    distanceBySport[s.sport] = (distanceBySport[s.sport] ?? 0) + s.distance_km
  })

  const sportLabels = t.sports

  const recentAll = [
    ...strengthSessions.slice(0, 5).map(s => ({ type: 'strength' as const, name: s.name, date: s.session_date, id: s.id })),
    ...enduranceSessions.slice(0, 5).map(s => ({ type: 'endurance' as const, name: s.sport, date: s.session_date, id: s.id })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6)

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">
            {t.dashboard.welcome}, {profile?.full_name?.split(' ')[0] ?? ''}! 👋
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {new Date().toLocaleDateString(lang === 'en' ? 'en-GB' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {loading ? (
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-gray-800 rounded-xl animate-pulse" />)}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <StatCard label={t.dashboard.strengthSessions} value={strengthSessions.length} icon={<Dumbbell size={20} />} color="green" />
                  <StatCard label={t.dashboard.enduranceSessions} value={enduranceSessions.length} icon={<Activity size={20} />} color="blue" />
                  <StatCard label={t.dashboard.strengthWeek} value={weeklySessions.length} icon={<Dumbbell size={20} />} color="purple" />
                  <StatCard label={t.dashboard.enduranceWeek} value={weeklyEndurance.length} icon={<Activity size={20} />} color="orange" />
                </div>

                {Object.keys(distanceBySport).length > 0 && (
                  <div className="card">
                    <h2 className="text-sm font-semibold text-gray-400 mb-3">{t.dashboard.distancesWeek}</h2>
                    <div className="flex flex-wrap gap-3">
                      {Object.entries(distanceBySport).map(([sport, km]) => (
                        <div key={sport} className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
                          <span>{sportIcons[sport]}</span>
                          <span className="font-medium">{km.toFixed(1)} km</span>
                          <span className="text-xs text-gray-500">{sportLabels[sport as keyof typeof sportLabels] ?? sport}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex flex-wrap gap-3">
              <Link href="/strength" className="bg-green-600 hover:bg-green-500 text-white font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm">
                <Dumbbell size={16} /> {t.dashboard.newStrength}
              </Link>
              <Link href="/endurance" className="bg-gray-700 hover:bg-gray-600 text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm">
                <Activity size={16} /> {t.dashboard.newEndurance}
              </Link>
            </div>

            <div className="card">
              <h2 className="text-lg font-semibold mb-4">{t.dashboard.recentActivity}</h2>
              {recentAll.length === 0 ? (
                <p className="text-gray-500 text-sm">{t.dashboard.noActivity}</p>
              ) : (
                <div className="space-y-2">
                  {recentAll.map(s => (
                    <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${s.type === 'strength' ? 'bg-green-900/40 text-green-400' : 'bg-blue-900/40 text-blue-400'}`}>
                          {s.type === 'strength' ? <Dumbbell size={16} /> : <span className="text-base">{sportIcons[s.name] ?? '⚡'}</span>}
                        </div>
                        <span className="font-medium">
                          {s.type === 'strength' ? s.name : (sportLabels[s.name as keyof typeof sportLabels] ?? s.name)}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(s.date).toLocaleDateString(lang === 'en' ? 'en-GB' : 'fr-FR')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Weather sidebar */}
          <div>
            <WeatherWidget userLang={profile?.lang as 'fr' | 'en' | undefined} />
          </div>
        </div>
      </div>
    </ProtectedLayout>
  )
}
