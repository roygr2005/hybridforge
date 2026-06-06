'use client'
import { useState, useEffect } from 'react'
import { MapPin, Search, Wind, Droplets, Thermometer, RefreshCw } from 'lucide-react'
import { useLang } from '@/hooks/useLang'
import type { Lang } from '@/i18n/translations'

interface WeatherData {
  city: string
  temp: number
  feelsLike: number
  weatherCode: number
  windSpeed: number
  humidity: number
}

// Open-Meteo WMO weather codes → emoji + label
function getWeatherInfo(code: number, lang: Lang): { emoji: string; label: string } {
  const map: Record<number, { fr: string; en: string; emoji: string }> = {
    0:  { emoji: '☀️',  fr: 'Ensoleillé',     en: 'Sunny' },
    1:  { emoji: '🌤️', fr: 'Peu nuageux',     en: 'Mostly clear' },
    2:  { emoji: '⛅',  fr: 'Partiellement nuageux', en: 'Partly cloudy' },
    3:  { emoji: '☁️',  fr: 'Nuageux',         en: 'Overcast' },
    45: { emoji: '🌫️', fr: 'Brouillard',      en: 'Foggy' },
    48: { emoji: '🌫️', fr: 'Brouillard givrant', en: 'Icy fog' },
    51: { emoji: '🌦️', fr: 'Bruine légère',   en: 'Light drizzle' },
    53: { emoji: '🌦️', fr: 'Bruine',          en: 'Drizzle' },
    61: { emoji: '🌧️', fr: 'Pluie légère',    en: 'Light rain' },
    63: { emoji: '🌧️', fr: 'Pluie',           en: 'Rain' },
    65: { emoji: '🌧️', fr: 'Pluie forte',     en: 'Heavy rain' },
    71: { emoji: '❄️',  fr: 'Neige légère',    en: 'Light snow' },
    73: { emoji: '❄️',  fr: 'Neige',           en: 'Snow' },
    80: { emoji: '🌦️', fr: 'Averses',         en: 'Showers' },
    95: { emoji: '⛈️',  fr: 'Orage',           en: 'Thunderstorm' },
  }
  const best = Object.entries(map).reduce((prev, [k]) => {
    const kn = Number(k)
    if (kn <= code && kn > Number(prev)) return String(kn)
    return prev
  }, '0')
  const info = map[Number(best)] ?? { emoji: '🌡️', fr: 'Variable', en: 'Variable' }
  return { emoji: info.emoji, label: lang === 'en' ? info.en : info.fr }
}

// Conseil d'entraînement selon météo
function getTrainingTip(data: WeatherData, lang: Lang, t: { weather: Record<string, string> }): string {
  const { temp, windSpeed, weatherCode } = data
  if (weatherCode >= 61 && weatherCode <= 67) return t.weather.rainy
  if (weatherCode >= 80) return t.weather.rainy
  if (windSpeed > 40) return t.weather.windy
  if (temp > 30) return t.weather.tooHot
  if (temp < 5) return t.weather.tooCold
  if (temp >= 12 && temp <= 22 && windSpeed < 20) return t.weather.perfect
  return t.weather.goodForRun
}

interface Props { userLang?: Lang }

export default function WeatherWidget({ userLang }: Props) {
  const { t, lang } = useLang(userLang)
  const [city, setCity] = useState('')
  const [inputCity, setInputCity] = useState('')
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [locating, setLocating] = useState(false)

  // Load saved city
  useEffect(() => {
    const saved = localStorage.getItem('hf_weather_city')
    if (saved) { setCity(saved); fetchByCity(saved) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchByCity(cityName: string) {
    setLoading(true); setError('')
    try {
      // 1. Geocode city → lat/lon using Open-Meteo geocoding (free, no key)
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=fr&format=json`
      )
      const geoData = await geoRes.json()
      if (!geoData.results?.length) { setError(t.weather.error); setLoading(false); return }
      const { latitude, longitude, name } = geoData.results[0]
      await fetchByCoords(latitude, longitude, name)
    } catch {
      setError(t.weather.error)
    }
    setLoading(false)
  }

  async function fetchByCoords(lat: number, lon: number, cityName?: string) {
    setLoading(true); setError('')
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m&wind_speed_unit=kmh&timezone=auto`
      )
      const data = await res.json()
      const c = data.current
      setWeather({
        city: cityName ?? city,
        temp: Math.round(c.temperature_2m),
        feelsLike: Math.round(c.apparent_temperature),
        weatherCode: c.weather_code,
        windSpeed: Math.round(c.wind_speed_10m),
        humidity: c.relative_humidity_2m,
      })
      if (cityName) {
        setCity(cityName)
        localStorage.setItem('hf_weather_city', cityName)
      }
    } catch {
      setError(t.weather.error)
    }
    setLoading(false)
  }

  function useGeolocation() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async pos => {
        await fetchByCoords(pos.coords.latitude, pos.coords.longitude)
        setLocating(false)
      },
      () => { setLocating(false) }
    )
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (inputCity.trim()) fetchByCity(inputCity.trim())
  }

  const weatherInfo = weather ? getWeatherInfo(weather.weatherCode, lang) : null
  const tip = weather ? getTrainingTip(weather, lang, t) : ''

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-400 flex items-center gap-1.5">
          <MapPin size={14} /> {t.weather.title}
        </h2>
        {weather && (
          <button onClick={() => fetchByCity(city)} className="text-gray-500 hover:text-gray-300 transition-colors">
            <RefreshCw size={13} />
          </button>
        )}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={inputCity}
          onChange={e => setInputCity(e.target.value)}
          placeholder={t.weather.placeholder}
          className="text-sm py-1.5"
        />
        <button type="submit" className="btn-secondary text-xs px-2 py-1.5 shrink-0">
          <Search size={14} />
        </button>
        <button
          type="button"
          onClick={useGeolocation}
          disabled={locating}
          title={t.weather.useLocation}
          className="btn-secondary text-xs px-2 py-1.5 shrink-0"
        >
          <MapPin size={14} />
        </button>
      </form>

      {/* Weather display */}
      {loading && <p className="text-xs text-gray-500">{t.weather.loading}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}

      {weather && weatherInfo && !loading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">{weather.city}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{weather.temp}°C</span>
                <span className="text-xl">{weatherInfo.emoji}</span>
              </div>
              <p className="text-xs text-gray-400">{weatherInfo.label}</p>
            </div>
            <div className="space-y-1 text-right text-xs text-gray-400">
              <p className="flex items-center gap-1 justify-end"><Thermometer size={11} /> {t.weather.feelsLike} {weather.feelsLike}°</p>
              <p className="flex items-center gap-1 justify-end"><Wind size={11} /> {weather.windSpeed} km/h</p>
              <p className="flex items-center gap-1 justify-end"><Droplets size={11} /> {weather.humidity}%</p>
            </div>
          </div>
          <div className="bg-gray-800/60 rounded-lg px-3 py-2 text-xs">
            {tip}
          </div>
        </div>
      )}
    </div>
  )
}
