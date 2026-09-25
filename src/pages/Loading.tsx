import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'

const STEPS = ['讀取你的旅遊偏好', '比對在地優惠與活動', '整理最新評論與旅遊資訊', '生成最佳路線']

export default function Loading() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)

  useEffect(() => {
    const timers = STEPS.map((_, i) => setTimeout(() => setStep(i + 1), (i + 1) * 1100))
    const done = setTimeout(() => navigate('/map?type=ai', { replace: true, state: { freshTrip: true } }), STEPS.length * 1100 + 700)
    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(done)
    }
  }, [navigate])

  const progress = Math.round((step / STEPS.length) * 100)

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-paper-100 px-6">
      <div className="w-full max-w-md text-center">
        {/* 旋轉太陽 emblem */}
        <div className="relative mx-auto h-32 w-32">
          <svg viewBox="0 0 120 120" className="dz-spin absolute inset-0 h-full w-full">
            {Array.from({ length: 12 }).map((_, i) => {
              const a = (i * 30 * Math.PI) / 180
              const x1 = 60 + Math.cos(a) * 44
              const y1 = 60 + Math.sin(a) * 44
              const x2 = 60 + Math.cos(a) * 56
              const y2 = 60 + Math.sin(a) * 56
              return (
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#f2a03d" strokeWidth="5" strokeLinecap="round" />
              )
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sun-500 shadow-lg shadow-sun-500/30">
              <span className="text-3xl font-black text-white">島</span>
            </div>
          </div>
        </div>

        <h1 className="mt-8 text-xl font-black text-ink-900">AI 正在為你規劃路線</h1>
        <p className="mt-1.5 text-sm text-ink-500">大約 15 秒，請稍候</p>

        {/* 分步清單 */}
        <ul className="mx-auto mt-8 max-w-xs space-y-3.5 text-left">
          {STEPS.map((label, i) => {
            const isDone = i < step
            const isActive = i === step
            return (
              <li key={label} className="flex items-center gap-3 text-sm">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition ${
                    isDone
                      ? 'bg-brick-600 text-white'
                      : isActive
                        ? 'bg-brick-100 text-brick-600'
                        : 'bg-paper-200 text-ink-400'
                  }`}
                >
                  {isDone ? (
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  ) : isActive ? (
                    <span className="h-2 w-2 animate-pulse rounded-full bg-brick-500" />
                  ) : null}
                </span>
                <span className={isDone ? 'text-ink-400' : isActive ? 'font-bold text-ink-900' : 'text-ink-400'}>
                  {label}
                </span>
              </li>
            )
          })}
        </ul>

        {/* 進度條 */}
        <div className="mx-auto mt-8 h-2 max-w-xs overflow-hidden rounded-full bg-paper-200">
          <div
            className="h-full rounded-full bg-brick-600 transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-4 text-xs text-ink-400">完成後將自動進入地圖頁</p>
      </div>
    </div>
  )
}
