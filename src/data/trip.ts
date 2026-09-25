// 目前行程:存在這台裝置(匿名也適用)。地圖頁寫入;首頁、排行榜、遊程列表、AI 表單讀取。
import { curatedRoutes, type Stop } from './mock'

// 路線演算法一次只能用一種交通工具,所以交通方式是「整趟行程」一個設定
export type Transport = 'walk' | 'scooter' | 'drive'

export interface SavedTrip {
  key: string // 'ai' 或 'island:<routeId>'
  plan: Stop[]
  original: Stop[] // 推薦的原始行程,用來「恢復成推薦行程」
  transport?: Transport
}

const TRIP_KEY = 'dz_current_trip'

export function loadTrip(): SavedTrip | null {
  try {
    const raw = localStorage.getItem(TRIP_KEY)
    return raw ? (JSON.parse(raw) as SavedTrip) : null
  } catch {
    return null
  }
}

export function saveTrip(t: SavedTrip) {
  try {
    localStorage.setItem(TRIP_KEY, JSON.stringify(t))
  } catch {
    /* 忽略寫入失敗 */
  }
}

export function routeFromKey(key: string) {
  const id = key.startsWith('island:') ? key.slice(7) : ''
  return curatedRoutes.find((r) => r.id === id) ?? curatedRoutes[0]
}

/** 回到這份行程的網址(不帶「新遊程」標記,地圖頁會還原存檔) */
export const tripUrl = (key: string) => (key === 'ai' ? '/map?type=ai' : `/map?type=island&route=${key.slice(7)}`)

export const tripTitle = (t: SavedTrip) => (t.key === 'ai' ? '為你生成的行程' : routeFromKey(t.key).title)

export const planSignature = (p: Stop[]) => p.map((s) => `${s.id}:${s.stayMin}`).join('|')

/** 旅客是否改過這份行程(改過才需要在覆蓋前提醒) */
export const isTripModified = (t: SavedTrip) => planSignature(t.plan) !== planSignature(t.original)
