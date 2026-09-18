# 八路列傳畫面過令（蓋掉 MASTER 的 Inter／綠金儀表板）

查表給的是企業後台風。本專案是歧路旅人式 HD-2D 列傳，以下規則優先於 `MASTER.md`。

## 風格

- 電影向暗底、金線框、書法標題。
- 字體：**Noto Serif TC** 標題、**Noto Sans TC** 內文（weiyo-product-starter 溫潤東方風）。不准用 Inter。
- 主色用金 `#e4c56a`，不是查表的綠 `#15803D`。
- 圖示用 SVG，不用 emoji。

## 斷點與觸控

- 手機版從 320px 寫起；必驗 375／390／412／768。
- 按鈕 ≥ 44×44；全頁不准橫向捲動。
- `min-height: 100dvh`；底部 `env(safe-area-inset-*)`。
- `prefers-reduced-motion: reduce` 時 GSAP duration 為 0、CSS 動畫關閉。

## 動效

- 標題／選角進場、戰鬥指令板進場用 GSAP（`gsap-core` + `gsap-react`）。
- 只動 transform／autoAlpha；戰鬥打擊維持短促。
