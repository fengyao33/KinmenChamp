import { useNavigate } from 'react-router-dom'
import { BadgePercent, ChevronRight, MapPinned, MessagesSquare, Route as RouteIcon, Store } from 'lucide-react'
import { loadDB } from '../data'
import { Card, PageHeader } from '../ui'

export default function Dashboard() {
  const navigate = useNavigate()
  const db = loadDB()

  const activityCount = db.offers.filter((o) => o.kind === 'activity').length
  const offerCount = db.offers.filter((o) => o.kind === 'offer').length
  const singleCount = db.form.filter((f) => f.type === 'single').length
  const multiCount = db.form.filter((f) => f.type === 'multi').length
  const textCount = db.form.filter((f) => f.type === 'text').length

  type Stat =
    | { kind: 'single'; label: string; value: number; corner: string; icon: typeof Store; tint: string }
    | { kind: 'parts'; label: string; parts: { label: string; value: number; unit: string }[]; icon: typeof Store; tint: string }

  const stats: Stat[] = [
    { kind: 'single', label: '上架商家', value: db.stores.filter((s) => s.published).length, corner: `共 ${db.stores.length} 家`, icon: Store, tint: 'text-brick-600 bg-brick-50' },
    { kind: 'single', label: '上架遊程', value: db.routes.filter((r) => r.published).length, corner: `共 ${db.routes.length} 條`, icon: RouteIcon, tint: 'text-ocean-600 bg-ocean-50' },
    {
      kind: 'parts',
      label: '活動與優惠',
      icon: BadgePercent,
      tint: 'text-ochre-500 bg-paper-200',
      parts: [
        { label: '活動', value: activityCount, unit: '則' },
        { label: '優惠', value: offerCount, unit: '則' },
      ],
    },
    {
      kind: 'parts',
      label: '問卷題目',
      icon: MapPinned,
      tint: 'text-ocean-600 bg-ocean-50',
      parts: [
        { label: '單選', value: singleCount, unit: '題' },
        { label: '複選', value: multiCount, unit: '題' },
        { label: '自由問答', value: textCount, unit: '題' },
      ],
    },
  ]

  const shortcuts = [
    { to: '/admin/stores', label: '管理「金門縣」商家', desc: '呼叫 Google Place 匯入,維護特色、分類與上下架', icon: Store },
    { to: '/admin/offers', label: '綁定商家活動與優惠', desc: '新增優惠或活動,綁定到商家', icon: BadgePercent },
    { to: '/admin/routes', label: '編排精選遊程', desc: '挑選商家、排順序,存成精選路線', icon: RouteIcon },
    { to: '/admin/form', label: '設計 AI 客製化問卷', desc: '調整旅客填寫的題目與選項', icon: MapPinned },
    { to: '/admin/insights', label: '檢視 Google 評論與網路情報', desc: '看外部評論與旅遊資訊,手動重抓', icon: MessagesSquare },
  ]

  return (
    <div>
      <PageHeader title="總覽" />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label} className="relative flex min-h-[136px] flex-col p-5">
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${s.tint}`}>
                <Icon className="h-5 w-5" strokeWidth={2} />
              </div>
              <p className="text-sm text-ink-500">{s.label}</p>
              {s.kind === 'single' ? (
                <>
                  <p className="mt-1 text-3xl font-black text-ink-900">{s.value}</p>
                  <span className="absolute bottom-4 right-5 text-xs font-medium text-ink-400">{s.corner}</span>
                </>
              ) : (
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
                  {s.parts.map((p) => (
                    <div key={p.label}>
                      <p className="text-xs text-ink-400">{p.label}</p>
                      <p className="text-xl font-black text-ink-900">
                        {p.value}
                        <span className="ml-0.5 text-xs font-medium text-ink-400">{p.unit}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )
        })}
      </div>

      <h2 className="mt-8 mb-3 text-lg font-black text-ink-900">快速開始</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {shortcuts.map((s) => {
          const Icon = s.icon
          return (
            <button
              key={s.to}
              onClick={() => navigate(s.to)}
              className="flex items-center gap-4 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-ink-900/5 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-paper-200 text-ink-700">
                <Icon className="h-5 w-5" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-ink-900">{s.label}</p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-ink-400" strokeWidth={2} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
