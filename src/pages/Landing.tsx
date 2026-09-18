import { useNavigate } from 'react-router-dom'
import { ArrowRight, Compass, Map, Sparkles } from 'lucide-react'
import Logo from '../components/Logo'

const STEPS = [
  {
    icon: Compass,
    title: '選一種玩法',
    desc: '島轉在地精選 / AI 專業客製',
    tint: 'bg-brick-600',
  },
  {
    icon: Sparkles,
    title: '拿到專屬路線',
    desc: '結合評論、優惠與在地活動',
    tint: 'bg-sun-500',
  },
  {
    icon: Map,
    title: '跟著地圖走',
    desc: '一站一站跟著走',
    tint: 'bg-ocean-600',
  },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-full bg-paper-100">
      {/* 頂列 */}
      <header className="mx-auto flex max-w-6xl items-center px-6 py-5">
        <Logo className="h-9" clickable={false} />
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* 背景：暖陽光暈(用漸層,避免裁切邊產生割線) */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(130% 55% at 85% -5%, rgba(248,198,117,0.5), transparent 55%), radial-gradient(95% 45% at -5% 22%, rgba(169,208,232,0.4), transparent 55%)',
          }}
        />

        <div className="relative mx-auto flex max-w-4xl flex-col items-center px-6 pt-10 pb-40 text-center sm:pt-16">
          <div className="dz-bob dz-rise">
            <Logo className="h-40 sm:h-56 lg:h-64" clickable={false} />
          </div>

          <h1 className="dz-rise mt-8 text-3xl font-black tracking-tight text-balance text-ink-900 sm:text-5xl" style={{ animationDelay: '80ms' }}>
            換個角度看金門，換種方式玩金門
          </h1>
          <p className="dz-rise mt-5 max-w-lg text-pretty text-base text-ink-500 sm:text-lg" style={{ animationDelay: '160ms' }}>
            不只走訪景點，更把文化、故事與生活重新組合，讓熟悉的金門有新玩法。
          </p>

          <button
            onClick={() => navigate('/choose')}
            className="dz-rise mt-9 inline-flex items-center gap-2 rounded-full bg-brick-600 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-brick-600/25 transition hover:-translate-y-0.5 hover:bg-brick-700 hover:shadow-xl active:translate-y-0"
            style={{ animationDelay: '240ms' }}
          >
            開始探索金門
            <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>

        {/* 海浪 footer */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0">
          <svg viewBox="0 0 1440 160" preserveAspectRatio="none" className="block h-24 w-full sm:h-32">
            <path fill="#a9d0e8" fillOpacity="0.55" d="M0,96 C240,40 480,140 720,110 C960,80 1200,20 1440,80 L1440,160 L0,160 Z" />
            <path fill="#1b6fa6" d="M0,120 C260,70 520,150 780,128 C1040,106 1240,70 1440,116 L1440,160 L0,160 Z" />
          </svg>
        </div>
      </section>

      {/* 怎麼玩 */}
      <section id="how" className="-mt-px bg-ocean-600">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <h2 className="text-center text-2xl font-black tracking-tight text-white sm:text-3xl">
            三步驟，玩轉金門
          </h2>
          <div className="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-6">
            {STEPS.map((s, i) => {
              const Icon = s.icon
              return (
                <div key={s.title} className="relative flex flex-col items-center text-center">
                  {i < STEPS.length - 1 && (
                    <span className="absolute top-8 left-[calc(50%+2.5rem)] hidden h-px w-[calc(100%-5rem)] border-t-2 border-dashed border-white/25 sm:block" />
                  )}
                  <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${s.tint} text-white shadow-lg ring-4 ring-white/15`}>
                    <Icon className="h-7 w-7" strokeWidth={2} />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-white">{s.title}</h3>
                  <p className="mt-2 max-w-[16rem] text-sm leading-relaxed text-ocean-100">{s.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <footer className="bg-ocean-700 px-6 py-4">
        <p className="text-xs text-ocean-100/70">© 2026 島轉版權所有</p>
      </footer>
    </div>
  )
}
