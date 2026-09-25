// 後台畫面用的本機審核狀態。正式上線時由後端 API 保存並控制旅客端曝光。
const KEY = 'dz_admin_leaderboard_moderation_v1'

export type ModerationRecord = {
  reason: string
  note: string
  updatedAt: number
}

export type ModerationMap = Record<string, ModerationRecord>

export const moderationTimestamp = () => Date.now()

export function loadModeration(): ModerationMap {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as ModerationMap : {}
  } catch {
    return {}
  }
}

export function saveModeration(next: ModerationMap): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
    return true
  } catch {
    return false
  }
}
