'use client'
import { useEffect, useState } from 'react'
import ProtectedLayout from '@/components/ProtectedLayout'
import { useAuth } from '@/hooks/useAuth'
import { useLang } from '@/hooks/useLang'
import { createClient } from '@/lib/supabase'
import { Plus, Activity } from 'lucide-react'
import type { EnduranceSession } from '@/types/database'

type Sport = EnduranceSession['sport']

const sportIcons: Record<Sport, string> = {
  running: '🏃',
  cycling: '🚴',
  swimming: '🏊',
  rowing: '🚣',
  other: '⚡',
}

const sportLabels: Record<Sport, { fr: string; en: string }> = {
  running:  { fr: 'Course à pied', en: 'Running' },
  cycling:  { fr: 'Vélo',          en: 'Cycling' },
  swimming: { fr: 'Natation',      en: 'Swimming' },
  rowing:   { fr: 'Aviron',        en: 'Rowing' },
  other:    { fr: 'Autre',         en: 'Other' },
}

// Convertit "MM:SS" → secondes
function parsePace(str: string): number | null {
  const parts = str.split(':')
  if (parts.length === 2) {
    const m = parseInt(parts[0]); const s = parseInt(parts[1])
    if (!isNaN(m) && !isNaN(s)) return m * 60 + s
  }
  return null
}

// Secondes → "MM:SS/km"
function formatPace(sec: number | null) {
  if (!sec) return '-'
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}/km`
}

// Calcule l'allure en sec/km depuis distance (km) et durée (min)
function calcPaceSec(distanceKm: number, durationMin: number): number {
  return Math.round((durationMin * 60) / distanceKm)
}

// Affiche la durée : "45 min" ou "1h30" si >= 60
function formatDuration(min: number) {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`
}

export default function EndurancePage() {
  const { user, profile } = useAuth()
  const { t } = useLang(profile?.lang as 'fr' | 'en' | undefined)
  const lang = profile?.lang === 'en' ? 'en' : 'fr'
  const supabase = createClient()

  const [showForm, setShowForm] = useState(false)
  const [sport, setSport] = useState<Sport>('running')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [duration, setDuration] = useState<number | ''>('')
  const [distance, setDistance] = useState<number | ''>('')
  const [avgPace, setAvgPace] = useState('')        // saisi manuellement ou auto-calculé
  const [avgPaceAuto, setAvgPaceAuto] = useState(false) // true = calculé auto
  const [avgSpeed, setAvgSpeed] = useState<number | ''>('')
  const [avgHr, setAvgHr] = useState<number | ''>('')
  const [maxHr, setMaxHr] = useState<number | ''>('')
  const [elevation, setElevation] = useState<number | ''>('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  const [sessions, setSessions] = useState<EnduranceSession[]>([])

  useEffect(() => {
    if (!user) return
    fetchSessions()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Auto-calcul de l'allure dès que distance ET durée sont renseignés (course/natation)
  useEffect(() => {
    if ((sport === 'running' || sport === 'swimming') && duration !== '' && distance !== '' && Number(distance) > 0) {
      const sec = calcPaceSec(Number(distance), Number(duration))
      setAvgPace(`${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`)
      setAvgPaceAuto(true)
    } else {
      setAvgPaceAuto(false)
    }
  }, [duration, distance, sport])

  async function fetchSessions() {
    const { data } = await supabase
      .from('endurance_sessions')
      .select('*')
      .eq('user_id', user!.id)
      .order('session_date', { ascending: false })
    setSessions(data ?? [])
  }

  async function handleSave() {
    if (!user || !duration) return
    setSaving(true)

    await supabase.from('endurance_sessions').insert({
      user_id: user.id,
      sport,
      duration_minutes: Number(duration),
      distance_km: distance === '' ? null : Number(distance),
      avg_pace_sec: avgPace ? parsePace(avgPace) : null,
      avg_speed_kmh: avgSpeed === '' ? null : Number(avgSpeed),
      avg_hr: avgHr === '' ? null : Number(avgHr),
      max_hr: maxHr === '' ? null : Number(maxHr),
      elevation_m: elevation === '' ? null : Number(elevation),
      notes: notes || null,
      session_date: date,
    })

    setSaving(false)
    setSavedMsg(t.common.success)
    setTimeout(() => setSavedMsg(''), 3000)
    setShowForm(false)
    setDuration(''); setDistance(''); setAvgPace(''); setAvgSpeed(''); setAvgHr(''); setMaxHr(''); setElevation(''); setNotes('')
    fetchSessions()
  }

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Activity size={24} className="text-blue-400" />{t.endurance.title}</h1>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} /> {t.endurance.newSession}
          </button>
        </div>

        {savedMsg && <div className="bg-green-900/30 border border-green-700 text-green-400 px-4 py-2 rounded-lg text-sm">{savedMsg}</div>}

        {showForm && (
          <div className="card space-y-4">
            <h2 className="font-semibold text-lg">{t.endurance.newSession}</h2>

            {/* Sport selector */}
            <div>
              <label>{t.endurance.sport}</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {(['running','cycling','swimming','rowing','other'] as Sport[]).map(s => (
                  <button
                    key={s}
                    onClick={() => { setSport(s); setAvgPace(''); setAvgSpeed('') }}
                    className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 border transition-colors ${sport === s ? 'border-blue-500 bg-blue-900/30 text-blue-400' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}
                  >
                    {sportIcons[s]} {sportLabels[s][lang]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label>{t.endurance.date}</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div>
                <label>{t.endurance.duration}</label>
                <input type="number" value={duration} onChange={e => setDuration(e.target.value === '' ? '' : Number(e.target.value))} placeholder="45" />
              </div>
              <div>
                <label>{t.endurance.distance}</label>
                <input type="number" step="0.01" value={distance} onChange={e => setDistance(e.target.value === '' ? '' : Number(e.target.value))} placeholder="10.5" />
              </div>

              {/* Allure auto-calculée pour course + natation */}
              {(sport === 'running' || sport === 'swimming') && (
                <div>
                  <label className="flex items-center gap-2">
                    {t.endurance.avgPace}
                    {avgPaceAuto && <span className="text-xs text-green-400 font-normal">(auto)</span>}
                  </label>
                  <input
                    value={avgPace}
                    onChange={e => { setAvgPace(e.target.value); setAvgPaceAuto(false) }}
                    placeholder="5:30"
                  />
                </div>
              )}

              {sport === 'cycling' && (
                <div>
                  <label>{t.endurance.avgSpeed}</label>
                  <input type="number" step="0.1" value={avgSpeed} onChange={e => setAvgSpeed(e.target.value === '' ? '' : Number(e.target.value))} placeholder="28" />
                </div>
              )}

              <div>
                <label>{t.endurance.avgHr}</label>
                <input type="number" value={avgHr} onChange={e => setAvgHr(e.target.value === '' ? '' : Number(e.target.value))} placeholder="145" />
              </div>
              <div>
                <label>{t.endurance.maxHr}</label>
                <input type="number" value={maxHr} onChange={e => setMaxHr(e.target.value === '' ? '' : Number(e.target.value))} placeholder="175" />
              </div>
              <div>
                <label>{t.endurance.elevation}</label>
                <input type="number" value={elevation} onChange={e => setElevation(e.target.value === '' ? '' : Number(e.target.value))} placeholder="250" />
              </div>
            </div>

            <div>
              <label>{t.endurance.notes}</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
            </div>

            <div className="flex gap-3">
              <button onClick={handleSave} disabled={saving || !duration} className="btn-primary">
                {saving ? t.common.loading : t.endurance.saveSession}
              </button>
              <button onClick={() => setShowForm(false)} className="btn-secondary">{t.common.cancel}</button>
            </div>
          </div>
        )}

        {/* Historique */}
        <div>
          <h2 className="text-lg font-semibold mb-3">{t.endurance.history}</h2>
          {sessions.length === 0 ? (
            <p className="text-gray-500 text-sm">{t.endurance.noSessions}</p>
          ) : (
            <div className="space-y-2">
              {sessions.map(s => (
                <div key={s.id} className="card flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{sportIcons[s.sport]}</span>
                    <div>
                      <p className="font-medium">{sportLabels[s.sport][lang]}</p>
                      <div className="flex gap-3 text-sm text-gray-400 flex-wrap">
                        <span>{formatDuration(s.duration_minutes)}</span>
                        {s.distance_km && <span>{s.distance_km} km</span>}
                        {s.avg_pace_sec && <span>{formatPace(s.avg_pace_sec)}</span>}
                        {s.avg_speed_kmh && <span>{s.avg_speed_kmh} km/h</span>}
                        {s.avg_hr && <span>❤️ {s.avg_hr} bpm</span>}
                        {s.elevation_m && <span>↑ {s.elevation_m} m</span>}
                      </div>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500 shrink-0">
                    {new Date(s.session_date).toLocaleDateString(lang === 'en' ? 'en-GB' : 'fr-FR')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedLayout>
  )
}
