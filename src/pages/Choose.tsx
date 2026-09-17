import { useNavigate } from 'react-router-dom'
import { ArrowRight, Check, Route, Sparkles } from 'lucide-react'
import Header from '../components/Header'

export default function Choose() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-full flex-col bg-paper-100">
      <Header showBack />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-12 sm:py-16">
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tight text-ink-900 sm:text-4xl">
            你想怎麼玩金門？
          </h1>
          <p className="mt-3 text-ink-500">選一種方式開始</p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {/* 島轉推薦 */}
          <article className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-ink-900/5 transition hover:-translate-y-1 hover:shadow-xl">
            <div className="relative h-36 overflow-hidden bg-brick-600">
              <svg viewBox="0 0 400 140" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full opacity-90">
                <path d="M40,110 C120,60 180,120 240,80 C290,48 330,70 370,40" fill="none" stroke="#ffffff" strokeWidth="3" strokeDasharray="2 10" strokeLinecap="round" opacity="0.7" />
                <circle cx="40" cy="110" r="9" fill="#fff" /><text x="40" y="114" textAnchor="middle" fontSize="11" fontWeight="900" fill="#c63a24">1</text>
                <circle cx="240" cy="80" r="9" fill="#fff" /><text x="240" y="84" textAnchor="middle" fontSize="11" fontWeight="900" fill="#c63a24">2</text>
                <circle cx="370" cy="40" r="9" fill="#f2a03d" /><text x="370" y="44" textAnchor="middle" fontSize="11" fontWeight="900" fill="#fff">3</text>
              </svg>
              <div className="absolute left-5 top-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/95 text-brick-600 shadow">
                <Route className="h-6 w-6" strokeWidth={2} />
              </div>
              <span className="absolute right-5 top-5 rounded-full bg-sun-500 px-3 py-1 text-xs font-bold text-white shadow">
                一鍵出發
              </span>
            </div>

            <div className="flex flex-1 flex-col p-6">
              <h2 className="text-xl font-black text-ink-900">島轉推薦</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">
                在地團隊實地編排的精選路線，不用想，直接照著走。
              </p>
              <ul className="mt-4 space-y-2 text-sm text-ink-700">
                {['涵蓋美食、文化與景點', '全程約 3 小時', '適合第一次來金門'].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-brick-600" strokeWidth={3} />
                    {t}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate('/map?type=island')}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-brick-600 px-5 py-3.5 font-bold text-white transition hover:bg-brick-700"
              >
                看推薦路線 <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
          </article>

          {/* AI 客製 */}
          <article className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-ink-900/5 transition hover:-translate-y-1 hover:shadow-xl">
            <div className="relative h-36 overflow-hidden bg-ocean-600">
              <svg viewBox="0 0 400 140" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
                {[
                  [70, 40, 10], [150, 95, 7], [250, 45, 8], [320, 100, 6], [360, 55, 9], [110, 115, 5],
                ].map(([x, y, r], i) => (
                  <path key={i} d={`M${x},${y - r} L${x + r * 0.28},${y - r * 0.28} L${x + r},${y} L${x + r * 0.28},${y + r * 0.28} L${x},${y + r} L${x - r * 0.28},${y + r * 0.28} L${x - r},${y} L${x - r * 0.28},${y - r * 0.28} Z`} fill="#fff" opacity={0.85} />
                ))}
              </svg>
              <div className="absolute left-5 top-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/95 text-ocean-600 shadow">
                <Sparkles className="h-6 w-6" strokeWidth={2} />
              </div>
              <span className="absolute right-5 top-5 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-ocean-700 shadow">
                個人化
              </span>
            </div>

            <div className="flex flex-1 flex-col p-6">
              <h2 className="text-xl font-black text-ink-900">AI 客製</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">
                回答幾個問題，AI 依你的偏好生成專屬路線。
              </p>
              <ul className="mt-4 space-y-2 text-sm text-ink-700">
                {['結合評論與優惠', '可調整天數與主題', '隨時能重新規劃'].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-ocean-600" strokeWidth={3} />
                    {t}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate('/form')}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-ocean-600 px-5 py-3.5 font-bold text-white transition hover:bg-ocean-700"
              >
                開始客製 <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
          </article>
        </div>
      </main>
    </div>
  )
}
