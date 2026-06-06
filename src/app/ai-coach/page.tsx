'use client'
import { useState, useRef, useEffect } from 'react'
import ProtectedLayout from '@/components/ProtectedLayout'
import { useAuth } from '@/hooks/useAuth'
import { useLang } from '@/hooks/useLang'
import { Bot, Send, Lock, Sparkles } from 'lucide-react'

interface Message { role: 'user' | 'assistant'; content: string }

// Simulated AI responses — replace with real API call when ready
const MOCK_RESPONSES: Record<string, string> = {
  default_fr: `Bonjour ! Je suis votre coach IA personnalisé. Basé sur vos données d'entraînement, voici quelques conseils :

• **Récupération** : Assurez-vous d'avoir au moins 48h de repos entre deux séances du même groupe musculaire.
• **Progression** : Augmentez les charges de 2,5 à 5% par semaine maximum pour éviter les blessures.
• **Nutrition** : Après l'effort, consommez protéines + glucides dans les 30-60 minutes pour optimiser la récupération.

Posez-moi vos questions spécifiques !`,
  default_en: `Hello! I'm your personalized AI coach. Based on your training data, here are some tips:

• **Recovery**: Make sure to get at least 48h rest between sessions targeting the same muscle group.
• **Progression**: Increase weights by 2.5–5% per week maximum to avoid injuries.
• **Nutrition**: After training, consume protein + carbs within 30–60 minutes to optimize recovery.

Ask me your specific questions!`,
}

function getMockResponse(message: string, lang: string): string {
  const lower = message.toLowerCase()
  if (lang === 'en') {
    if (lower.includes('sleep') || lower.includes('recover')) return 'Sleep is the most underrated performance lever. Aim for 7–9h per night. If you train in the evening, avoid caffeine after 2pm.'
    if (lower.includes('cardio') || lower.includes('run')) return 'For complementing strength with cardio, Zone 2 (conversational pace) for 2–3 sessions/week is ideal — it improves aerobic base without impacting muscle recovery.'
    if (lower.includes('protein')) return 'Aim for 1.6–2.2g of protein per kg of bodyweight daily. Spread intake across 3–4 meals for optimal muscle protein synthesis.'
    return MOCK_RESPONSES.default_en
  } else {
    if (lower.includes('sommeil') || lower.includes('récupér')) return 'Le sommeil est le levier de performance le plus sous-estimé. Visez 7–9h par nuit. Si vous vous entraînez le soir, évitez la caféine après 14h.'
    if (lower.includes('cardio') || lower.includes('course') || lower.includes('endurance')) return 'Pour combiner musculation et cardio, le Zone 2 (allure conversationnelle) 2–3 fois par semaine est idéal — il améliore la base aérobie sans impacter la récupération musculaire.'
    if (lower.includes('protéine') || lower.includes('nutrition')) return 'Visez 1,6 à 2,2g de protéines par kg de poids corporel par jour. Répartissez les apports sur 3–4 repas pour une synthèse protéique optimale.'
    return MOCK_RESPONSES.default_fr
  }
}

export default function AiCoachPage() {
  const { profile } = useAuth()
  const { t, lang } = useLang(profile?.lang as 'fr' | 'en' | undefined)
  const isPremium = profile?.is_premium ?? false

  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: lang === 'en' ? MOCK_RESPONSES.default_en : MOCK_RESPONSES.default_fr }
  ])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!input.trim() || !isPremium) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setThinking(true)

    // Simulate API latency — replace with real AI API call here
    await new Promise(r => setTimeout(r, 1200 + Math.random() * 800))
    const reply = getMockResponse(userMsg, lang)
    setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    setThinking(false)
  }

  return (
    <ProtectedLayout>
      <div className="space-y-4 max-w-3xl mx-auto">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot size={24} className="text-yellow-400" />
            {t.aiCoach.title}
          </h1>
          <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full font-medium flex items-center gap-1">
            <Sparkles size={10} /> {t.aiCoach.premiumBadge}
          </span>
        </div>

        {!isPremium ? (
          /* PAYWALL */
          <div className="card flex flex-col items-center text-center py-16 gap-4">
            <div className="w-16 h-16 rounded-full bg-yellow-900/30 border border-yellow-700/50 flex items-center justify-center">
              <Lock size={28} className="text-yellow-400" />
            </div>
            <h2 className="text-xl font-bold">{t.aiCoach.upgradeTitle}</h2>
            <p className="text-gray-400 max-w-sm">{t.aiCoach.upgradeText}</p>
            <button disabled className="btn-primary opacity-60 cursor-not-allowed flex items-center gap-2">
              <Sparkles size={16} /> {t.aiCoach.upgradeBtn} — {lang === 'fr' ? 'Bientôt disponible' : 'Coming soon'}
            </button>
          </div>
        ) : (
          /* CHAT */
          <div className="card flex flex-col h-[600px]">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    msg.role === 'assistant' ? 'bg-yellow-900/40 text-yellow-400' : 'bg-green-900/40 text-green-400'
                  }`}>
                    {msg.role === 'assistant' ? <Bot size={16} /> : '👤'}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                    msg.role === 'assistant' ? 'bg-gray-800 text-gray-100' : 'bg-green-700 text-white'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {thinking && (
                <div className="flex gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-yellow-900/40 text-yellow-400 flex items-center justify-center">
                    <Bot size={16} />
                  </div>
                  <div className="bg-gray-800 rounded-2xl px-4 py-3 text-sm text-gray-400 flex items-center gap-2">
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                    {t.aiCoach.thinking}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-800">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder={t.aiCoach.placeholder}
                className="flex-1"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || thinking}
                className="btn-primary px-3"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </ProtectedLayout>
  )
}
