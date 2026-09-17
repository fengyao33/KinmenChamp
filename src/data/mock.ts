// 島轉 MVP 假資料，之後由後端接手（店家資料、評論整理、旅遊資訊、AI 生成路線）

export type Category = 'food' | 'culture' | 'nature' | 'shopping'

export interface Stop {
  id: string
  order: number
  name: string
  category: Category
  lat: number
  lng: number
  desc: string
  stayMin: number
  rating: number
  reviewCount: number
  tags: string[]
  aiSummary: string[]
  legToNext?: string
}

export interface FeedItem {
  id: string
  title: string
  summary: string
  source: string
  time: string
}

// 金城鎮（後浦）周邊，示意座標
export const islandRoute: Stop[] = [
  {
    id: 's1',
    order: 1,
    name: '依山村驛民宿',
    category: 'culture',
    lat: 24.4281,
    lng: 118.3168,
    desc: '報到領好禮，行程起點',
    stayMin: 30,
    rating: 4.7,
    reviewCount: 86,
    tags: ['行程起點'],
    aiSummary: [
      '老屋改建，閩式氛圍安靜舒服',
      '主人親切，會幫忙規劃周邊路線',
      '停車空間較小，建議步行進出',
    ],
    legToNext: '步行 8 分鐘到下一站',
  },
  {
    id: 's2',
    order: 2,
    name: '總兵宴餐廳',
    category: 'food',
    lat: 24.4326,
    lng: 118.3201,
    desc: '在地料理，午餐首選',
    stayMin: 60,
    rating: 4.6,
    reviewCount: 128,
    tags: ['優惠 9 折', '南管表演'],
    aiSummary: [
      '招牌海鮮評價高，份量足',
      '古厝用餐環境有特色，適合拍照',
      '週末人多，建議先訂位',
    ],
    legToNext: '開車 6 分鐘到下一站',
  },
  {
    id: 's3',
    order: 3,
    name: '後浦商圈',
    category: 'shopping',
    lat: 24.4349,
    lng: 118.3176,
    desc: '逛街購物，掃碼領券',
    stayMin: 90,
    rating: 4.5,
    reviewCount: 210,
    tags: ['掃碼領券'],
    aiSummary: [
      '老街小吃與伴手禮多，適合慢逛',
      '傍晚氣氛好，多家店有掃碼折扣',
      '部分店家公休日不同，出發前先查',
    ],
  },
]

// 地圖上額外的可探索點（非本次路線）
export const extraPois: Stop[] = [
  {
    id: 'p1',
    order: 0,
    name: '莒光樓',
    category: 'culture',
    lat: 24.4166,
    lng: 118.3122,
    desc: '金門地標，登樓觀景',
    stayMin: 40,
    rating: 4.6,
    reviewCount: 340,
    tags: ['夜間點燈'],
    aiSummary: ['經典地標，登樓可俯瞰金城', '傍晚與夜間點燈值得一看'],
  },
  {
    id: 'p2',
    order: 0,
    name: '金城老街早餐',
    category: 'food',
    lat: 24.4338,
    lng: 118.3159,
    desc: '在地人的早餐口袋名單',
    stayMin: 30,
    rating: 4.8,
    reviewCount: 95,
    tags: ['買二送一'],
    aiSummary: ['廣東粥與油條是招牌', '開店早，賣完為止'],
  },
]

export const feed: FeedItem[] = [
  {
    id: 'f1',
    title: '迎城隍遶境 這週登場',
    summary: '金門年度盛事迎城隍本週在後浦一帶展開，遶境隊伍會行經多條老街，建議先避開交通管制路段。',
    source: '金門縣觀光處',
    time: '2 天前',
  },
  {
    id: 'f2',
    title: '後浦老街 隱藏版早餐',
    summary: '後浦周邊五家排隊早餐，廣東粥、蛋餅與燒餅油條各有支持者，多數清晨就開賣。',
    source: '在地生活誌',
    time: '5 天前',
  },
  {
    id: 'f3',
    title: '金門必買 伴手禮精選',
    summary: '高粱酒、貢糖、麵線、牛肉乾與一條根，是旅客最常回購的名單，多家老店可宅配到台灣本島。',
    source: '金門日報',
    time: '1 週前',
  },
]

export const categoryLabel: Record<Category, string> = {
  food: '美食',
  culture: '文化',
  nature: '自然',
  shopping: '購物',
}
