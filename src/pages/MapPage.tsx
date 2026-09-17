import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import {
  Clock,
  Image as ImageIcon,
  Landmark,
  LayoutGrid,
  Minus,
  Navigation,
  Plus,
  RotateCcw,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  Trees,
  UtensilsCrossed,
  X,
  type LucideIcon,
} from 'lucide-react'
import Logo from '../components/Logo'
import {
  categoryLabel,
  extraPois,
  feed,
  islandRoute,
  type Category,
  type Stop,
} from '../data/mock'

const KINMEN_CENTER: [number, number] = [24.4326, 118.3185]

function numberIcon(n: number, active: boolean) {
  return L.divIcon({
    html: `<div class="dz-pin ${active ? 'dz-pin--active' : ''}">${n}</div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })
}
function poiIcon(active: boolean) {
  return L.divIcon({
    html: `<div class="dz-poi ${active ? 'dz-poi--active' : ''}"></div>`,
    className: '',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
}

function FlyTo({ stop }: { stop: Stop | null }) {
  const map = useMap()
  useEffect(() => {
    if (stop) map.flyTo([stop.lat, stop.lng], 16, { duration: 0.6 })
  }, [stop, map])
  return null
}

function ZoomControls() {
  const map = useMap()
  return (
    <div className="absolute bottom-6 right-3 z-[500] flex flex-col overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-ink-900/10">
      <button onClick={() => map.zoomIn()} className="flex h-9 w-9 items-center justify-center text-ink-700 transition hover:bg-paper-100" aria-label="放大">
        <Plus className="h-4 w-4" strokeWidth={2.5} />
      </button>
      <span className="h-px bg-paper-200" />
      <button onClick={() => map.zoomOut()} className="flex h-9 w-9 items-center justify-center text-ink-700 transition hover:bg-paper-100" aria-label="縮小">
        <Minus className="h-4 w-4" strokeWidth={2.5} />
      </button>
    </div>
  )
}

const CATS: { key: Category | 'all'; icon: LucideIcon }[] = [
  { key: 'all', icon: LayoutGrid },
  { key: 'food', icon: UtensilsCrossed },
  { key: 'culture', icon: Landmark },
  { key: 'nature', icon: Trees },
  { key: 'shopping', icon: ShoppingBag },
]

export default function MapPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const isAI = params.get('type') === 'ai'

  const [selected, setSelected] = useState<Stop | null>(null)
  const [filter, setFilter] = useState<Category | 'all'>('all')

  const routePositions = islandRoute.map((s) => [s.lat, s.lng] as [number, number])
  const totalHours = useMemo(
    () => (islandRoute.reduce((a, s) => a + s.stayMin, 0) / 60).toFixed(1).replace(/\.0$/, ''),
    [],
  )
  const showPoi = (cat: Category) => filter === 'all' || filter === cat

  return (
    <div className="flex h-screen flex-col bg-paper-100">
      {/* 頂列 */}
      <header className="z-30 flex h-16 shrink-0 items-center justify-between border-b border-ink-900/5 bg-paper-50 px-4 sm:px-6">
        <Logo className="h-9" />
        <button
          onClick={() => navigate('/choose')}
          className="inline-flex items-center gap-1.5 rounded-full border border-paper-300 px-4 py-2 text-sm font-medium text-ink-700 transition hover:border-brick-400 hover:text-brick-700"
        >
          <RotateCcw className="h-4 w-4" strokeWidth={2} />
          重新規劃
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* 左欄：本次行程 */}
        <aside className="hidden w-80 shrink-0 overflow-y-auto border-r border-ink-900/5 bg-paper-50 p-6 lg:block">
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold text-white ${isAI ? 'bg-ocean-600' : 'bg-brick-600'}`}>
              {isAI ? 'AI 客製' : '島轉推薦'}
            </span>
            <span className="text-xs text-ink-400">共 {islandRoute.length} 站，約 {totalHours} 小時</span>
          </div>
          <h2 className="mt-3 text-xl font-black text-ink-900">本次行程</h2>

          <ol className="mt-6">
            {islandRoute.map((s, i) => (
              <li key={s.id} className="relative pb-7 pl-11 last:pb-0">
                {i < islandRoute.length - 1 && (
                  <span className="absolute top-9 left-[15px] h-full w-0.5 border-l-2 border-dashed border-paper-300" />
                )}
                <button onClick={() => setSelected(s)} className="group block w-full text-left">
                  <span
                    className={`absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full text-sm font-black text-white transition ${
                      selected?.id === s.id ? 'bg-sun-500 scale-110' : 'bg-brick-600 group-hover:bg-brick-700'
                    }`}
                  >
                    {s.order}
                  </span>
                  <p className="font-bold text-ink-900 group-hover:text-brick-700">{s.name}</p>
                  <p className="mt-0.5 text-xs text-ink-500">{s.desc}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-400">
                    <Clock className="h-3 w-3" strokeWidth={2} />
                    停留約 {s.stayMin} 分鐘
                  </p>
                  {s.legToNext && (
                    <p className="mt-2 text-[11px] font-medium text-ocean-600">{s.legToNext}</p>
                  )}
                </button>
              </li>
            ))}
          </ol>

          <div className="mt-4 rounded-2xl bg-paper-100 p-4 text-xs text-ink-500">
            全程約 2.6 公里，建議上午出發。
          </div>
        </aside>

        {/* 中央：地圖 */}
        <main className="relative min-w-0 flex-1">
          {/* 搜尋 + 分類 */}
          <div className="absolute inset-x-3 top-3 z-[500] flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-1.5">
              {CATS.map(({ key, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm ring-1 transition ${
                    filter === key
                      ? 'bg-brick-600 text-white ring-brick-600'
                      : 'bg-white/95 text-ink-700 ring-ink-900/5 hover:bg-white'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                  {key === 'all' ? '全部' : categoryLabel[key]}
                </button>
              ))}
            </div>
            <div className="hidden items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm text-ink-400 shadow-sm ring-1 ring-ink-900/5 sm:flex sm:w-64">
              <Search className="h-4 w-4" strokeWidth={2} />
              搜尋地點或店家
            </div>
          </div>

          <MapContainer center={KINMEN_CENTER} zoom={15} className="h-full w-full" zoomControl={false}>
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FlyTo stop={selected} />
            <ZoomControls />

            <Polyline positions={routePositions} pathOptions={{ color: '#1b6fa6', weight: 4, dashArray: '1 9', lineCap: 'round' }} />

            {islandRoute.map((s) => (
              <Marker
                key={s.id}
                position={[s.lat, s.lng]}
                icon={numberIcon(s.order, selected?.id === s.id)}
                eventHandlers={{ click: () => setSelected(s) }}
              />
            ))}
            {extraPois.filter((p) => showPoi(p.category)).map((p) => (
              <Marker
                key={p.id}
                position={[p.lat, p.lng]}
                icon={poiIcon(selected?.id === p.id)}
                eventHandlers={{ click: () => setSelected(p) }}
              />
            ))}
          </MapContainer>

          {selected && <DetailCard stop={selected} onClose={() => setSelected(null)} />}
        </main>

        {/* 右欄：在地動態牆 */}
        <aside className="hidden w-80 shrink-0 overflow-y-auto border-l border-ink-900/5 bg-paper-50 p-6 xl:block">
          <div className="flex items-center gap-2 text-ocean-600">
            <Sparkles className="h-4 w-4" strokeWidth={2} />
            <span className="text-xs font-semibold">金門最新活動與旅遊資訊</span>
          </div>
          <h2 className="mt-2 text-xl font-black text-ink-900">在地動態牆</h2>

          <div className="mt-5 space-y-3">
            {feed.map((f) => (
              <article key={f.id} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink-900/5 transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex gap-3 p-3">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-ocean-100 to-sun-300/40 text-ocean-400">
                    <ImageIcon className="h-6 w-6" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-ink-900">{f.title}</h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-500">{f.summary}</p>
                  </div>
                </div>
                <p className="border-t border-paper-200 px-3 py-2 text-[11px] text-ink-400">
                  {f.source}，{f.time}
                </p>
              </article>
            ))}
          </div>

          <button className="mt-4 w-full rounded-full bg-paper-200 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-paper-300">
            查看更多
          </button>
        </aside>
      </div>
    </div>
  )
}

function DetailCard({ stop, onClose }: { stop: Stop; onClose: () => void }) {
  return (
    <div className="dz-rise absolute right-3 top-16 z-[600] w-[350px] max-w-[calc(100%-1.5rem)] overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-ink-900/10">
      {/* 圖片區 */}
      <div className="relative h-36 bg-gradient-to-br from-ocean-100 via-paper-200 to-sun-300/50">
        <div className="absolute inset-0 flex items-center justify-center text-ocean-300">
          <ImageIcon className="h-10 w-10" strokeWidth={1.25} />
        </div>
        <button
          onClick={onClose}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink-700 shadow transition hover:bg-white"
          aria-label="關閉"
        >
          <X className="h-4 w-4" strokeWidth={2.5} />
        </button>
        {stop.tags.length > 0 && (
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
            {stop.tags.map((t) => (
              <span key={t} className="rounded-full bg-brick-600 px-2.5 py-1 text-[11px] font-bold text-white shadow">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="p-5">
        <h3 className="text-lg font-black text-ink-900">{stop.name}</h3>
        <p className="mt-1 flex items-center gap-2 text-sm text-ink-500">
          <span className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-sun-500 text-sun-500" strokeWidth={0} />
            <span className="font-bold text-ink-900">{stop.rating}</span>
          </span>
          <span className="text-ink-400">{stop.reviewCount} 則評論</span>
          <span className="text-ink-500">{categoryLabel[stop.category]}</span>
        </p>

        <div className="mt-4 rounded-2xl bg-ocean-50 p-3.5">
          <p className="flex items-center gap-1.5 text-xs font-bold text-ocean-700">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2} /> AI 評論總結
          </p>
          <ul className="mt-2 space-y-1.5">
            {stop.aiSummary.map((g, i) => (
              <li key={i} className="flex gap-2 text-xs leading-relaxed text-ink-700">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ocean-400" />
                {g}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 flex gap-2.5">
          <button className="flex-1 rounded-full border border-paper-300 py-2.5 text-sm font-bold text-ink-700 transition hover:bg-paper-100">
            看完整評論
          </button>
          <button className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-brick-600 py-2.5 text-sm font-bold text-white transition hover:bg-brick-700">
            <Navigation className="h-4 w-4" strokeWidth={2} /> 導航前往
          </button>
        </div>
      </div>
    </div>
  )
}
