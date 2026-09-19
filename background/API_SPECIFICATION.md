# 島轉 KinmenChamp API 規格手冊 (API Specification)

- **版本**：v1.0.0
- **基礎路徑**：`/api/v1`
- **資料交換格式**：JSON (`Content-Type: application/json; charset=utf-8`)
- **座標系統**：WGS-84 (`lat`: 緯度, `lng`: 經度)，預設鎖定金門區域（經度約 118.2 ~ 118.5，緯度約 24.3 ~ 24.6）。

---

## 標準回應格式 (Standard Envelope)

所有 API 統一回傳以下格式：

```json
{
  "code": 200,
  "success": true,
  "message": "OK",
  "data": { ... },
  "timestamp": "2026-09-18T04:42:00Z"
}
```

錯誤時回應：
```json
{
  "code": 400,
  "success": false,
  "error": "INVALID_PARAMS",
  "message": "請求參數格式錯誤，請檢查輸入內容",
  "details": [ ... ],
  "timestamp": "2026-09-18T04:42:00Z"
}
```

---

## 模組一：路線規劃模組 (Routes Module)

### 1. 取得「島轉推薦」官方精選路線
* **端點**：`GET /routes/recommended`
* **說明**：取得在地團隊預先實地踩點編排的精選遊程路線（免登入直接讀取）。對應前端點擊「看推薦路線」進入 `/map?type=island`。
* **請求標頭**：無需驗證
* **查詢參數 (Query Parameters)**：
  | 參數名 | 型別 | 必填 | 預設值 | 說明 |
  | :--- | :--- | :---: | :---: | :--- |
  | `theme` | `string` | 否 | `classic` | 推薦主題代碼（如 `classic`: 經典一日遊、`culture`: 閩南古厝風情、`food`: 戰地美食巡禮） |

* **成功回應範例 (200 OK)**：
```json
{
  "code": 200,
  "success": true,
  "data": {
    "id": "island-classic-01",
    "name": "島轉在地精選・經典後浦慢遊",
    "type": "island",
    "description": "在地團隊實地編排的精選路線，涵蓋美食、文化與老街景點，適合第一次造訪金門的旅人。",
    "totalStops": 3,
    "totalHours": 3.0,
    "totalDistanceKm": 2.6,
    "recommendedStartTime": "09:30",
    "overviewTip": "全程約 2.6 公里，建議上午出發，體驗晨間老街氛圍與午後微風。",
    "polyline": [
      [24.4281, 118.3168],
      [24.4326, 118.3201],
      [24.4349, 118.3176]
    ],
    "stops": [
      {
        "id": "s1",
        "order": 1,
        "name": "依山村驛民宿",
        "category": "culture",
        "lat": 24.4281,
        "lng": 118.3168,
        "desc": "報到領好禮，行程起點",
        "stayMin": 30,
        "rating": 4.7,
        "reviewCount": 86,
        "tags": ["行程起點"],
        "aiSummary": [
          "老屋改建，閩式氛圍安靜舒服",
          "主人親切，會幫忙規劃周邊路線",
          "停車空間較小，建議步行進出"
        ],
        "legToNext": "步行 8 分鐘到下一站"
      },
      {
        "id": "s2",
        "order": 2,
        "name": "總兵宴餐廳",
        "category": "food",
        "lat": 24.4326,
        "lng": 118.3201,
        "desc": "在地料理，午餐首選",
        "stayMin": 60,
        "rating": 4.6,
        "reviewCount": 128,
        "tags": ["優惠 9 折", "南管表演"],
        "aiSummary": [
          "招牌海鮮評價高，份量足",
          "古厝用餐環境有特色，適合拍照",
          "週末人多，建議先訂位"
        ],
        "legToNext": "開車 6 分鐘到下一站"
      },
      {
        "id": "s3",
        "order": 3,
        "name": "後浦商圈",
        "category": "shopping",
        "lat": 24.4349,
        "lng": 118.3176,
        "desc": "逛街購物，掃碼領券",
        "stayMin": 90,
        "rating": 4.5,
        "reviewCount": 210,
        "tags": ["掃碼領券"],
        "aiSummary": [
          "老街小吃與伴手禮多，適合慢逛",
          "傍晚氣氛好，多家店有掃碼折扣",
          "部分店家公休日不同，出發前先查"
        ],
        "legToNext": null
      }
    ]
  }
}
```

---

### 2. 提交旅客問卷，啟動 AI 客製路線生成
* **端點**：`POST /routes/generate`
* **說明**：旅客在 `/form` 提交偏好後觸發，建立後端非同步生成任務（排隊呼叫 Gemini 進行語意分析、店家推薦與路網時間計算），回傳任務 ID `taskId` 以利前端輪詢進度。
* **請求主體 (Request Body)**：
```json
{
  "duration": "一天",
  "companion": "情侶",
  "experiences": ["美食", "文化古蹟"],
  "note": "想吃海鮮、不想走太多路、想看古厝聚落"
}
```
* **欄位規格**：
  | 欄位 | 型別 | 必填 | 說明與合法值 |
  | :--- | :--- | :---: | :--- |
  | `duration` | `string` | 是 | 旅行時間：`"半天"` \| `"一天"` \| `"兩天以上"` |
  | `companion` | `string` | 是 | 同行旅伴：`"一個人"` \| `"情侶"` \| `"家庭"` \| `"朋友"` |
  | `experiences`| `string[]`| 是 | 體驗標籤陣列：`"美食"`、`"文化古蹟"`、`"自然風光"`、`"拍照打卡"`、`"購物"`、`"深度慢遊"` |
  | `note` | `string` | 否 | 自由備註文字（最長 500 字，如特定想去或避開地點） |

* **成功回應範例 (202 Accepted)**：
```json
{
  "code": 202,
  "success": true,
  "message": "AI 客製路線任務建立成功",
  "data": {
    "taskId": "task-kinmen-ai-8823194a",
    "status": "PROCESSING",
    "estimatedSeconds": 12,
    "createdAt": "2026-09-18T04:42:15Z"
  }
}
```

---

### 3. 查詢 AI 客製路線生成進度 (輪詢 / SSE)
* **端點**：`GET /routes/tasks/:taskId`
* **說明**：對應 `/loading` 頁面分步進度狀態。後端狀態機分為 4 階段：
  1. `STEP_1_PREFERENCES`（讀取你的旅遊偏好，進度 25%）
  2. `STEP_2_MATCHING`（比對在地店家與優惠，進度 50%）
  3. `STEP_3_REVIEWS`（整理最新評論與旅遊資訊，進度 75%）
  4. `STEP_4_COMPLETED`（生成最佳路線，進度 100%）
* **路徑參數**：`taskId` (字串，任務唯一識別碼)

* **進行中回應 (200 OK)**：
```json
{
  "code": 200,
  "success": true,
  "data": {
    "taskId": "task-kinmen-ai-8823194a",
    "status": "PROCESSING",
    "currentStepIndex": 2,
    "currentStepText": "比對在地店家與優惠",
    "progressPercent": 50,
    "routeId": null
  }
}
```

* **已完成回應 (200 OK)**：
```json
{
  "code": 200,
  "success": true,
  "data": {
    "taskId": "task-kinmen-ai-8823194a",
    "status": "SUCCESS",
    "currentStepIndex": 4,
    "currentStepText": "生成最佳路線",
    "progressPercent": 100,
    "routeId": "route-ai-c8914b"
  }
}
```
*備註：亦支援 SSE 協定端點 `GET /routes/tasks/:taskId/stream`，透過 Server-Sent Events 持續推播 step 變更，前端無需定時輪詢。*

---

### 4. 取得指定路線完整內容
* **端點**：`GET /routes/:id`
* **說明**：根據 `routeId` 取得路線資訊（包含 AI 客製路線或歷史分享路線）。供 `/map?type=ai&routeId=...` 載入顯示。
* **成功回應範例 (200 OK)**：
```json
{
  "code": 200,
  "success": true,
  "data": {
    "id": "route-ai-c8914b",
    "name": "專屬金門一日慢遊：海鮮美食與古蹟尋幽",
    "type": "ai",
    "userQuery": {
      "duration": "一天",
      "companion": "情侶",
      "experiences": ["美食", "文化古蹟"],
      "note": "想吃海鮮、不想走太多路"
    },
    "totalStops": 4,
    "totalHours": 4.5,
    "totalDistanceKm": 3.8,
    "recommendedStartTime": "10:00",
    "overviewTip": "依據情侶慢遊步調設計，結合閩式古厝與鮮美海味，步行距離短且停留充裕。",
    "polyline": [
      [24.4326, 118.3201],
      [24.4349, 118.3176],
      [24.4166, 118.3122]
    ],
    "stops": [
      {
        "id": "stop-ai-1",
        "order": 1,
        "name": "總兵宴餐廳",
        "category": "food",
        "lat": 24.4326,
        "lng": 118.3201,
        "desc": "預約制海鮮古早味午餐",
        "stayMin": 75,
        "rating": 4.6,
        "reviewCount": 128,
        "tags": ["優惠 9 折", "在地海鮮"],
        "aiSummary": [
          "嚴選金門野生黃魚與蚵仔麵線，鮮甜不腥",
          "老屋庭院座位清幽，適合情侶慢食合照"
        ],
        "legToNext": "步行 6 分鐘到下一站"
      }
    ]
  }
}
```

---

## 模組二：景點與店家探索模組 (Places & POIs Module)

### 5. 取得地圖景點/店家列表 (含分類篩選與地圖探索點)
* **端點**：`GET /places`
* **說明**：提供 `/map` 頁面顯示的地圖點位（包含分類篩選按鈕、關鍵字搜尋，以及周邊可探索點 `extraPois`）。
* **查詢參數 (Query Parameters)**：
  | 參數名 | 型別 | 必填 | 說明 |
  | :--- | :--- | :---: | :--- |
  | `category` | `string` | 否 | 分類過濾：`all` (預設)、`food`、`culture`、`nature`、`shopping` |
  | `keyword` | `string` | 否 | 關鍵字搜尋（店名、標籤、地址關鍵字） |
  | `bounds` | `string` | 否 | 當前地圖可視範圍經緯度，格式：`minLat,minLng,maxLat,maxLng` |
  | `limit` | `number` | 否 | 筆數限制（預設 50，最大 100） |

* **成功回應範例 (200 OK)**：
```json
{
  "code": 200,
  "success": true,
  "data": {
    "total": 2,
    "places": [
      {
        "id": "p1",
        "order": 0,
        "name": "莒光樓",
        "category": "culture",
        "lat": 24.4166,
        "lng": 118.3122,
        "desc": "金門地標，登樓觀景",
        "stayMin": 40,
        "rating": 4.6,
        "reviewCount": 340,
        "tags": ["夜間點燈"],
        "aiSummary": [
          "經典地標，登樓可俯瞰金城",
          "傍晚與夜間點燈值得一看"
        ]
      },
      {
        "id": "p2",
        "order": 0,
        "name": "金城老街早餐",
        "category": "food",
        "lat": 24.4338,
        "lng": 118.3159,
        "desc": "在地人的早餐口袋名單",
        "stayMin": 30,
        "rating": 4.8,
        "reviewCount": 95,
        "tags": ["買二送一"],
        "aiSummary": [
          "廣東粥與油條是招牌",
          "開店早，賣完為止"
        ]
      }
    ]
  }
}
```

---

### 6. 取得單一景點/店家詳細資訊
* **端點**：`GET /places/:id`
* **說明**：點擊地圖圖釘或站點時，取得 DetailCard 完整卡片資訊（包含照片 URL、營業時間、導航座標）。
* **路徑參數**：`id` (字串，景點/店家 ID)
* **成功回應範例 (200 OK)**：
```json
{
  "code": 200,
  "success": true,
  "data": {
    "id": "s2",
    "name": "總兵宴餐廳",
    "category": "food",
    "lat": 24.4326,
    "lng": 118.3201,
    "address": "金門縣金城鎮莒光路一段 100 號",
    "phone": "+886-82-321456",
    "openingHours": "11:00 - 14:00, 17:00 - 20:30 (每週二公休)",
    "photos": [
      "https://images.unsplash.com/photo-example-kinmen-food.jpg"
    ],
    "rating": 4.6,
    "reviewCount": 128,
    "tags": ["優惠 9 折", "南管表演", "古厝聚落"],
    "aiSummary": [
      "招牌海鮮評價高，份量足",
      "古厝用餐環境有特色，適合拍照",
      "週末人多，建議先訂位"
    ],
    "navigationUrl": "https://www.google.com/maps/dir/?api=1&destination=24.4326,118.3201"
  }
}
```

---

### 7. 取得單一店家完整評論清單 (看完整評論)
* **端點**：`GET /places/:id/reviews`
* **說明**：DetailCard 點擊「看完整評論」時呼叫，取得 lobster.io 抓取之真實旅客評論與評分。
* **查詢參數**：
  | 參數名 | 型別 | 必填 | 說明 |
  | :--- | :--- | :---: | :--- |
  | `page` | `number` | 否 | 頁碼（預設 1） |
  | `pageSize` | `number` | 否 | 每頁筆數（預設 10，最大 30） |
* **成功回應範例 (200 OK)**：
```json
{
  "code": 200,
  "success": true,
  "data": {
    "total": 128,
    "page": 1,
    "pageSize": 10,
    "reviews": [
      {
        "id": "rev-01",
        "authorName": "林小宇",
        "authorAvatar": "https://example.com/avatar1.jpg",
        "rating": 5,
        "publishTime": "2 週前",
        "text": "炸蚵仔酥超級香，而且給得很大方！在紅磚四合院裡面吃飯很有氣氛，強烈建議提早電話訂位。"
      },
      {
        "id": "rev-02",
        "authorName": "Sarah Chen",
        "authorAvatar": "https://example.com/avatar2.jpg",
        "rating": 4,
        "publishTime": "1 個月前",
        "text": "服務親切，金門海鮮麵線很道地。唯一缺點是巷弄較小，車子要停在總兵署旁邊的停車場再走過來。"
      }
    ]
  }
}
```

---

## 模組三：在地動態情報模組 (Feed / Dynamic Wall Module)

### 8. 取得在地即時動態牆情報
* **端點**：`GET /feeds`
* **說明**：地圖主頁面右欄「在地動態牆」列表，並支援下方「查看更多」加載分頁。
* **查詢參數**：
  | 參數名 | 型別 | 必填 | 說明 |
  | :--- | :--- | :---: | :--- |
  | `page` | `number` | 否 | 頁碼（預設 1） |
  | `pageSize` | `number` | 否 | 每頁筆數（預設 5） |
  | `type` | `string` | 否 | 情報類型（`all`, `event`: 祭典活動, `food`: 美食情報, `news`: 交通生活） |

* **成功回應範例 (200 OK)**：
```json
{
  "code": 200,
  "success": true,
  "data": {
    "total": 12,
    "page": 1,
    "hasMore": true,
    "items": [
      {
        "id": "f1",
        "title": "迎城隍遶境 這週登場",
        "summary": "金門年度盛事迎城隍本週在後浦一帶展開，遶境隊伍會行經多條老街，建議先避開交通管制路段。",
        "source": "金門縣觀光處",
        "time": "2 天前",
        "imageUrl": "https://example.com/event-chenghuang.jpg",
        "externalUrl": "https://kinmen.travel/news/123"
      },
      {
        "id": "f2",
        "title": "後浦老街 隱藏版早餐",
        "summary": "後浦周邊五家排隊早餐，廣東粥、蛋餅與燒餅油條各有支持者，多數清晨就開賣。",
        "source": "在地生活誌",
        "time": "5 天前",
        "imageUrl": null,
        "externalUrl": null
      },
      {
        "id": "f3",
        "title": "金門必買 伴手禮精選",
        "summary": "高粱酒、貢糖、麵線、牛肉乾與一條根，是旅客最常回購的名單，多家老店可宅配到台灣本島。",
        "source": "金門日報",
        "time": "1 週前",
        "imageUrl": null,
        "externalUrl": null
      }
    ]
  }
}
```

---

### 9. 取得單則在地情報詳細內容
* **端點**：`GET /feeds/:id`
* **說明**：提供點擊動態卡片查看完整圖文或新聞內文。
* **成功回應範例 (200 OK)**：
```json
{
  "code": 200,
  "success": true,
  "data": {
    "id": "f1",
    "title": "迎城隍遶境 這週登場",
    "fullContent": "一年一度的金門迎城隍即將盛大舉行！活動涵蓋陣頭表演、神明出巡與在地市集...",
    "source": "金門縣觀光處",
    "publishedAt": "2026-09-16T08:00:00Z",
    "tags": ["年度盛事", "後浦老街", "交通管制"],
    "relatedPlaceIds": ["s3", "p1"]
  }
}
```

---

## 模組四：系統與問卷配置 (System & Configuration)

### 10. 取得 AI 問卷動態標籤與設定選項
* **端點**：`GET /config/form-options`
* **說明**：動態下發問卷題目與標籤選項，避免硬編碼（Hardcoded）在前端程式碼中。
* **成功回應範例 (200 OK)**：
```json
{
  "code": 200,
  "success": true,
  "data": {
    "durations": [
      { "label": "半天", "icon": "Clock" },
      { "label": "一天", "icon": "Clock" },
      { "label": "兩天以上", "icon": "Clock" }
    ],
    "companions": [
      { "label": "一個人", "icon": "User" },
      { "label": "情侶", "icon": "Heart" },
      { "label": "家庭", "icon": "Users" },
      { "label": "朋友", "icon": "Users" }
    ],
    "experiences": [
      { "label": "美食", "icon": "UtensilsCrossed" },
      { "label": "文化古蹟", "icon": "Landmark" },
      { "label": "自然風光", "icon": "Trees" },
      { "label": "拍照打卡", "icon": "Camera" },
      { "label": "購物", "icon": "ShoppingBag" },
      { "label": "深度慢遊", "icon": "Coffee" }
    ],
    "defaultSelections": {
      "duration": "一天",
      "companion": "情侶",
      "experiences": ["美食", "文化古蹟"]
    }
  }
}
```

---

## 模組五：營運管理與資料同步 (Admin & Data Pipelines)

本模組對應 README 所提之「待接：管理後台（店家匯入、優惠活動、遊程編排、表單設計器）」：

### 11. 匯入 Google Place 店家資料
* **端點**：`POST /admin/places/import`
* **說明**：依據 Google Place ID 抓取最新店家名稱、經緯度、電話、地址並寫入資料庫。
* **請求主體**：
```json
{
  "googlePlaceId": "ChIJxxxxxxxxxxxxxxxxxxx",
  "category": "food",
  "defaultTags": ["在地老店", "優惠 9 折"]
}
```

### 12. 編輯景點店家與優惠促銷標籤
* **端點**：`PUT /admin/places/:id`
* **說明**：管理員設定店家停留時間建議、新增或停用行銷標籤（如「滿百送小菜」、「掃碼領券」）。
* **請求主體**：
```json
{
  "desc": "在地料理，午餐首選",
  "stayMin": 60,
  "tags": ["優惠 9 折", "南管表演"],
  "isActive": true
}
```

### 13. 手動觸發 Lobster 評論抓取與 Gemini 摘要產出
* **端點**：`POST /admin/places/:id/ai-summarize`
* **說明**：呼叫 lobster.io 抓取該店家最新 50 筆 Google 評論，並由 Gemini 生成 3 句條列式精簡總結（`aiSummary`）。

### 14. 編排官方「島轉推薦」路線
* **端點**：`POST /admin/routes` 與 `PUT /admin/routes/:id`
* **說明**：在後台新增或調整「島轉推薦」站點次序、停靠順序（`order`）、轉場路徑提示（`legToNext`）與總預估時長。

### 15. 觸發 Jina Reader 爬取金門在地旅遊資訊
* **端點**：`POST /admin/feeds/sync`
* **說明**：啟動爬蟲任務，經由 Jina 擷取金門日報或觀光處新聞，交由 Gemini 產出簡短摘要後寫入動態牆待審核列表。

### 16. 審核與上下架動態情報
* **端點**：`PUT /admin/feeds/:id`
* **說明**：更新動態牆內容、替換縮圖、調整發布狀態。

### 17. 動態調整 AI 表單問卷選項
* **端點**：`PUT /admin/config/form-options`
* **說明**：更新 `/form` 頁面顯示的體驗標籤與選項。
