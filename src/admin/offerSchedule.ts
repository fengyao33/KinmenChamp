import type { Offer } from './data'

export type OfferDisplayStatus = 'disabled' | 'upcoming' | 'active' | 'ended'

/** 前端顯示用狀態；正式上下架仍須由後端依同一時間區間處理。 */
export function offerDisplayStatus(offer: Offer, now = Date.now()): OfferDisplayStatus {
  if (offer.published === false) return 'disabled'
  if (!offer.startAt || !offer.endAt) return 'active'
  if (now < Date.parse(offer.startAt)) return 'upcoming'
  if (now >= Date.parse(offer.endAt)) return 'ended'
  return 'active'
}

export const offerStatusLabel: Record<OfferDisplayStatus, string> = {
  disabled: '已停用',
  upcoming: '待上架',
  active: '已上架',
  ended: '已結束',
}

export function formatOfferTime(value: string): string {
  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(value))
}

export function toDateTimeLocal(value: string): string {
  const d = new Date(value)
  const n = (v: number) => String(v).padStart(2, '0')
  return `${d.getFullYear()}-${n(d.getMonth() + 1)}-${n(d.getDate())}T${n(d.getHours())}:${n(d.getMinutes())}`
}
