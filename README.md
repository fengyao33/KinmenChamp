# 島轉 KinmenChamp

金門一日遊規劃工具 — 旅客端前端（MVP）。

免登入進站後，旅客可選「島轉推薦」（在地團隊預排路線）或「AI 客製」（回答問卷 → AI 生成路線），
在鎖定金門的地圖上邊逛邊看店家、優惠、Gemini 評論總結與在地即時動態。

## 技術棧

- Vite + React 19 + TypeScript
- Tailwind CSS v4
- React Router
- Leaflet / react-leaflet（OpenStreetMap 圖磚）

## 開發

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 型別檢查 + 打包
```

## 頁面流程

| 路由 | 畫面 | 說明 |
| :--- | :--- | :--- |
| `/` | 進站頁 | 主視覺 + 免登入 CTA |
| `/choose` | 遊程選擇頁 | 島轉推薦 / AI 客製 二選一 |
| `/form` | AI 表單頁 | 天數・同行者・體驗偏好・自由文字 |
| `/loading` | 等待頁 | 分步進度，完成後自動進地圖 |
| `/map?type=island\|ai` | 地圖頁 | 三欄：行程時間軸 / OSM 地圖 / 在地動態牆 |

## 目錄

- `src/pages/` — 五個頁面
- `src/components/` — 共用元件（Header）
- `src/data/mock.ts` — 假資料（站點、POI、動態牆），之後由後端取代

## 待接（後端 / 資料層）

- Google Place：店家 + 座標
- lobster.io 評論 → Gemini 整理
- jina 旅遊資訊 → Gemini 整理（動態牆）
- Gemini：AI 客製路線生成
- 管理後台（店家匯入、優惠活動、遊程編排、表單設計器）— 尚未開發
