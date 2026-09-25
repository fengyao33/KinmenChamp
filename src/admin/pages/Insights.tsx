import { useState } from 'react'
import { Newspaper, RefreshCw, Sparkles, Star } from 'lucide-react'
import { loadDB, nowStamp, saveDB, type AdminDB } from '../data'
import { Btn, Card, PageHeader, useToast } from '../ui'

export default function Insights() {
  const toast = useToast()
  const [db, setDb] = useState<AdminDB>(loadDB())
  const [loading, setLoading] = useState<'reviews' | 'travel' | null>(null)
  const [tab, setTab] = useState<'reviews' | 'travel'>('reviews')

  const crawl = (kind: 'reviews' | 'travel') => {
    setLoading(kind)
    setTimeout(() => {
      const next = { ...db, crawler: { ...db.crawler, [kind === 'reviews' ? 'reviewsAt' : 'travelAt']: nowStamp() } }
      setDb(next)
      saveDB(next)
      setLoading(null)
      toast(kind === 'reviews' ? '評論已重新整理' : '旅遊資訊已更新')
    }, 900)
  }

  const reviewed = db.stores.filter((s) => s.reviews.length > 0)

  return (
    <div>
      <PageHeader title="檢視 Google 評論與網路情報" desc="系統每個禮拜自動抓取一次" />

      {/* 切換器:一次看一種 */}
      <div className="mb-5 grid max-w-md grid-cols-2 gap-1 rounded-2xl bg-paper-200 p-1">
        {([
          { key: 'reviews', label: '商家評論' },
          { key: 'travel', label: '網路情報' },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            aria-pressed={tab === t.key}
            className={`min-h-11 rounded-xl text-sm font-bold transition ${tab === t.key ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-800'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 商家評論 */}
      {tab === 'reviews' && (
        <Card className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brick-50 text-brick-600">
                <Star className="h-5 w-5" strokeWidth={2} />
              </div>
              <div>
                <h2 className="font-black text-ink-900">商家評論總結</h2>
                <p className="text-xs text-ink-400">上次更新:{db.crawler.reviewsAt ?? '尚未抓取'}</p>
              </div>
            </div>
            <Btn variant="secondary" onClick={() => crawl('reviews')} disabled={loading === 'reviews'}>
              <RefreshCw className={`h-4 w-4 ${loading === 'reviews' ? 'dz-spin-fast' : ''}`} strokeWidth={2.5} />
              {loading === 'reviews' ? '抓取中…' : '重新抓取評論'}
            </Btn>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {reviewed.map((s) => (
              <div key={s.id} className="rounded-2xl bg-paper-100 p-4">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-ink-900">{s.name}</p>
                  <span className="text-xs text-ink-400">★ {s.rating}({s.reviewCount})</span>
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-ocean-700">
                  <Sparkles className="h-3.5 w-3.5" strokeWidth={2} /> AI 評論總結
                </p>
                <ul className="mt-1.5 space-y-1">
                  {s.reviews.map((r, i) => (
                    <li key={i} className="flex gap-2 text-sm text-ink-600">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ocean-400" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 旅遊資訊 */}
      {tab === 'travel' && (
        <Card className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ocean-50 text-ocean-600">
                <Newspaper className="h-5 w-5" strokeWidth={2} />
              </div>
              <div>
                <h2 className="font-black text-ink-900">網路情報總結</h2>
                <p className="text-xs text-ink-400">上次更新:{db.crawler.travelAt ?? '尚未抓取'}</p>
              </div>
            </div>
            <Btn variant="secondary" onClick={() => crawl('travel')} disabled={loading === 'travel'}>
              <RefreshCw className={`h-4 w-4 ${loading === 'travel' ? 'dz-spin-fast' : ''}`} strokeWidth={2.5} />
              {loading === 'travel' ? '抓取中…' : '重新抓取情報'}
            </Btn>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {db.travel.map((t) => (
              <div key={t.id} className="rounded-2xl bg-paper-100 p-4">
                <p className="font-bold text-ink-900">{t.title}</p>
                <p className="mt-1 text-sm text-ink-500">{t.summary}</p>
                <p className="mt-1.5 text-xs text-ink-400">來源:{t.source}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
