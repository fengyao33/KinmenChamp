import { useNavigate } from 'react-router-dom'
import { BadgePercent, ChevronRight, MapPinned, MessagesSquare, Route as RouteIcon, Store } from 'lucide-react'
import { loadDB } from '../data'
import { Card, PageHeader } from '../ui'

export default function Dashboard() {
  const navigate = useNavigate()
  const db = loadDB()

  const stats = [
    { label: '上架店家', value: db.stores.filter((s) => s.published).length, unit: `／ 共 ${db.stores.length} 家`, icon: Store, tint: 'text-brick-600 bg-brick-50' },
    { label: '上架遊程', value: db.routes.filter((r) => r.published).length, unit: `／ 共 ${db.routes.length} 條`, icon: RouteIcon, tint: 'text-ocean-600 bg-ocean-50' },
    { label: '活動與優惠', value: db.offers.length, unit: '則', icon: BadgePercent, tint: 'text-ochre-500 bg-paper-200' },
    { label: '表單題目', value: db.form.length, unit: '題', icon: MapPinned, tint: 'text-ocean-600 bg-ocean-50' },
  ]

  const shortcuts = [
    { to: '/admin/stores', label: '匯入 / 管理店家', desc: '呼叫 Google Place 匯入,維護特色、分類與上下架', icon: Store },
    { to: '/admin/offers', label: '維護活動與優惠', desc: '新增優惠或活動,綁定到店家', icon: BadgePercent },
    { to: '/admin/routes', label: '編排島轉遊程', desc: '挑選店家、排順序,存成精選路線', icon: RouteIcon },
    { to: '/admin/form', label: '設計 AI 表單', desc: '調整旅客填寫的題目與選項', icon: MapPinned },
    { to: '/admin/insights', label: '檢視評論與資訊', desc: '看外部評論與旅遊資訊,手動重抓', icon: MessagesSquare },
  ]

  return (
    <div>
      <PageHeader title="總覽" desc="島轉後台的整體狀態與快速入口" />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label} className="p-5">
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${s.tint}`}>
                <Icon className="h-5 w-5" strokeWidth={2} />
              </div>
              <p className="text-sm text-ink-500">{s.label}</p>
              <p className="mt-1 text-2xl font-black text-ink-900">
                {s.value}
                <span className="ml-1 text-xs font-medium text-ink-400">{s.unit}</span>
              </p>
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
                <p className="mt-0.5 text-sm text-ink-500">{s.desc}</p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-ink-400" strokeWidth={2} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
