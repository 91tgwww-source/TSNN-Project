# Deploy on Cloudflare Pages（免費，推薦）

Storybook（靜態 `storybook-static`）部署到 Cloudflare Pages + 免費密碼保護。

**為什麼選 Cloudflare Pages 而非 Netlify**：Netlify 2025/9 起改 **credit 制**，免費每月
300 credits 用完即鎖站（production deploy 停用）。Cloudflare Pages 免費方案**非 credit 制**、
額度極寬鬆（靜態請求/頻寬基本無上限、build 500 次/月），低流量內部 Storybook 不會被鎖。

密碼保護本 repo 已內建 `functions/_middleware.ts`（HTTP Basic Auth，讀 `STORYBOOK_BASIC_AUTH`
env var），在預設 `*.pages.dev` 網址直接生效、無需自訂網域。

---

## Step 1 — 連 repo（瀏覽器，一次性）

1. <https://dash.cloudflare.com> → 左側 **Workers & Pages** → **Create** → **Pages**
   → **Connect to Git**
2. 授權 GitHub → 選 `91tgwww-source/TSNN-Project`
3. **Build settings**：
   | 欄位 | 值 |
   |---|---|
   | Framework preset | None |
   | Build command | `npm run build-storybook` |
   | Build output directory | `storybook-static` |
   | Root directory | `/`（預設） |
   - Node 版本由 repo 內 `.node-version`（= 22）自動帶入
4. **Save and Deploy** → 等 2–3 分鐘 → 拿到 **`https://<project>.pages.dev`**

> `functions/` 目錄 Cloudflare 會自動偵測並部署成 Pages Functions（含密碼 middleware），無需額外設定。

## Step 2 — 設密碼（免費，給測試人員）

1. 你的 Pages 專案 → **Settings → Environment variables** → **Add variable**
   （建議 Production 與 Preview 都加）
2. Variable name = `STORYBOOK_BASIC_AUTH`
3. Value = `帳號:密碼`
   - 多人不同帳密：空格分隔 `tester1:pw1 tester2:pw2 pm:pw3`
   - 全部共用一組：`team:secret123`
4. **Deployments → 最新一筆 → Retry deployment**（env var 改動要重新 deploy 才生效）

## Step 3 — 驗證 + 分享

1. 開 `https://<project>.pages.dev` → 應跳**瀏覽器原生帳密彈窗**
2. 輸入帳密 → 看到 Storybook = 成功
3. 把 **URL + 帳密** 私訊測試人員（Slack/DM，**勿寫進 repo**）

> 未設 `STORYBOOK_BASIC_AUTH` = 站台公開（任何人有 URL 就能看）。要擋陌生人務必設。

---

## 自動化（設定後）

- Push 任意 branch → Cloudflare 自動 build + 出 preview URL
- Push production branch（預設 `main`）→ production 站台自動 rebuild
- DS 版本升級交給 Dependabot（見 `04-ds-upgrade.md`）

## 進階密碼選項（非必須）

- **Cloudflare Access**（Zero Trust，免費 50 user）：dashboard 設 Access policy，做 email OTP / SSO
  登入，比 Basic Auth 體驗好、可細控誰能看。不需改 code（設好後可移除本 middleware 的密碼段）。
  路徑：Zero Trust → Access → Applications → Add application → Self-hosted → 指向 Pages 專案。

## 官方文件

- Pages + Git：<https://developers.cloudflare.com/pages/get-started/git-integration/>
- Pages Functions middleware：<https://developers.cloudflare.com/pages/functions/middleware/>
- Cloudflare Access：<https://developers.cloudflare.com/cloudflare-one/applications/configure-apps/self-hosted-public-app/>
