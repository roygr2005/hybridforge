'use client'
import { useEffect, useState } from 'react'
import ProtectedLayout from '@/components/ProtectedLayout'
import { useAuth } from '@/hooks/useAuth'
import { useLang } from '@/hooks/useLang'
import { createClient } from '@/lib/supabase'
import { TrendingUp } from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import type { StrengthSession, StrengthSet, EnduranceSession } from '@/types/database'

type Period = '7' | '30' | '90'

export default function ProgressPage() {
  const { user, profile } = useAuth()
  const { t } = useLang(profile?.lang as 'fr' | 'en' | undefined)
  const lang = profile?.lang === 'en' ? 'en' : 'fr'
  const supabase = createClient()

  const [period, setPeriod] = useState<Period>('30')
  const [strengthSessions, setStrengthSessions] = useState<StrengthSession[]>([])
  const [sets, setSets] = useState<StrengthSet[]>([])
  const [enduranceSessions, setEnduranceSessions] = useState<EnduranceSession[]>([])

  useEffect(() => {
    if (!user) return
    const from = new Date(); from.setDate(from.getDate() - Number(period))
    const fromStr = from.toISOString().split('T')[0]

    Promise.all([
      supabase.from('strength_sessions').select('*').eq('user_id', user.id).gte('session_date', fromStr).order('session_date'),
      supabase.from('strength_sets').select('*').eq('user_id', user.id).gte('created_at', from.toISOString()),
      supabase.from('endurance_sessions').select('*').eq('user_id', user.id).gte('session_date', fromStr).order('session_date'),
    ]).then(([s, st, e]) => {
      setStrengthSessions(s.data ?? [])
      setSets(st.data ?? [])
      setEnduranceSessions(e.data ?? [])
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, period])

  // ---- GRAPHIQUE 1 : Séances par semaine (muscu + endurance séparés) ----
  const sessionsByWeek: Record<string, { muscu: number; endurance: number }> = {}
  const addToWeek = (date: string, type: 'muscu' | 'endurance') => {
    const d = new Date(date)
    const monday = new Date(d)
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    const key = monday.toISOString().split('T')[0].slice(5)
    if (!sessionsByWeek[key]) sessionsByWeek[key] = { muscu: 0, endurance: 0 }
    sessionsByWeek[key][type]++
  }
  strengthSessions.forEach(s => addToWeek(s.session_date, 'muscu'))
  enduranceSessions.forEach(s => addToWeek(s.session_date, 'endurance'))
  const freqData = Object.entries(sessionsByWeek)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, v]) => ({ week, [lang === 'fr' ? 'Muscu' : 'Strength']: v.muscu, [lang === 'fr' ? 'Endurance' : 'Endurance']: v.endurance }))

  // ---- GRAPHIQUE 2 : Charge max par exercice (PR) ----
  const prByExercise: Record<string, number> = {}
  sets.forEach(s => {
    if (!s.exercise || !s.weight_kg) return
    if (!prByExercise[s.exercise] || s.weight_kg > prByExercise[s.exercise]) {
      prByExercise[s.exercise] = s.weight_kg
    }
  })
  const prData = Object.entries(prByExercise)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([exercise, kg]) => ({ exercise: exercise.length > 12 ? exercise.slice(0, 12) + '…' : exercise, kg }))

  // ---- GRAPHIQUE 3 : Distance endurance par séance ----
  const distanceData = enduranceSessions
    .filter(s => s.distance_km)
    .map(s => ({ date: s.session_date.slice(5), km: Number(s.distance_km?.toFixed(2)), sport: s.sport }))

  const totalDistance = enduranceSessions.reduce((acc, s) => acc + (s.distance_km ?? 0), 0)
  const totalSessions = strengthSessions.length + enduranceSessions.length

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp size={24} className="text-purple-400" />{t.progress.title}
          </h1>
          <div className="flex gap-2">
            {(['7','30','90'] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${period === p ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
              >
                {p === '7' ? t.progress.week : p === '30' ? t.progress.month : t.progress.quarter}
              </button>
            ))}
          </div>
        </div>

        {/* Résumé */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card text-center">
            <p className="text-3xl font-bold text-green-400">{strengthSessions.length}</p>
            <p className="text-xs text-gray-400 mt-1">{lang === 'fr' ? 'Séances muscu' : 'Strength sessions'}</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-blue-400">{enduranceSessions.length}</p>
            <p className="text-xs text-gray-400 mt-1">{lang === 'fr' ? 'Séances endurance' : 'Endurance sessions'}</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-purple-400">{totalSessions}</p>
            <p className="text-xs text-gray-400 mt-1">{lang === 'fr' ? 'Total séances' : 'Total sessions'}</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-orange-400">{totalDistance.toFixed(0)}</p>
            <p className="text-xs text-gray-400 mt-1">km {lang === 'fr' ? 'parcourus' : 'covered'}</p>
          </div>
        </div>

        {/* Graphique 1 : Fréquence par semaine (muscu vs endurance) */}
        {freqData.length > 0 && (
          <div className="card">
            <h2 className="text-base font-semibold mb-1">{lang === 'fr' ? 'Séances par semaine' : 'Sessions per week'}</h2>
            <p className="text-xs text-gray-500 mb-4">{lang === 'fr' ? 'Muscu vs Endurance' : 'Strength vs Endurance'}</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={freqData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="week" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }} />
                <Bar dataKey={lang === 'fr' ? 'Muscu' : 'Strength'} fill="#22c55e" radius={[4,4,0,0]} stackId="a" />
                <Bar dataKey="Endurance" fill="#3b82f6" radius={[4,4,0,0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2 justify-center text-xs text-gray-400">
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded-sm inline-block" />{lang === 'fr' ? 'Muscu' : 'Strength'}</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded-sm inline-block" />Endurance</span>
            </div>
          </div>
        )}

        {/* Graphique 2 : PR par exercice */}
        {prData.length > 0 && (
          <div className="card">
            <h2 className="text-base font-semibold mb-1">{lang === 'fr' ? 'Charge max par exercice' : 'Max weight per exercise'}</h2>
            <p className="text-xs text-gray-500 mb-4">{lang === 'fr' ? 'Top 8 exercices' : 'Top 8 exercises'}</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={prData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} unit=" kg" />
                <YAxis type="category" dataKey="exercise" tick={{ fill: '#9ca3af', fontSize: 11 }} width={90} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }} formatter={(v) => [`${v} kg`, 'Max']} />
                <Bar dataKey="kg" fill="#a855f7" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Graphique 3 : Distance endurance */}
        {distanceData.length > 0 && (
          <div className="card">
            <h2 className="text-base font-semibold mb-1">{t.progress.enduranceDistance}</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={distanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} unit=" km" />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }} />
                <Line type="monotone" dataKey="km" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {strengthSessions.length === 0 && enduranceSessions.length === 0 && (
          <div className="card text-center py-12">
            <TrendingUp size={40} className="mx-auto text-gray-700 mb-3" />
            <p className="text-gray-500">{lang === 'fr' ? 'Commence à logger des séances pour voir ta progression !' : 'Start logging sessions to see your progress!'}</p>
          </div>
        )}
      </div>
    </ProtectedLayout>
  )
}
