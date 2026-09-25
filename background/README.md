# 島轉 KinmenChamp 後端架構與 API 規劃指南

本資料夾（`background/`）為「島轉 KinmenChamp」金門一日遊規劃工具之後端設計與 API 規格中心。本專案前端目前為 React 19 + TypeScript + Vite + Leaflet 靜態架構，資料使用 `src/data/mock.ts`。

本文檔全面分析現有前端頁面交互、資料型別與未來拓展需求，將整體後端劃分為 **旅客端核心 API（10 隻）** 與 **管理/資料管道 API（7 隻）**，共計 **17 隻 API**。

---

## 快速導覽

| 文件 | 說明 |
| :--- | :--- |
| [API 規格詳細說明 (API_SPECIFICATION.md)](./API_SPECIFICATION.md) | 包含所有 API 端點、請求參數、回傳 JSON Schema、錯誤代碼與 TypeScript 介面對照。 |
| [資料庫模型設計 (DATABASE_SCHEMA.md)](./DATABASE_SCHEMA.md) | PostgreSQL + PostGIS 資料表結構設計（ER 圖、索引規劃、外鍵關聯）。 |
| [AI 與外部服務串接管線 (AI_INTEGRATION.md)](./AI_INTEGRATION.md) | Google Place、lobster.io、Jina Reader、Gemini 路線生成與評論總結之具體 Prompt 與流程。 |

---

## API 總覽與數量統計

系統規劃分為兩大階段：
- **階段一 (MVP 旅客端必備)**：10 隻 API，直接替換前端 `mock.ts` 與假進度條，讓旅客完整體驗「島轉推薦」與「AI 客製路線」。
- **階段二 (營運後台與自動化管線)**：7 隻 API，提供在地店家匯入、優惠發行、路線編排、新聞爬蟲同步與問卷題目設定。

### 1. 旅客端 API 清單（10 隻）

| # | 方法 | 端點路徑 | 名稱與功能說明 | 對應前端頁面 | 優先級 |
| :-: | :---: | :--- | :--- | :--- | :-: |
| 1 | `GET` | `/api/v1/routes/recommended` | 取得官方「島轉推薦」一日遊路線資料 | `/choose`, `/map?type=island` | **P0 (必備)** |
| 2 | `POST` | `/api/v1/routes/generate` | 提交旅客旅遊問卷，啟動 AI 客製路線生成 | `/form`, `/loading` | **P0 (必備)** |
| 3 | `GET` | `/api/v1/routes/tasks/:taskId` | 查詢 AI 生成進度與當前階段狀態（支援輪詢或 SSE） | `/loading` | **P0 (必備)** |
| 4 | `GET` | `/api/v1/routes/:id` | 取得指定行程路線完整資訊（含站點、折線座標與時程） | `/map?type=ai&routeId=...` | **P0 (必備)** |
| 5 | `GET` | `/api/v1/places` | 取得地圖景點/店家列表（支援分類篩選、視圖範圍、搜尋關鍵字） | `/map` (地圖探索點、搜尋框) | **P0 (必備)** |
| 6 | `GET` | `/api/v1/places/:id` | 取得單一景點/店家詳細資訊（含評分、標籤、AI 總結） | `/map` (DetailCard 側邊卡片) | **P0 (必備)** |
| 7 | `GET` | `/api/v1/places/:id/reviews` | 取得單一店家之真實旅客評論清單 | `/map` (「看完整評論」按鈕) | **P1 (強烈建議)** |
| 8 | `GET` | `/api/v1/feeds` | 取得在地即時動態/活動情報清單（支援分頁載入） | `/map` (右側動態牆、查看更多) | **P0 (必備)** |
| 9 | `GET` | `/api/v1/feeds/:id` | 取得單則在地情報詳細內容 | `/map` (動態牆卡片點擊詳情) | **P1 (建議)** |
| 10 | `GET` | `/api/v1/config/form-options` | 取得 AI 路線問卷選項設定（天數、同行者、體驗標籤） | `/form` (問卷選項動態化) | **P1 (建議)** |

---

### 2. 營運後台與資料管道 API 清單（7 隻）

| # | 方法 | 端點路徑 | 名稱與功能說明 | 業務場景 | 優先級 |
| :-: | :---: | :--- | :--- | :--- | :-: |
| 11 | `POST` | `/api/v1/admin/places/import` | 批次匯入 Google Place 店家與座標資料 | 建立金門景點店家資料庫 | **P1** |
| 12 | `GET` / `PUT` | `/api/v1/admin/places/:id` | 查詢/編輯店家資訊、營業時間、優惠促銷標籤 | 店家與優惠維護 | **P1** |
| 13 | `POST` | `/api/v1/admin/places/:id/ai-summarize` | 觸發指定店家之 Lobster 評論抓取與 Gemini 摘要更新 | 評論總結更新管線 | **P2** |
| 14 | `POST` / `PUT` | `/api/v1/admin/routes` | 建立或更新官方推薦路線（設定站點順序、停留時間與介紹） | 在地團隊預排路線後台 | **P1** |
| 15 | `POST` | `/api/v1/admin/feeds/sync` | 觸發 Jina 抓取金門觀光處/金門日報並由 Gemini 總結產出情報 | 在地動態牆自動採集 | **P1** |
| 16 | `GET` / `PUT` | `/api/v1/admin/feeds/:id` | 審核、編輯或上下架在地動態情報 | 內容品質把關 | **P2** |
| 17 | `PUT` | `/api/v1/admin/config/form-options` | 編輯問卷標籤與天數選項 | 表單動態設計器 | **P2** |

---

## 系統架構建議

```mermaid
flowchart TD
    subgraph Client["前端客戶端 (React 19 + Leaflet)"]
        UI_Landing["進站首頁 (/)"]
        UI_Choose["遊程選擇 (/choose)"]
        UI_Form["問卷填寫 (/form)"]
        UI_Loading["生成等待 (/loading)"]
        UI_Map["地圖主頁面 (/map)"]
    end

    subgraph API_Gateway["後端服務 (Node.js/Fastify 或 Python/FastAPI)"]
        Route_Service["路線模組 (Route Engine)"]
        Place_Service["景點/店家模組 (POI Service)"]
        Feed_Service["在地動態模組 (Feed Service)"]
        AI_Worker["AI 生成工作佇列 (Celery / BullMQ)"]
    end

    subgraph External["外部服務 / 3rd-Party APIs"]
        Google_Places["Google Place API"]
        Lobster["lobster.io (評價抓取)"]
        Jina["Jina Reader (旅遊新聞爬取)"]
        Gemini["Google Gemini 1.5 / 2.0 (LLM)"]
        OSRM["OSRM / Google Directions (路徑計算)"]
    end

    subgraph Database["資料庫與快取"]
        PG[(PostgreSQL + PostGIS)]
        Redis[(Redis 快取與任務狀態)]
    end

    UI_Choose -->|GET /routes/recommended| Route_Service
    UI_Form -->|POST /routes/generate| AI_Worker
    UI_Loading -->|GET /tasks/:id (輪詢/SSE)| AI_Worker
    UI_Map -->|GET /places| Place_Service
    UI_Map -->|GET /feeds| Feed_Service

    AI_Worker -->|讀取偏好與候選店家| PG
    AI_Worker -->|呼叫生成結構化路線| Gemini
    AI_Worker -->|計算站點交通時間距離| OSRM
    AI_Worker -->|更新進度至 100%| Redis

    Place_Service -->|空間地理查詢 ST_DWithin| PG
    Feed_Service -->|快取查詢| Redis
    Feed_Service -->|資料查詢| PG

    AI_Worker -.->|定時同步店家| Google_Places
    AI_Worker -.->|定時抓取評論總結| Lobster
    AI_Worker -.->|定時爬取旅遊快報| Jina
```

---

## 推薦技術選型

1. **後端語言/框架**：
   - **方案 A (推薦 TypeScript 統一全端)**：`Node.js` + `Fastify` 或 `NestJS`，全端共用型別定義，效能高且生態成熟。
   - **方案 B (AI/資料處理導向)**：`Python` + `FastAPI`，方便串接 Gemini SDK、LangChain、Jina 爬蟲與資料清洗工具。
2. **資料庫 (Database)**：
   - `PostgreSQL 16` + `PostGIS`（強力支援金門經緯度距離計算、空間索引 `ST_Point`、`ST_DistanceSphere`）。
3. **快取與非同步任務 (Cache & Queue)**：
   - `Redis`（快取 AI 總結結果、地圖探索熱門點、儲存 AI 客製進度條 Task 狀態）。
4. **地圖路徑計算 (Routing Engine)**：
   - `OSRM (Open Source Routing Machine)` 或 `Google Routes API`，用於精準輸出 `legToNext`（「步行 8 分鐘到下一站」、「開車 6 分鐘到下一站」）。
