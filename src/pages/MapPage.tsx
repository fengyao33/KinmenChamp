import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { MapContainer, Marker, Polyline, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import {
  ArrowLeftRight,
  Bookmark,
  Car,
  Check,
  Clock,
  Footprints,
  GripVertical,
  Image as ImageIcon,
  Landmark,
  LayoutGrid,
  Minus,
  MoreVertical,
  Navigation,
  Newspaper,
  Pencil,
  Plus,
  Route,
  RotateCcw,
  Scooter,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  Trash2,
  Trees,
  Trophy,
  UtensilsCrossed,
  X,
  type LucideIcon,
} from 'lucide-react'
import Logo from '../components/Logo'
import { UploadSheet } from './Leaderboard'
import { submitEntry } from '../data/leaderboard'
import {
  loadTrip,
  planSignature,
  routeFromKey,
  saveTrip,
  tripUrl,
  type SavedTrip,
  type Transport,
} from '../data/trip'
import {
  categoryLabel,
  curatedRoutes,
  extraPois,
  feed,
  type Category,
  type Stop,
} from '../data/mock'

const KINMEN_CENTER: [number, number] = [24.4326, 118.3185]

/* ---------- 交通方式與移動時間 ---------- */
type PlanStop = Stop
const TRANSPORT_LIST: { key: Transport; label: string; icon: LucideIcon; speed: number }[] = [
  { key: 'walk', label: '步行', icon: Footprints, speed: 4.5 },
  { key: 'scooter', label: '機車', icon: Scooter, speed: 30 },
  { key: 'drive', label: '開車', icon: Car, speed: 28 },
]
const transportMeta = (t: Transport) => TRANSPORT_LIST.find((x) => x.key === t)!

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const la1 = (a.lat * Math.PI) / 180
  const la2 = (b.lat * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
function legMinutes(from: Stop, to: Stop, mode: Transport) {
  const km = haversineKm(from, to)
  return Math.max(1, Math.round((km / transportMeta(mode).speed) * 60))
}
function transportFromLeg(text?: string): Transport {
  if (!text) return 'walk'
  if (text.includes('開車')) return 'drive'
  if (text.includes('機車') || text.includes('單車') || text.includes('腳踏')) return 'scooter'
  return 'walk'
}

/* ---------- 目前行程:存在這台裝置(存取邏輯在 data/trip.ts) ---------- */
// 推薦路線預設的交通方式(取第一段的說明)
const defaultTransport = (key: string) => transportFromLeg(routeFromKey(key).stops[0]?.legToNext)

/* 行程站點:風獅爺小弟 + 站序號碼;腳底對準座標 */
function stopIcon(n: number, active: boolean) {
  return L.divIcon({
    html: `<div class="dz-lion ${active ? 'dz-lion--active' : ''}"><img src="/markers/lion-stop.png" alt="" draggable="false" /><span class="dz-lion__num">${n}</span></div>`,
    className: '',
    iconSize: [48, 50],
    iconAnchor: [24, 48],
  })
}
/* 非行程但我們標註的景點:風獅爺石雕 */
function poiIcon(active: boolean) {
  return L.divIcon({
    html: `<div class="dz-stone ${active ? 'dz-stone--active' : ''}"><img src="/markers/lion-stone.png" alt="" draggable="false" /></div>`,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 34],
  })
}
function meIcon() {
  return L.divIcon({
    html: '<div class="dz-me"></div>',
    className: '',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}

function FlyTo({ stop }: { stop: Stop | null }) {
  const map = useMap()
  useEffect(() => {
    if (stop) map.flyTo([stop.lat, stop.lng], 16, { duration: 0.6 })
  }, [stop, map])
  return null
}

function MapClick({ onClick }: { onClick: () => void }) {
  useMapEvents({ click: onClick })
  return null
}

function FitRoute({ positions }: { positions: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length) map.fitBounds(positions, { padding: [60, 60] })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map])
  return null
}

function ZoomControls() {
  const map = useMap()
  return (
    <div className="absolute bottom-6 right-3 z-[500] hidden flex-col overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-ink-900/10 sm:flex">
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

/* ---------- 行程編輯器的操作集合 ---------- */
interface EditorApi {
  editMode: boolean
  selectedId?: string
  onSelect: (s: Stop) => void
  onMove: (from: number, to: number) => void
  transport: Transport // 整趟行程的交通方式(只在完成頁選)
  onEditStay: (index: number) => void
  onReplace: (index: number) => void
  onRemove: (index: number) => void
  onAddAt: (index: number) => void
}

/* 行程清單:唯讀與編輯模式共用 */
function Itinerary({ plan, ed }: { plan: PlanStop[]; ed: EditorApi }) {
  const [menu, setMenu] = useState<number | null>(null)
  const dragFrom = useRef<number | null>(null)
  const itemRefs = useRef<(HTMLLIElement | null)[]>([])
  const [dragging, setDragging] = useState<number | null>(null)

  useEffect(() => {
    if (menu === null) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(null)
    const onClick = () => setMenu(null)
    window.addEventListener('keydown', onKey)
    window.addEventListener('click', onClick)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('click', onClick)
    }
  }, [menu])

  const onDragStart = (i: number, e: React.PointerEvent) => {
    dragFrom.current = i
    setDragging(i)
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId)
    } catch {
      /* 合成事件略過 */
    }
  }
  const onDragMove = (e: React.PointerEvent) => {
    if (dragFrom.current === null) return
    const y = e.clientY
    let target = plan.length - 1
    for (let k = 0; k < plan.length; k++) {
      const el = itemRefs.current[k]
      if (!el) continue
      const r = el.getBoundingClientRect()
      if (y < r.top + r.height / 2) {
        target = k
        break
      }
    }
    if (target !== dragFrom.current) {
      ed.onMove(dragFrom.current, target)
      dragFrom.current = target
      setDragging(target)
    }
  }
  const onDragEnd = () => {
    dragFrom.current = null
    setDragging(null)
  }

  return (
    <ol>
      {plan.map((s, i) => {
        const nextMin = i < plan.length - 1 ? legMinutes(s, plan[i + 1], ed.transport) : 0
        const tm = transportMeta(ed.transport)
        return (
          <li
            key={s.id}
            ref={(el) => { itemRefs.current[i] = el }}
            className={`relative flex gap-2 pb-6 last:pb-1 ${dragging === i ? 'opacity-70' : ''}`}
          >
            {ed.editMode && (
              <button
                onPointerDown={(e) => onDragStart(i, e)}
                onPointerMove={onDragMove}
                onPointerUp={onDragEnd}
                onPointerCancel={onDragEnd}
                aria-label={`長按拖曳調整「${s.name}」順序`}
                style={{ touchAction: 'none' }}
                className="mt-0.5 flex h-8 w-6 shrink-0 cursor-grab items-center justify-center rounded-lg text-ink-400 transition hover:bg-paper-200 active:cursor-grabbing"
              >
                <GripVertical className="h-4 w-4" strokeWidth={2.5} />
              </button>
            )}

            {/* 時間軸:序號 + 虛線 */}
            <div className="flex flex-col items-center self-stretch">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black text-white transition ${
                  ed.selectedId === s.id ? 'scale-110 bg-sun-500' : 'bg-brick-600'
                }`}
              >
                {i + 1}
              </span>
              {i < plan.length - 1 && <span className="mt-1 w-0.5 flex-1 border-l-2 border-dashed border-paper-300" />}
            </div>

            {/* 內容 */}
            <div className="min-w-0 flex-1">
              <button onClick={() => ed.onSelect(s)} className="group block w-full text-left">
                <p className="font-bold text-ink-900 group-hover:text-brick-700">{s.name}</p>
                <p className="mt-0.5 text-xs text-ink-500">{s.desc}</p>
              </button>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-400">
                <Clock className="h-3 w-3" strokeWidth={2} />
                停留約 {s.stayMin} 分鐘
              </p>

              {/* 到下一站:依整趟交通方式計算 */}
              {i < plan.length - 1 && (
                <p className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-ocean-600">
                  <tm.icon className="h-3.5 w-3.5" strokeWidth={2} />
                  {tm.label} {nextMin} 分鐘到下一站
                </p>
              )}

              {/* 在此站之後加入新景點 */}
              {ed.editMode && (
                <button
                  onClick={() => ed.onAddAt(i + 1)}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-paper-300 py-2 text-xs font-bold text-ink-500 transition hover:border-brick-400 hover:text-brick-600"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={2.5} /> 加入地點
                </button>
              )}
            </div>

            {/* 每站選單 */}
            {ed.editMode && (
              <div className="relative shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); setMenu(menu === i ? null : i) }}
                  aria-label={`「${s.name}」更多操作`}
                  aria-haspopup="menu"
                  aria-expanded={menu === i}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 transition hover:bg-paper-200"
                >
                  <MoreVertical className="h-4 w-4" strokeWidth={2} />
                </button>
                {menu === i && (
                  <div
                    role="menu"
                    onClick={(e) => e.stopPropagation()}
                    className="dz-sheet-in absolute right-0 top-9 z-[60] w-40 overflow-hidden rounded-xl bg-white py-1 shadow-lg ring-1 ring-ink-900/10"
                  >
                    <button role="menuitem" onClick={() => { setMenu(null); ed.onEditStay(i) }} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-ink-700 transition hover:bg-paper-100">
                      <Pencil className="h-4 w-4 shrink-0 text-ink-400" strokeWidth={2} /> 編輯停留時間
                    </button>
                    <button role="menuitem" onClick={() => { setMenu(null); ed.onReplace(i) }} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-ink-700 transition hover:bg-paper-100">
                      <ArrowLeftRight className="h-4 w-4 shrink-0 text-ink-400" strokeWidth={2} /> 更換地點
                    </button>
                    <button role="menuitem" onClick={() => { setMenu(null); ed.onRemove(i) }} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50">
                      <Trash2 className="h-4 w-4 shrink-0" strokeWidth={2} /> 從行程移除
                    </button>
                  </div>
                )}
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}

/* 行程標題列(含進入編輯按鈕) */
function RouteHeader({
  isAI,
  count,
  totalLabel,
  title,
  editMode,
  onEdit,
}: {
  isAI: boolean
  count: number
  totalLabel: string
  title: string
  editMode: boolean
  onEdit: () => void
}) {
  return (
    <>
      <div className="flex items-center gap-2">
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold text-white ${isAI ? 'bg-ocean-600' : 'bg-brick-600'}`}>
          {isAI ? 'AI 客製' : '島轉精選'}
        </span>
        <span className="text-xs text-ink-400">共 {count} 站，{totalLabel}</span>
      </div>
      <div className="mt-2 flex items-start justify-between gap-2">
        <h2 className="text-xl font-black text-ink-900">{title}</h2>
        {!editMode && (
          <button
            onClick={onEdit}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-paper-300 px-3 py-1.5 text-xs font-bold text-ink-700 transition hover:border-brick-400 hover:text-brick-700"
          >
            <Pencil className="h-3.5 w-3.5" strokeWidth={2} /> 編輯
          </button>
        )}
      </div>
    </>
  )
}

/* 編輯模式底部操作列:只留「完成編輯」 */
function EditorActions({ onDone }: { onDone: () => void }) {
  return (
    <div className="border-t border-paper-200 bg-paper-50 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <button
        onClick={onDone}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-brick-600 py-3 text-sm font-bold text-white transition hover:bg-brick-700"
      >
        <Check className="h-4 w-4" strokeWidth={2.5} /> 完成編輯
      </button>
    </div>
  )
}

/* 完成頁:整趟行程的交通方式(路線演算法一次只用一種) */
function TransportPicker({ value, onChange }: { value: Transport; onChange: (t: Transport) => void }) {
  const labelId = useId()
  return (
    <div className="mt-5">
      <p id={labelId} className="mb-2 text-xs font-bold text-ink-500">
        交通方式
      </p>
      <div role="radiogroup" aria-labelledby={labelId} className="grid grid-cols-3 gap-1 rounded-2xl bg-paper-200 p-1">
        {TRANSPORT_LIST.map((t) => {
          const on = t.key === value
          const Icon = t.icon
          return (
            <button
              key={t.key}
              role="radio"
              aria-checked={on}
              onClick={() => onChange(t.key)}
              className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl text-sm font-bold transition ${
                on ? 'bg-ocean-600 text-white shadow-sm' : 'text-ink-500 hover:text-ocean-700'
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
              {t.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* 行程改過時顯示:已自動存檔 + 恢復成推薦行程 */
function TripSaveNote({ onRestore }: { onRestore: () => void }) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-1 rounded-2xl bg-paper-100 py-1.5 pl-3.5 pr-1.5 text-xs text-ink-500">
      <span className="flex items-center gap-1.5">
        <Check className="h-3.5 w-3.5 text-ocean-600" strokeWidth={2.5} />
        已自動存在這台裝置
      </span>
      <button
        onClick={onRestore}
        className="inline-flex min-h-9 items-center gap-1 rounded-full px-2.5 font-bold text-brick-700 transition hover:bg-brick-50"
      >
        <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.5} />
        恢復成推薦行程
      </button>
    </div>
  )
}

/* 檢視(完成)模式:儲存為我的行程 */
function SaveTripButton({ onSave }: { onSave: () => void }) {
  return (
    <button
      onClick={onSave}
      className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-paper-300 py-3 text-sm font-bold text-ink-700 transition hover:border-brick-400 hover:text-brick-700"
    >
      <Bookmark className="h-4 w-4" strokeWidth={2} /> 儲存為我的行程
    </button>
  )
}

function getScrollParent(el: HTMLElement | null): HTMLElement | null {
  let p = el?.parentElement ?? null
  while (p) {
    const oy = getComputedStyle(p).overflowY
    if (oy === 'auto' || oy === 'scroll') return p
    p = p.parentElement
  }
  return null
}

function FeedCards() {
  const [count, setCount] = useState(4)
  const sentinel = useRef<HTMLDivElement>(null)
  const hasMore = count < feed.length

  useEffect(() => {
    if (!hasMore) return
    const sc = getScrollParent(sentinel.current)
    if (!sc) return
    const loadMore = () => setCount((c) => Math.min(c + 3, feed.length))
    const onScroll = () => {
      if (sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 220) loadMore()
    }
    if (sc.scrollHeight <= sc.clientHeight + 1) loadMore()
    sc.addEventListener('scroll', onScroll, { passive: true })
    return () => sc.removeEventListener('scroll', onScroll)
  }, [hasMore, count])

  return (
    <div className="space-y-3">
      {feed.slice(0, count).map((f) => (
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

      {hasMore ? (
        <div ref={sentinel} className="flex justify-center py-4">
          <span className="dz-spin-fast h-5 w-5 rounded-full border-2 border-paper-300 border-t-ocean-500" />
        </div>
      ) : (
        <p className="py-4 text-center text-xs text-ink-400">沒有更多了</p>
      )}
    </div>
  )
}

/* 手機:可拖曳的風獅爺大王小球。點一下展開行程面板,再點一下或按 X 收回 */
const BALL = 60
const HEADER_H = 64
const BALL_POS_KEY = 'dz_ball_pos'
const BALL_HINT_KEY = 'dz_ball_hint_seen'
type BallPos = { side: 'left' | 'right'; y: number }

function MobileFloat({
  isAI,
  routeTitle,
  plan,
  count,
  totalLabel,
  ed,
  open,
  setOpen,
  onEdit,
  onSave,
  onDone,
  saveNote,
  transportSlot,
}: {
  saveNote?: React.ReactNode
  transportSlot?: React.ReactNode
  isAI: boolean
  routeTitle: string
  plan: PlanStop[]
  count: number
  totalLabel: string
  ed: EditorApi
  open: boolean
  setOpen: (v: boolean) => void
  onEdit: () => void
  onSave: () => void
  onDone: () => void
}) {
  const [tab, setTab] = useState<'route' | 'feed'>('route')
  useEffect(() => {
    if (ed.editMode) setTab('route')
  }, [ed.editMode])

  // 視窗尺寸變動時重算位置
  const [, setTick] = useState(0)
  useEffect(() => {
    const f = () => setTick((n) => n + 1)
    window.addEventListener('resize', f)
    return () => window.removeEventListener('resize', f)
  }, [])

  // Esc 收回
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  // 小球位置:靠左或靠右 + 高度,記在這台裝置
  const [pos, setPos] = useState<BallPos>(() => {
    try {
      const s = JSON.parse(localStorage.getItem(BALL_POS_KEY) || 'null') as BallPos | null
      if (s && (s.side === 'left' || s.side === 'right') && typeof s.y === 'number') return s
    } catch {
      /* 用預設 */
    }
    return { side: 'right', y: (typeof window !== 'undefined' ? window.innerHeight : 800) - 190 }
  })
  const [hintSeen, setHintSeen] = useState(() => {
    try {
      return localStorage.getItem(BALL_HINT_KEY) === '1'
    } catch {
      return true
    }
  })
  const [dragXY, setDragXY] = useState<{ x: number; y: number } | null>(null)
  const drag = useRef({ active: false, sx: 0, sy: 0, ox: 0, oy: 0, moved: 0 })
  const justDragged = useRef(false)

  const vw = typeof window !== 'undefined' ? window.innerWidth : 375
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  const clampY = (y: number) => Math.min(Math.max(y, HEADER_H + 12), vh - BALL - 16)
  const sideX = (side: BallPos['side']) => (side === 'left' ? 12 : vw - BALL - 12)
  const panelTop = HEADER_H + BALL + 24 // 展開時小球停在面板上方
  const cur = dragXY ?? (open ? { x: sideX(pos.side), y: HEADER_H + 12 } : { x: sideX(pos.side), y: clampY(pos.y) })

  const onDown = (e: React.PointerEvent) => {
    drag.current = { active: true, sx: e.clientX, sy: e.clientY, ox: cur.x, oy: cur.y, moved: 0 }
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId)
    } catch {
      /* 略過 */
    }
  }
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d.active) return
    const dx = e.clientX - d.sx
    const dy = e.clientY - d.sy
    d.moved = Math.max(d.moved, Math.abs(dx), Math.abs(dy))
    if (open || d.moved < 6) return // 展開時小球固定,只能點
    setDragXY({
      x: Math.min(Math.max(d.ox + dx, 4), vw - BALL - 4),
      y: Math.min(Math.max(d.oy + dy, HEADER_H + 4), vh - BALL - 4),
    })
  }
  const onUp = () => {
    const d = drag.current
    if (!d.active) return
    d.active = false
    if (d.moved >= 6 && !open && dragXY) {
      // 放開後吸附到最近的左右邊
      const next: BallPos = { side: dragXY.x + BALL / 2 < vw / 2 ? 'left' : 'right', y: clampY(dragXY.y) }
      setPos(next)
      try {
        localStorage.setItem(BALL_POS_KEY, JSON.stringify(next))
      } catch {
        /* 忽略 */
      }
      justDragged.current = true
    }
    setDragXY(null)
  }
  const onClick = () => {
    if (justDragged.current) {
      justDragged.current = false
      return
    }
    if (!hintSeen) {
      setHintSeen(true)
      try {
        localStorage.setItem(BALL_HINT_KEY, '1')
      } catch {
        /* 忽略 */
      }
    }
    setOpen(!open)
  }

  return (
    <>
      {/* 風獅爺大王小球 */}
      <button
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onClick={onClick}
        aria-label={open ? '收起行程面板' : '打開行程面板'}
        aria-expanded={open}
        className={`fixed z-[580] rounded-full shadow-[0_6px_16px_rgba(42,35,32,0.35)] active:scale-95 lg:hidden ${open ? 'ring-4 ring-brick-600/70' : ''}`}
        style={{
          left: cur.x,
          top: cur.y,
          width: BALL,
          height: BALL,
          touchAction: 'none',
          transition: dragXY ? 'transform 0.1s' : 'left 0.3s cubic-bezier(0.16,1,0.3,1), top 0.3s cubic-bezier(0.16,1,0.3,1), transform 0.15s',
        }}
      >
        <img src="/markers/lion-king.png" alt="" draggable={false} className="h-full w-full select-none rounded-full" />
      </button>

      {/* 第一次使用的小提示 */}
      {!hintSeen && !open && !dragXY && (
        <div
          className="dz-sheet-in pointer-events-none fixed z-[579] whitespace-nowrap rounded-full bg-ink-900/90 px-3 py-1.5 text-xs font-bold text-white shadow-lg lg:hidden"
          style={
            pos.side === 'right'
              ? { top: cur.y + BALL / 2 - 14, right: vw - cur.x + 8 }
              : { top: cur.y + BALL / 2 - 14, left: cur.x + BALL + 8 }
          }
        >
          點我看行程
        </div>
      )}

      {/* 展開的行程面板 */}
      {open && (
        <div
          role="dialog"
          aria-label="我的行程"
          className="dz-sheet-in fixed inset-x-3 bottom-3 z-[560] flex flex-col overflow-hidden rounded-3xl bg-paper-50 shadow-2xl ring-1 ring-ink-900/10 lg:hidden"
          style={{ top: panelTop }}
        >
          <div className="flex shrink-0 items-center gap-2 p-3">
            {ed.editMode ? (
              <p className="flex-1 pl-2 text-sm font-black text-ink-900">編輯行程</p>
            ) : (
              <div className="flex flex-1 gap-2">
                <button
                  onClick={() => setTab('route')}
                  aria-pressed={tab === 'route'}
                  className={`inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-full text-sm font-bold transition ${
                    tab === 'route' ? 'bg-brick-600 text-white' : 'bg-paper-200 text-ink-500'
                  }`}
                >
                  <Route className="h-4 w-4" strokeWidth={2} /> 本次行程
                </button>
                <button
                  onClick={() => setTab('feed')}
                  aria-pressed={tab === 'feed'}
                  className={`inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-full text-sm font-bold transition ${
                    tab === 'feed' ? 'bg-ocean-600 text-white' : 'bg-paper-200 text-ink-500'
                  }`}
                >
                  <Newspaper className="h-4 w-4" strokeWidth={2} /> 網路動態
                </button>
              </div>
            )}
            <button
              onClick={() => setOpen(false)}
              aria-label="收起行程面板"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-500 transition hover:bg-paper-200"
            >
              <X className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
          {tab === 'route' ? (
            <>
              <div className="pt-1">
                <RouteHeader isAI={isAI} count={count} totalLabel={totalLabel} title={routeTitle} editMode={ed.editMode} onEdit={onEdit} />
                {!ed.editMode && transportSlot}
              </div>
              <div className="mt-4">
                <Itinerary plan={plan} ed={ed} />
              </div>
              {saveNote}
              {!ed.editMode && <SaveTripButton onSave={onSave} />}
            </>
          ) : (
            <FeedCards />
          )}
        </div>

          {ed.editMode && <EditorActions onDone={onDone} />}
        </div>
      )}
    </>
  )
}

/* ---------- 選景點 / 編輯停留時間 的視窗 ---------- */
function EditorModal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-[900] flex items-end justify-center bg-ink-900/40 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="dz-sheet-in flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl ring-1 ring-ink-900/10 sm:max-w-md sm:rounded-3xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-paper-200 px-5 py-4">
          <h3 className="font-black text-ink-900">{title}</h3>
          <button onClick={onClose} aria-label="關閉" className="flex h-9 w-9 items-center justify-center rounded-full text-ink-500 transition hover:bg-paper-100">
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">{children}</div>
      </div>
    </div>
  )
}

function PickerModal({
  pois,
  title,
  onPick,
  onClose,
}: {
  pois: Stop[]
  title: string
  onPick: (s: Stop) => void
  onClose: () => void
}) {
  const [q, setQ] = useState('')
  const list = pois.filter((p) => p.name.includes(q.trim()))
  return (
    <EditorModal title={title} onClose={onClose}>
      <div className="mb-3 flex items-center gap-2 rounded-xl border border-paper-300 bg-white px-3.5">
        <Search className="h-4 w-4 shrink-0 text-ink-400" strokeWidth={2} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜尋地點或商家"
          aria-label="搜尋地點或商家"
          className="min-h-11 w-full bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400"
        />
      </div>
      {list.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-400">找不到符合的地點</p>
      ) : (
        <div className="space-y-2">
          {list.map((p) => (
            <button
              key={p.id}
              onClick={() => onPick(p)}
              className="flex w-full items-center gap-3 rounded-2xl border border-paper-200 p-3 text-left transition hover:border-brick-400 hover:bg-paper-50"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-ocean-100 to-sun-300/40 text-ocean-400">
                <ImageIcon className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-ink-900">{p.name}</p>
                <p className="mt-0.5 flex items-center gap-2 text-xs text-ink-400">
                  <span>{categoryLabel[p.category]}</span>
                  <span className="flex items-center gap-0.5">
                    <Star className="h-3 w-3 fill-sun-500 text-sun-500" strokeWidth={0} /> {p.rating}
                  </span>
                </p>
              </div>
              <Plus className="h-5 w-5 shrink-0 text-brick-600" strokeWidth={2.5} />
            </button>
          ))}
        </div>
      )}
    </EditorModal>
  )
}

function StayModal({ stop, onSave, onClose }: { stop: PlanStop; onSave: (min: number) => void; onClose: () => void }) {
  const [min, setMin] = useState(stop.stayMin)
  const step = (d: number) => setMin((m) => Math.max(5, Math.min(600, m + d)))
  return (
    <EditorModal title={`「${stop.name}」停留時間`} onClose={onClose}>
      <div className="flex items-center justify-center gap-4">
        <button onClick={() => step(-5)} aria-label="減少 5 分鐘" className="flex h-12 w-12 items-center justify-center rounded-full bg-paper-200 text-ink-700 transition hover:bg-paper-300">
          <Minus className="h-5 w-5" strokeWidth={2.5} />
        </button>
        <div className="flex items-baseline gap-1">
          <input
            type="number"
            min={5}
            step={5}
            inputMode="numeric"
            value={min}
            onChange={(e) => setMin(Math.max(0, Number(e.target.value) || 0))}
            aria-label="停留分鐘"
            className="w-20 rounded-xl border border-paper-300 bg-white py-2 text-center text-2xl font-black text-ink-900 outline-none focus:border-brick-400"
          />
          <span className="text-sm font-medium text-ink-400">分鐘</span>
        </div>
        <button onClick={() => step(5)} aria-label="增加 5 分鐘" className="flex h-12 w-12 items-center justify-center rounded-full bg-paper-200 text-ink-700 transition hover:bg-paper-300">
          <Plus className="h-5 w-5" strokeWidth={2.5} />
        </button>
      </div>
      <button
        onClick={() => onSave(Math.max(5, min))}
        className="mt-6 w-full rounded-full bg-brick-600 py-3 text-sm font-bold text-white transition hover:bg-brick-700"
      >
        儲存
      </button>
    </EditorModal>
  )
}

export default function MapPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()

  // 目前行程:自動存在這台裝置。只有「選路線 / AI 生成」產生新遊程時才覆蓋,其他方式回來都還原存檔。
  const freshTrip = !!(location.state as { freshTrip?: boolean } | null)?.freshTrip
  const urlKey = params.get('type') === 'ai' ? 'ai' : `island:${params.get('route') ?? curatedRoutes[0].id}`
  const [trip] = useState<SavedTrip>(() => {
    const saved = loadTrip()
    if (!freshTrip && saved) return saved
    const original = routeFromKey(urlKey).stops
    return { key: urlKey, plan: original, original, transport: defaultTransport(urlKey) }
  })
  const isAI = trip.key === 'ai'
  const route = routeFromKey(trip.key)
  const routeTitle = isAI ? '為你生成的行程' : route.title
  const original = trip.original

  // 可編輯的行程本地狀態
  const [plan, setPlan] = useState<PlanStop[]>(trip.plan)
  const [transport, setTransport] = useState<Transport>(trip.transport ?? defaultTransport(trip.key))
  useEffect(() => {
    saveTrip({ key: trip.key, plan, original, transport })
  }, [plan, trip.key, original, transport])
  // 用完「新遊程」標記就清掉,並讓網址對上實際顯示的行程(避免重新整理又被當成新遊程)
  useEffect(() => {
    if (freshTrip || trip.key !== urlKey) navigate(tripUrl(trip.key), { replace: true, state: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const isModified = planSignature(plan) !== planSignature(original)
  const [confirmReplan, setConfirmReplan] = useState(false)
  const [confirmRestore, setConfirmRestore] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selected, setSelected] = useState<Stop | null>(null)
  const [filter, setFilter] = useState<Category | 'all'>('all')
  const [panelOpen, setPanelOpen] = useState(false) // 手機:風獅爺小球展開的行程面板
  const [picker, setPicker] = useState<{ mode: 'add' | 'replace'; index: number } | null>(null)
  const [stayEdit, setStayEdit] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)

  const toastTimer = useRef<number | null>(null)
  const showToast = (msg: string) => {
    setToast(msg)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2000)
  }

  const inPlan = (id: string) => plan.some((s) => s.id === id)

  // 可加入的景點池(所有遊程站點 + 額外探索點,去重且排除已在行程內)
  const poiPool = useMemo(() => {
    const map = new Map<string, Stop>()
    for (const r of curatedRoutes) for (const s of r.stops) if (!map.has(s.id)) map.set(s.id, s)
    for (const p of extraPois) if (!map.has(p.id)) map.set(p.id, p)
    return [...map.values()]
  }, [])
  const addablePois = poiPool.filter((p) => !inPlan(p.id))

  // 手機上從清單點站點:收起面板,讓旅客看到地圖與詳情卡(編輯中則不收)
  const selectStop = (s: Stop) => {
    setSelected(s)
    if (!editMode) setPanelOpen(false)
  }
  const collapseAll = () => {
    setSelected(null)
    setPanelOpen(false)
  }

  const enterEdit = () => {
    setEditMode(true)
    setPanelOpen(true)
    setSelected(null)
  }

  // 編輯操作
  const movePlan = (from: number, to: number) =>
    setPlan((p) => {
      const n = [...p]
      const [m] = n.splice(from, 1)
      n.splice(to, 0, m)
      return n
    })
  const setStay = (index: number, mn: number) =>
    setPlan((p) => p.map((s, i) => (i === index ? { ...s, stayMin: mn } : s)))
  const removeAt = (index: number) => {
    setPlan((p) => (p.length <= 1 ? p : p.filter((_, i) => i !== index)))
    showToast('已從行程移除')
  }
  const pickPoi = (poi: Stop) => {
    if (!picker) return
    setPlan((p) => {
      const n = [...p]
      if (picker.mode === 'replace') n[picker.index] = poi
      else n.splice(picker.index, 0, poi)
      return n
    })
    showToast(picker.mode === 'replace' ? '已更換地點' : '已加入地點')
    setPicker(null)
  }
  const addFromMap = (poi: Stop) => {
    setPlan((p) => [...p, poi])
    setSelected(null)
    showToast('已加入行程')
  }
  const saveMyTrip = () => {
    try {
      localStorage.setItem('dz_my_trip', JSON.stringify({ title: routeTitle, stops: plan, savedAt: Date.now() }))
    } catch {
      /* 忽略儲存失敗 */
    }
    showToast('已儲存為我的行程')
  }

  const ed: EditorApi = {
    editMode,
    selectedId: selected?.id,
    onSelect: selectStop,
    onMove: movePlan,
    transport,
    onEditStay: (i) => setStayEdit(i),
    onReplace: (i) => setPicker({ mode: 'replace', index: i }),
    onRemove: removeAt,
    onAddAt: (i) => setPicker({ mode: 'add', index: i }),
  }

  // GPS 定位
  const mapRef = useRef<L.Map | null>(null)
  const [userPos, setUserPos] = useState<[number, number] | null>(null)
  const [locating, setLocating] = useState(false)
  const requestLocate = (fly = true) => {
    if (!('geolocation' in navigator)) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p: [number, number] = [pos.coords.latitude, pos.coords.longitude]
        setUserPos(p)
        if (fly) mapRef.current?.flyTo(p, 16, { duration: 0.8 })
        setLocating(false)
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 },
    )
  }
  useEffect(() => {
    requestLocate(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const routePositions = plan.map((s) => [s.lat, s.lng] as [number, number])
  const totalMin = useMemo(() => {
    const stay = plan.reduce((a, s) => a + s.stayMin, 0)
    const travel = plan.slice(0, -1).reduce((a, s, i) => a + legMinutes(s, plan[i + 1], transport), 0)
    return stay + travel
  }, [plan, transport])
  const totalLabel = totalMin >= 60 ? `約 ${(totalMin / 60).toFixed(1).replace(/\.0$/, '')} 小時` : `約 ${totalMin} 分鐘`
  const showPoi = (cat: Category) => filter === 'all' || filter === cat

  const stayStop = stayEdit !== null ? plan[stayEdit] : null

  return (
    <div className="flex h-screen flex-col bg-paper-100">
      {/* 頂列 */}
      <header className="z-30 flex h-16 shrink-0 items-center justify-between border-b border-ink-900/5 bg-paper-50 px-4 sm:px-6">
        <Logo className="h-9" />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setUploadOpen(true)}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-paper-300 px-3 text-sm font-medium text-ink-700 transition hover:border-brick-400 hover:text-brick-700 sm:px-4"
          >
            <Trophy className="h-4 w-4 text-sun-500" strokeWidth={2.5} />
            上傳排行榜
          </button>
          <button
            onClick={() => (isModified ? setConfirmReplan(true) : navigate('/choose'))}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-paper-300 px-3 text-sm font-medium text-ink-700 transition hover:border-brick-400 hover:text-brick-700 sm:px-4"
          >
            <RotateCcw className="h-4 w-4" strokeWidth={2} />
            重新規劃
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* 左欄:本次行程(桌面) */}
        <aside className="hidden w-80 shrink-0 flex-col border-r border-ink-900/5 bg-paper-50 lg:flex">
          <div className="min-h-0 flex-1 overflow-y-auto p-6">
            <RouteHeader isAI={isAI} count={plan.length} totalLabel={totalLabel} title={routeTitle} editMode={editMode} onEdit={enterEdit} />
            {!editMode && <TransportPicker value={transport} onChange={setTransport} />}
            <div className="mt-6">
              <Itinerary plan={plan} ed={ed} />
            </div>
            {isModified && <TripSaveNote onRestore={() => setConfirmRestore(true)} />}
            {!editMode && <SaveTripButton onSave={saveMyTrip} />}
          </div>
          {editMode && <EditorActions onDone={() => setEditMode(false)} />}
        </aside>

        {/* 中央:地圖 */}
        <main className="relative min-w-0 flex-1">
          <div className="absolute inset-x-3 top-3 z-[500] flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="no-scrollbar flex gap-1.5 overflow-x-auto sm:flex-wrap">
              {CATS.map(({ key, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold shadow-sm ring-1 transition sm:py-1.5 ${
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
              搜尋地點或商家
            </div>
          </div>

          <MapContainer ref={mapRef} center={KINMEN_CENTER} zoom={15} className="h-full w-full" zoomControl={false}>
            <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <FlyTo stop={selected} />
            <FitRoute positions={routePositions} />
            <MapClick onClick={collapseAll} />
            <ZoomControls />

            <Polyline positions={routePositions} pathOptions={{ color: '#1b6fa6', weight: 4, dashArray: '1 9', lineCap: 'round' }} />

            {addablePois.filter((p) => showPoi(p.category)).map((p) => (
              <Marker
                key={p.id}
                position={[p.lat, p.lng]}
                icon={poiIcon(selected?.id === p.id)}
                title={p.name}
                zIndexOffset={selected?.id === p.id ? 1000 : 0}
                eventHandlers={{ click: () => setSelected(p) }}
              />
            ))}
            {plan.map((s, i) => (
              <Marker
                key={s.id}
                position={[s.lat, s.lng]}
                icon={stopIcon(i + 1, selected?.id === s.id)}
                title={`第 ${i + 1} 站 ${s.name}`}
                zIndexOffset={selected?.id === s.id ? 1000 : 500}
                eventHandlers={{ click: () => setSelected(s) }}
              />
            ))}
            {userPos && <Marker position={userPos} icon={meIcon()} />}
          </MapContainer>

          <button
            onClick={() => requestLocate(true)}
            className="absolute bottom-10 right-3 z-[500] flex h-11 w-11 items-center justify-center rounded-full bg-white text-ocean-600 shadow-md ring-1 ring-ink-900/10 transition hover:bg-paper-100 active:scale-95 lg:bottom-[104px]"
            aria-label="定位我的位置"
          >
            <Navigation className={`h-5 w-5 ${locating ? 'animate-pulse' : ''}`} strokeWidth={2} fill={userPos ? 'currentColor' : 'none'} />
          </button>

          {selected && (
            <DetailCard
              stop={selected}
              inPlan={inPlan(selected.id)}
              distanceM={plan.length ? Math.round((Math.min(...plan.map((s) => haversineKm(s, selected))) * 1000) / 10) * 10 : 0}
              onAdd={() => addFromMap(selected)}
              onClose={() => setSelected(null)}
            />
          )}
        </main>

        {/* 右欄:在地動態牆(桌面) */}
        <aside className="hidden w-80 shrink-0 overflow-y-auto border-l border-ink-900/5 bg-paper-50 p-6 xl:block">
          <div className="flex items-center gap-2 text-ocean-600">
            <Sparkles className="h-4 w-4" strokeWidth={2} />
            <span className="text-xs font-semibold">金門最新活動與旅遊資訊</span>
          </div>
          <h2 className="mt-2 text-xl font-black text-ink-900">網路動態牆</h2>
          <div className="mt-5">
            <FeedCards />
          </div>
        </aside>
      </div>

      {/* 手機:風獅爺大王小球 + 行程面板 */}
      <MobileFloat
        isAI={isAI}
        routeTitle={routeTitle}
        plan={plan}
        count={plan.length}
        totalLabel={totalLabel}
        ed={ed}
        open={panelOpen}
        setOpen={setPanelOpen}
        onEdit={enterEdit}
        onSave={saveMyTrip}
        onDone={() => setEditMode(false)}
        saveNote={isModified ? <TripSaveNote onRestore={() => setConfirmRestore(true)} /> : null}
        transportSlot={<TransportPicker value={transport} onChange={setTransport} />}
      />

      {/* 選景點:加入 / 更換 */}
      {picker && (
        <PickerModal
          title={picker.mode === 'replace' ? '更換為其他地點' : '加入地點'}
          pois={addablePois}
          onPick={pickPoi}
          onClose={() => setPicker(null)}
        />
      )}

      {/* 編輯停留時間 */}
      {stayStop && stayEdit !== null && (
        <StayModal
          stop={stayStop}
          onSave={(mn) => { setStay(stayEdit, mn); setStayEdit(null) }}
          onClose={() => setStayEdit(null)}
        />
      )}

      {/* 關鍵提醒:行程改過又要重新規劃 */}
      {confirmReplan && (
        <EditorModal title="要重新規劃嗎?" onClose={() => setConfirmReplan(false)}>
          <p className="text-sm leading-relaxed text-ink-700">
            你改過的行程已自動存在這台裝置,重新整理或離開再回來都還在。
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink-700">
            但選了新路線或讓 AI 重新生成後,這份行程就會被<span className="font-bold text-brick-700">新的遊程取代</span>。
          </p>
          <div className="mt-6 flex gap-2.5">
            <button
              onClick={() => setConfirmReplan(false)}
              className="min-h-12 flex-1 rounded-full border border-paper-300 text-sm font-bold text-ink-700 transition hover:bg-paper-100"
            >
              留在這裡
            </button>
            <button
              onClick={() => navigate('/choose')}
              className="min-h-12 flex-1 rounded-full bg-brick-600 text-sm font-bold text-white transition hover:bg-brick-700"
            >
              重新規劃
            </button>
          </div>
        </EditorModal>
      )}

      {/* 恢復成推薦行程 */}
      {confirmRestore && (
        <EditorModal title="恢復成推薦行程?" onClose={() => setConfirmRestore(false)}>
          <p className="text-sm leading-relaxed text-ink-700">你做的修改會全部還原成原本推薦的行程。</p>
          <div className="mt-6 flex gap-2.5">
            <button
              onClick={() => setConfirmRestore(false)}
              className="min-h-12 flex-1 rounded-full border border-paper-300 text-sm font-bold text-ink-700 transition hover:bg-paper-100"
            >
              取消
            </button>
            <button
              onClick={() => {
                setPlan(original)
                setConfirmRestore(false)
                showToast('已恢復成推薦行程')
              }}
              className="min-h-12 flex-1 rounded-full bg-brick-600 text-sm font-bold text-white transition hover:bg-brick-700"
            >
              確定還原
            </button>
          </div>
        </EditorModal>
      )}

      {/* 快速上傳到創意排行榜(不離開地圖,行程不會不見) */}
      {uploadOpen && (
        <UploadSheet
          hint="可以先截圖你的遊程畫面,當作照片上傳"
          notify={showToast}
          onClose={() => setUploadOpen(false)}
          onSubmit={(entry) => {
            if (!submitEntry(entry)) {
              showToast('照片容量太大,請減少張數後再試')
              return false
            }
            showToast('已上傳到創意排行榜')
            return true
          }}
        />
      )}

      {/* 輕量提示 */}
      {toast && (
        <div className="dz-sheet-in fixed bottom-6 left-1/2 z-[950] -translate-x-1/2 rounded-full bg-ink-900/90 px-5 py-2.5 text-sm font-bold text-white shadow-lg" role="status">
          {toast}
        </div>
      )}
    </div>
  )
}

function DetailCard({
  stop,
  inPlan,
  distanceM,
  onAdd,
  onClose,
}: {
  stop: Stop
  inPlan: boolean
  distanceM: number
  onAdd: () => void
  onClose: () => void
}) {
  const [dragY, setDragY] = useState(0)
  const [anim, setAnim] = useState(true)
  const d = useRef({ active: false, startY: 0, dy: 0 })

  const onDown = (e: React.PointerEvent) => {
    d.current = { active: true, startY: e.clientY, dy: 0 }
    setAnim(false)
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId)
    } catch {
      /* 略過 */
    }
  }
  const onMove = (e: React.PointerEvent) => {
    if (!d.current.active) return
    const dy = Math.max(0, e.clientY - d.current.startY)
    d.current.dy = dy
    setDragY(dy)
  }
  const onUp = () => {
    if (!d.current.active) return
    d.current.active = false
    setAnim(true)
    if (d.current.dy > 110) onClose()
    else setDragY(0)
  }

  return (
    <div
      className="absolute inset-x-0 bottom-0 z-[700] sm:inset-x-auto sm:bottom-auto sm:right-3 sm:top-16 sm:w-[350px]"
      style={{
        transform: dragY ? `translateY(${dragY}px)` : undefined,
        transition: anim ? 'transform 0.28s cubic-bezier(0.16,1,0.3,1)' : 'none',
      }}
    >
      <div className="dz-sheet-in flex max-h-[85vh] flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl ring-1 ring-ink-900/10 sm:max-h-none sm:rounded-3xl">
        <div onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} className="shrink-0 cursor-grab touch-none bg-white py-2 active:cursor-grabbing sm:hidden">
          <div className="mx-auto h-1.5 w-10 rounded-full bg-paper-300" />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="relative h-36 bg-gradient-to-br from-ocean-100 via-paper-200 to-sun-300/50">
            <div className="absolute inset-0 flex items-center justify-center text-ocean-300">
              <ImageIcon className="h-10 w-10" strokeWidth={1.25} />
            </div>
            <button
              onClick={onClose}
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink-700 shadow transition hover:bg-white"
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

          <div className="p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <h3 className="text-lg font-black text-ink-900">{stop.name}</h3>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-500">
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-sun-500 text-sun-500" strokeWidth={0} />
                <span className="font-bold text-ink-900">{stop.rating}</span>
              </span>
              <span className="text-ink-400">{stop.reviewCount} 則評論</span>
              <span className="text-ink-500">{categoryLabel[stop.category]}</span>
              {inPlan && (
                <span className="flex items-center gap-1 text-ink-400">
                  <Clock className="h-3.5 w-3.5" strokeWidth={2} /> 約 {stop.stayMin} 分鐘
                </span>
              )}
            </p>

            {!inPlan && (
              <div className="mt-3 rounded-2xl bg-paper-100 p-3 text-xs text-ink-500">
                距離路線約 {distanceM} 公尺
              </div>
            )}

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
              {inPlan ? (
                <>
                  <button className="flex-1 rounded-full border border-paper-300 py-3 text-sm font-bold text-ink-700 transition hover:bg-paper-100">
                    看完整評論
                  </button>
                  <button className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-brick-600 py-3 text-sm font-bold text-white transition hover:bg-brick-700">
                    <Navigation className="h-4 w-4" strokeWidth={2} /> 導航前往
                  </button>
                </>
              ) : (
                <button
                  onClick={onAdd}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-brick-600 py-3 text-sm font-bold text-white transition hover:bg-brick-700"
                >
                  <Plus className="h-4 w-4" strokeWidth={2.5} /> 加入行程
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
