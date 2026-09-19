// 後台假資料層:以 localStorage 保存,種子來自旅客端 mock。之後接真後端時,把這層換成 API 呼叫即可。
import { curatedRoutes, feed, type Category } from '../data/mock'

export type { Category }

export interface AdminStore {
  id: string
  name: string
  category: Category
  lat: number
  lng: number
  desc: string // 特色說明(人工維護)
  published: boolean // 上架
  rating: number
  reviewCount: number
  reviews: string[] // 外部評論(爬蟲)
}

export type OfferKind = 'offer' | 'activity'
export interface Offer {
  id: string
  storeId: string
  kind: OfferKind // 優惠 / 活動
  title: string
}

export interface AdminRoute {
  id: string
  title: string
  summary: string
  theme: 'brick' | 'ocean' | 'ochre'
  storeIds: string[]
  published: boolean
}

export type FieldType = 'single' | 'multi' | 'text'
export interface FormField {
  id: string
  label: string
  type: FieldType
  options: string[]
}

export interface TravelInfo {
  id: string
  title: string
  summary: string
  source: string
}

export interface AdminDB {
  stores: AdminStore[]
  offers: Offer[]
  routes: AdminRoute[]
  form: FormField[]
  travel: TravelInfo[]
  crawler: { reviewsAt: string | null; travelAt: string | null }
}

const KEY = 'dz_admin_v1'

function seed(): AdminDB {
  const storeMap = new Map<string, AdminStore>()
  const offers: Offer[] = []
  for (const r of curatedRoutes) {
    for (const s of r.stops) {
      if (!storeMap.has(s.id)) {
        storeMap.set(s.id, {
          id: s.id,
          name: s.name,
          category: s.category,
          lat: s.lat,
          lng: s.lng,
          desc: s.desc,
          published: true,
          rating: s.rating,
          reviewCount: s.reviewCount,
          reviews: s.aiSummary,
        })
      }
      for (const t of s.tags) {
        const kind: OfferKind = /優惠|折|券|送/.test(t) ? 'offer' : 'activity'
        offers.push({ id: `${s.id}-${offers.length}`, storeId: s.id, kind, title: t })
      }
    }
  }
  const routes: AdminRoute[] = curatedRoutes.map((r) => ({
    id: r.id,
    title: r.title,
    summary: r.summary,
    theme: r.theme,
    storeIds: r.stops.map((s) => s.id),
    published: true,
  }))
  const form: FormField[] = [
    { id: 'q1', label: '你想玩多久?', type: 'single', options: ['半天', '一天', '兩天以上'] },
    { id: 'q2', label: '和誰一起旅行?', type: 'single', options: ['一個人', '情侶', '家庭', '朋友'] },
    { id: 'q3', label: '最想體驗?', type: 'multi', options: ['美食', '文化古蹟', '自然風光', '拍照打卡', '購物', '深度慢遊'] },
    { id: 'q4', label: '特別想去或想避開的?', type: 'text', options: [] },
  ]
  const travel: TravelInfo[] = feed.map((f) => ({ id: f.id, title: f.title, summary: f.summary, source: f.source }))
  return { stores: [...storeMap.values()], offers, routes, form, travel, crawler: { reviewsAt: null, travelAt: null } }
}

export function loadDB(): AdminDB {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as AdminDB
  } catch {
    /* 本地儲存不可用時退回種子 */
  }
  const s = seed()
  saveDB(s)
  return s
}

export function saveDB(db: AdminDB) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db))
  } catch {
    /* 忽略寫入失敗 */
  }
}

export function resetDB(): AdminDB {
  const s = seed()
  saveDB(s)
  return s
}

export const categoryLabel: Record<Category, string> = {
  food: '美食',
  culture: '文化',
  nature: '自然',
  shopping: '購物',
}

// 假的 Google Place 匯入候選(手動匯入時挑選)
export const placeCandidates: Omit<AdminStore, 'published' | 'reviews' | 'desc'>[] = [
  { id: 'gp-1', name: '陳景蘭洋樓', category: 'culture', lat: 24.4193, lng: 118.3897, rating: 4.6, reviewCount: 512 },
  { id: 'gp-2', name: '成功海灘', category: 'nature', lat: 24.4128, lng: 118.3969, rating: 4.5, reviewCount: 388 },
  { id: 'gp-3', name: '金水食堂', category: 'food', lat: 24.4088, lng: 118.3162, rating: 4.4, reviewCount: 267 },
  { id: 'gp-4', name: '山后民俗文化村', category: 'culture', lat: 24.4989, lng: 118.4184, rating: 4.7, reviewCount: 634 },
  { id: 'gp-5', name: '峰上巡檢司', category: 'culture', lat: 24.4025, lng: 118.4271, rating: 4.3, reviewCount: 121 },
  { id: 'gp-6', name: '金門和平紀念園區', category: 'nature', lat: 24.4386, lng: 118.4471, rating: 4.5, reviewCount: 209 },
]

// 產生穩定 id
export const uid = () => Math.random().toString(36).slice(2, 9)

// 今天日期字串
export const nowStamp = () =>
  new Date().toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
