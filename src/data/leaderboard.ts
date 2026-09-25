// 創意排行榜假資料層:以 localStorage 保存。之後接後端時換成 API(投稿、投票、排名)。

export interface CreativeEntry {
  id: string
  title: string // 遊程名稱
  desc: string // 創意說明
  author: string // 暱稱
  phone?: string // 聯絡電話(僅官方聯繫用,前台不顯示)
  photos: string[] // 照片(壓縮後 dataURL),第一張為封面
  votes: number
  createdAt: number
  mine?: boolean // 本機投稿
}

const KEY = 'dz_leaderboard_v1'
const VOTED_KEY = 'dz_leaderboard_voted'
const DAY = 86400000

function seed(): CreativeEntry[] {
  const now = Date.now()
  return [
    {
      id: 'c1',
      title: '騎機車追夕陽,建功嶼到莒光樓',
      desc: '下午退潮走進建功嶼,傍晚騎到莒光樓看夕陽把整座金城染成橘色,晚餐就近吃廣東粥。',
      author: '阿哲',
      photos: [],
      votes: 128,
      createdAt: now - 9 * DAY,
    },
    {
      id: 'c2',
      title: '坑道探險配高粱微醺',
      desc: '白天鑽翟山坑道聽回音,晚上去酒廠周邊小酌,戰地氣氛和在地酒香一次收集。',
      author: '小島旅人',
      photos: [],
      votes: 96,
      createdAt: now - 7 * DAY,
    },
    {
      id: 'c3',
      title: '風獅爺巡禮,一天找齊十尊',
      desc: '照村落順序排好路線,每找到一尊就拍一張合照,最後拼成自己的風獅爺圖鑑。',
      author: 'Mia',
      photos: [],
      votes: 87,
      createdAt: now - 5 * DAY,
    },
    {
      id: 'c4',
      title: '古厝咖啡慢遊',
      desc: '挑三間老屋改建的咖啡館,每間待一小時,中間用步行串起聚落巷弄。',
      author: '慢慢走',
      photos: [],
      votes: 64,
      createdAt: now - 3 * DAY,
    },
    {
      id: 'c5',
      title: '清晨慈湖賞鳥',
      desc: '六點到慈湖等鸕鶿歸巢,帶望遠鏡和早餐,看完順路去雙鯉濕地。',
      author: '鳥人阿凱',
      photos: [],
      votes: 41,
      createdAt: now - 1 * DAY,
    },
  ]
}

export function loadEntries(): CreativeEntry[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as CreativeEntry[]
  } catch {
    /* 本地儲存不可用時退回種子 */
  }
  const s = seed()
  saveEntries(s)
  return s
}

/** 回傳是否寫入成功(照片太多可能超過瀏覽器容量) */
export function saveEntries(list: CreativeEntry[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
    return true
  } catch {
    return false
  }
}

/** 新增一則投稿到最前面(地圖頁快速上傳用),回傳是否成功 */
export function submitEntry(e: CreativeEntry): boolean {
  return saveEntries([e, ...loadEntries()])
}

export function loadVoted(): string[] {
  try {
    const raw = localStorage.getItem(VOTED_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function saveVoted(ids: string[]) {
  try {
    localStorage.setItem(VOTED_KEY, JSON.stringify(ids))
  } catch {
    /* 忽略 */
  }
}

/** 依票數排名(同票數時較早投稿者在前) */
export function rankByVotes(list: CreativeEntry[]) {
  return [...list].sort((a, b) => b.votes - a.votes || a.createdAt - b.createdAt)
}

/** 把照片縮到長邊 max 像素並轉 JPEG,控制容量 */
export function compressImage(file: File, max = 1280, quality = 0.78): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      URL.revokeObjectURL(url)
      if (!ctx) {
        reject(new Error('canvas'))
        return
      }
      ctx.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('load'))
    }
    img.src = url
  })
}

export const uid = () => Math.random().toString(36).slice(2, 10)

/** 電話正規化:去掉空白、橫線、括號,+886 轉成 0;格式不對回傳 null */
export function normalizePhone(raw: string): string | null {
  let p = raw.replace(/[\s\-()]/g, '')
  if (p.startsWith('+886')) p = '0' + p.slice(4)
  else if (p.startsWith('886')) p = '0' + p.slice(3)
  return /^0\d{8,9}$/.test(p) ? p : null
}
