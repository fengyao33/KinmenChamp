import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Clock, MapPin, Route as RouteIcon, UtensilsCrossed, Waves, type LucideIcon } from 'lucide-react'
import Header from '../components/Header'
import ReplaceTripDialog from '../components/ReplaceTripDialog'
import { curatedRoutes, type RouteTheme } from '../data/mock'
import { isTripModified, loadTrip, tripTitle, tripUrl } from '../data/trip'

const THEME: Record<RouteTheme, { band: string; chip: string; icon: LucideIcon; cta: string }> = {
  brick: { band: 'bg-brick-600', chip: 'text-brick-600', icon: RouteIcon, cta: 'bg-brick-600 hover:bg-brick-700' },
  ochre: { band: 'bg-ochre-500', chip: 'text-ochre-500', icon: UtensilsCrossed, cta: 'bg-ochre-500 hover:bg-ochre-400' },
  ocean: { band: 'bg-ocean-600', chip: 'text-ocean-600', icon: Waves, cta: 'bg-ocean-600 hover:bg-ocean-700' },
}

const hours = (mins: number) => (mins / 60).toFixed(1).replace(/\.0$/, '')

export default function Routes() {
  const navigate = useNavigate()
  const scroller = useRef<HTMLDivElement>(null)
  const [idx, setIdx] = useState(0)
  const [pendingRoute, setPendingRoute] = useState<string | null>(null)
  const saved = loadTrip()

  // 選路線 = 產生新遊程;若旅客改過目前的行程,先提醒會被取代
  const goFresh = (id: string) => navigate(`/map?type=island&route=${id}`, { state: { freshTrip: true } })
  const pickRoute = (id: string) => (saved && isTripModified(saved) ? setPendingRoute(id) : goFresh(id))

  const onScroll = () => {
    const el = scroller.current
    if (!el) return
    setIdx(Math.round(el.scrollLeft / el.clientWidth))
  }

  return (
    <div className="flex min-h-full flex-col bg-paper-100">
      <Header showBack />

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12 sm:py-16">
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tight text-ink-900 sm:text-4xl">島轉精選遊程</h1>
          <p className="mt-3 text-ink-500">挑一條路線,直接出發</p>
        </div>

        <div
          ref={scroller}
          onScroll={onScroll}
          className="no-scrollbar mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible"
        >
          {curatedRoutes.map((r) => {
            const t = THEME[r.theme]
            const Icon = t.icon
            const total = r.stops.reduce((a, s) => a + s.stayMin, 0)
            return (
              <button
                key={r.id}
                onClick={() => pickRoute(r.id)}
                className="group flex w-[86%] shrink-0 snap-center flex-col overflow-hidden rounded-3xl bg-white text-left shadow-sm ring-1 ring-ink-900/5 transition hover:shadow-xl sm:w-[68%] md:w-auto md:hover:-translate-y-1"
              >
                {/* 主題帶 */}
                <div className={`relative h-32 overflow-hidden ${t.band}`}>
                  <svg viewBox="0 0 400 128" preserveAspectRatio="none" className="absolute inset-0 h-full w-full opacity-80">
                    <path d="M28,100 C110,54 180,110 250,72 C300,46 340,66 380,34" fill="none" stroke="#ffffff" strokeWidth="3" strokeDasharray="2 10" strokeLinecap="round" opacity="0.7" />
                    <circle cx="28" cy="100" r="7" fill="#fff" />
                    <circle cx="250" cy="72" r="7" fill="#fff" />
                    <circle cx="380" cy="34" r="7" fill="#fff" />
                  </svg>
                  <div className="absolute left-5 top-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/95 shadow">
                    <Icon className={`h-6 w-6 ${t.chip}`} strokeWidth={2} />
                  </div>
                  <span className="absolute right-5 top-5 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-ink-700 shadow">
                    共 {r.stops.length} 站
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <h2 className="text-xl font-black text-ink-900">{r.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-ink-500">{r.summary}</p>

                  <div className="mt-4 flex items-start gap-1.5 text-sm text-ink-600">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" strokeWidth={2} />
                    <span>{r.stops.map((s) => s.name).join(' → ')}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-sm text-ink-500">
                    <Clock className="h-4 w-4 text-ink-400" strokeWidth={2} />
                    約 {hours(total)} 小時
                  </div>

                  <span className={`mt-6 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 font-bold text-white transition ${t.cta}`}>
                    看這條路線 <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* 分頁圓點(手機) */}
        <div className="mt-5 flex items-center justify-center gap-2 md:hidden">
          {curatedRoutes.map((_, i) => (
            <span
              key={i}
              className={`rounded-full transition-all ${idx === i ? 'h-2.5 w-2.5 bg-brick-600' : 'h-2 w-2 bg-paper-300'}`}
            />
          ))}
        </div>
      </main>

      {pendingRoute && saved && (
        <ReplaceTripDialog
          tripName={tripTitle(saved)}
          onBack={() => navigate(tripUrl(saved.key))}
          onReplace={() => goFresh(pendingRoute)}
          onClose={() => setPendingRoute(null)}
        />
      )}
    </div>
  )
}
