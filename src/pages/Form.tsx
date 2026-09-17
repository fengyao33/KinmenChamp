import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Camera,
  Clock,
  Coffee,
  Heart,
  Landmark,
  ShoppingBag,
  Trees,
  User,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react'
import Header from '../components/Header'

const DURATION: [string, LucideIcon][] = [
  ['半天', Clock],
  ['一天', Clock],
  ['兩天以上', Clock],
]
const COMPANION: [string, LucideIcon][] = [
  ['一個人', User],
  ['情侶', Heart],
  ['家庭', Users],
  ['朋友', Users],
]
const EXPERIENCE: [string, LucideIcon][] = [
  ['美食', UtensilsCrossed],
  ['文化古蹟', Landmark],
  ['自然風光', Trees],
  ['拍照打卡', Camera],
  ['購物', ShoppingBag],
  ['深度慢遊', Coffee],
]

function Chip({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string
  icon: LucideIcon
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition ${
        active
          ? 'border-brick-600 bg-brick-600 text-white shadow-sm shadow-brick-600/20'
          : 'border-paper-300 bg-white text-ink-700 hover:border-brick-300 hover:text-brick-700'
      }`}
    >
      <Icon className="h-4 w-4" strokeWidth={2} />
      {label}
    </button>
  )
}

export default function Form() {
  const navigate = useNavigate()
  const [duration, setDuration] = useState('一天')
  const [companion, setCompanion] = useState('情侶')
  const [experiences, setExperiences] = useState<string[]>(['美食', '文化古蹟'])
  const [note, setNote] = useState('')

  const toggleExp = (e: string) =>
    setExperiences((prev) => (prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]))

  const submit = () =>
    navigate('/loading', { state: { duration, companion, experiences, note } })

  return (
    <div className="flex min-h-full flex-col bg-paper-100">
      <Header showBack />

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 pt-10 pb-32">
        <h1 className="text-center text-3xl font-black tracking-tight text-ink-900">
          打造你的專屬金門路線
        </h1>
        <p className="mt-3 text-center text-ink-500">回答幾個問題，AI 幫你排</p>

        <div className="mt-10 space-y-9 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-ink-900/5 sm:p-8">
          <section>
            <h2 className="mb-4 font-bold text-ink-900">你想玩多久？</h2>
            <div className="flex flex-wrap gap-2.5">
              {DURATION.map(([d, Icon]) => (
                <Chip key={d} label={d} icon={Icon} active={duration === d} onClick={() => setDuration(d)} />
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-4 font-bold text-ink-900">和誰一起旅行？</h2>
            <div className="flex flex-wrap gap-2.5">
              {COMPANION.map(([c, Icon]) => (
                <Chip key={c} label={c} icon={Icon} active={companion === c} onClick={() => setCompanion(c)} />
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-4 font-bold text-ink-900">
              最想體驗？<span className="ml-1 text-sm font-normal text-ink-400">（可複選）</span>
            </h2>
            <div className="flex flex-wrap gap-2.5">
              {EXPERIENCE.map(([e, Icon]) => (
                <Chip key={e} label={e} icon={Icon} active={experiences.includes(e)} onClick={() => toggleExp(e)} />
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-4 font-bold text-ink-900">
              特別想去或想避開的？<span className="ml-1 text-sm font-normal text-ink-400">（可留白）</span>
            </h2>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              placeholder="例如：想吃海鮮、不想走太多路、想看古厝聚落"
              className="w-full resize-none rounded-2xl border border-paper-300 bg-paper-50 p-4 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-ocean-500 focus:bg-white focus:ring-4 focus:ring-ocean-500/15"
            />
          </section>
        </div>
        <p className="mt-4 px-1 text-sm text-ink-400">都可略過，AI 會用預設值幫你排。</p>
      </main>

      {/* 底部固定 CTA */}
      <div className="sticky bottom-0 z-20 border-t border-ink-900/5 bg-paper-50/90 backdrop-blur-md">
        <div className="mx-auto max-w-2xl px-6 py-4">
          <button
            onClick={submit}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brick-600 px-6 py-4 text-lg font-bold text-white shadow-lg shadow-brick-600/25 transition hover:bg-brick-700 active:translate-y-0.5"
          >
            生成我的路線 <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  )
}
