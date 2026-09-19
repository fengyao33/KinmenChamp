// 島轉 MVP 假資料,之後由後端接手(店家資料、評論整理、旅遊資訊、AI 生成路線)

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

export type RouteTheme = 'brick' | 'ocean' | 'ochre'

export interface CuratedRoute {
  id: string
  title: string
  summary: string
  theme: RouteTheme
  stops: Stop[]
}

export interface FeedItem {
  id: string
  title: string
  summary: string
  source: string
  time: string
}

// 我們編排好的精選遊程(後台「島轉遊程編排」產出)
export const curatedRoutes: CuratedRoute[] = [
  {
    id: 'houpu',
    title: '後浦老城散步',
    summary: '走進金城後浦,老屋、在地味與商圈一次逛。',
    theme: 'brick',
    stops: [
      {
        id: 'houpu-1',
        order: 1,
        name: '依山村驛民宿',
        category: 'culture',
        lat: 24.4281,
        lng: 118.3168,
        desc: '報到領好禮,行程起點',
        stayMin: 30,
        rating: 4.7,
        reviewCount: 86,
        tags: ['行程起點'],
        aiSummary: ['老屋改建,閩式氛圍安靜舒服', '主人親切,會幫忙規劃周邊路線', '停車空間較小,建議步行進出'],
        legToNext: '步行 8 分鐘到下一站',
      },
      {
        id: 'houpu-2',
        order: 2,
        name: '總兵宴餐廳',
        category: 'food',
        lat: 24.4326,
        lng: 118.3201,
        desc: '在地料理,午餐首選',
        stayMin: 60,
        rating: 4.6,
        reviewCount: 128,
        tags: ['優惠 9 折', '南管表演'],
        aiSummary: ['招牌海鮮評價高,份量足', '古厝用餐環境有特色,適合拍照', '週末人多,建議先訂位'],
        legToNext: '開車 6 分鐘到下一站',
      },
      {
        id: 'houpu-3',
        order: 3,
        name: '後浦商圈',
        category: 'shopping',
        lat: 24.4349,
        lng: 118.3176,
        desc: '逛街購物,掃碼領券',
        stayMin: 90,
        rating: 4.5,
        reviewCount: 210,
        tags: ['掃碼領券'],
        aiSummary: ['老街小吃與伴手禮多,適合慢逛', '傍晚氣氛好,多家店有掃碼折扣', '部分店家公休日不同,出發前先查'],
      },
    ],
  },
  {
    id: 'food',
    title: '金門美食巡禮',
    summary: '從早餐吃到宵夜,一路都是在地人的口袋名單。',
    theme: 'ochre',
    stops: [
      {
        id: 'food-1',
        order: 1,
        name: '金城老街早餐',
        category: 'food',
        lat: 24.4338,
        lng: 118.3159,
        desc: '廣東粥配油條,金門式早晨',
        stayMin: 40,
        rating: 4.8,
        reviewCount: 95,
        tags: ['買二送一'],
        aiSummary: ['廣東粥綿密、油條酥脆', '開店早,賣完為止'],
        legToNext: '步行 5 分鐘到下一站',
      },
      {
        id: 'food-2',
        order: 2,
        name: '模範街蚵嗲',
        category: 'food',
        lat: 24.434,
        lng: 118.317,
        desc: '現炸蚵嗲,排隊小吃',
        stayMin: 30,
        rating: 4.6,
        reviewCount: 142,
        tags: ['現點現炸'],
        aiSummary: ['蚵仔飽滿、外皮酥香', '尖峰要排隊,建議避開中午'],
        legToNext: '開車 8 分鐘到下一站',
      },
      {
        id: 'food-3',
        order: 3,
        name: '沙美老街牛肉麵',
        category: 'food',
        lat: 24.4907,
        lng: 118.4102,
        desc: '金門牛肉麵,湯頭濃厚',
        stayMin: 60,
        rating: 4.5,
        reviewCount: 176,
        tags: ['在地推薦'],
        aiSummary: ['牛肉份量足、湯頭夠味', '老街周邊順路逛沙美聚落'],
      },
    ],
  },
  {
    id: 'battle',
    title: '戰地與海岸線',
    summary: '坑道、地標與潮間帶,看金門的另一面。',
    theme: 'ocean',
    stops: [
      {
        id: 'battle-1',
        order: 1,
        name: '莒光樓',
        category: 'culture',
        lat: 24.4166,
        lng: 118.3122,
        desc: '金門地標,登樓觀景',
        stayMin: 40,
        rating: 4.6,
        reviewCount: 340,
        tags: ['夜間點燈'],
        aiSummary: ['經典地標,登樓俯瞰金城', '傍晚與夜間點燈值得一看'],
        legToNext: '開車 10 分鐘到下一站',
      },
      {
        id: 'battle-2',
        order: 2,
        name: '翟山坑道',
        category: 'culture',
        lat: 24.4045,
        lng: 118.3061,
        desc: '花崗岩水道,戰地遺跡',
        stayMin: 60,
        rating: 4.7,
        reviewCount: 288,
        tags: ['戰地遺跡'],
        aiSummary: ['水道倒影震撼,拍照效果好', '洞內濕滑、氣溫低,注意腳步'],
        legToNext: '開車 12 分鐘到下一站',
      },
      {
        id: 'battle-3',
        order: 3,
        name: '建功嶼',
        category: 'nature',
        lat: 24.411,
        lng: 118.302,
        desc: '退潮才通,潮間帶步道',
        stayMin: 90,
        rating: 4.8,
        reviewCount: 205,
        tags: ['需看潮汐'],
        aiSummary: ['退潮才能走過去,務必先查潮汐表', '石蚵人裝置藝術是打卡點'],
      },
    ],
  },
]

// 預設路線(AI 生成時的示意來源、地圖預設)
export const islandRoute: Stop[] = curatedRoutes[0].stops

// 地圖上額外的可探索點(非本次路線)
export const extraPois: Stop[] = [
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
    aiSummary: ['廣東粥與油條是招牌', '開店早,賣完為止'],
  },
]

export const feed: FeedItem[] = [
  {
    id: 'f1',
    title: '迎城隍遶境 這週登場',
    summary: '金門年度盛事迎城隍本週在後浦一帶展開,遶境隊伍會行經多條老街,建議先避開交通管制路段。',
    source: '金門縣觀光處',
    time: '2 天前',
  },
  {
    id: 'f2',
    title: '後浦老街 隱藏版早餐',
    summary: '後浦周邊五家排隊早餐,廣東粥、蛋餅與燒餅油條各有支持者,多數清晨就開賣。',
    source: '在地生活誌',
    time: '5 天前',
  },
  {
    id: 'f3',
    title: '金門必買 伴手禮精選',
    summary: '高粱酒、貢糖、麵線、牛肉乾與一條根,是旅客最常回購的名單,多家老店可宅配到台灣本島。',
    source: '金門日報',
    time: '1 週前',
  },
  {
    id: 'f4',
    title: '翟山坑道 坑道音樂節售票',
    summary: '花崗岩坑道裡的音樂會今年再度登場,場地座位有限,建議先線上購票並提早入場。',
    source: '金門縣文化局',
    time: '1 週前',
  },
  {
    id: 'f5',
    title: '慈湖秋季賞鳥季開跑',
    summary: '入秋候鳥陸續抵達慈湖,清晨與傍晚是最佳觀察時段,園區備有解說服務。',
    source: '金門國家公園',
    time: '1 週前',
  },
  {
    id: 'f6',
    title: '沙美老街 新開文青咖啡',
    summary: '沙美老街新開幾家老屋改建咖啡館,適合逛完聚落坐下歇腳,部分店家假日限量供應甜點。',
    source: '在地生活誌',
    time: '2 週前',
  },
  {
    id: 'f7',
    title: '高粱文化節 週末開幕',
    summary: '結合品酒、市集與表演的高粱文化節本週末開幕,現場有限定款伴手禮與試飲活動。',
    source: '金門酒廠',
    time: '2 週前',
  },
  {
    id: 'f8',
    title: '建功嶼潮汐表 本週更新',
    summary: '前往建功嶼務必對照潮汐,本週退潮開放通行時段已更新,回程請預留時間避免漲潮受困。',
    source: '金門氣象站',
    time: '2 週前',
  },
  {
    id: 'f9',
    title: '珠山聚落 導覽開放預約',
    summary: '閩式聚落珠山推出定時導覽,帶你認識古厝格局與風獅爺故事,名額有限採預約制。',
    source: '金門國家公園',
    time: '3 週前',
  },
  {
    id: 'f10',
    title: '古厝民宿 秋季優惠開跑',
    summary: '多家古厝民宿推出平日連泊優惠,含在地早餐與單車租借,適合安排兩天以上的慢遊。',
    source: '民宿聯盟',
    time: '3 週前',
  },
  {
    id: 'f11',
    title: '小三通航班 加開班次',
    summary: '因應連假人潮,金門往返廈門的小三通航班加開班次,搭船旅客請提早查詢時刻與報到。',
    source: '金門航運',
    time: '3 週前',
  },
  {
    id: 'f12',
    title: '金門馬拉松 報名倒數',
    summary: '沿海岸與聚落的金門馬拉松開放報名中,名額將滿,完賽禮與補給站資訊已公布於官網。',
    source: '賽事官方',
    time: '1 個月前',
  },
]

export const categoryLabel: Record<Category, string> = {
  food: '美食',
  culture: '文化',
  nature: '自然',
  shopping: '購物',
}
