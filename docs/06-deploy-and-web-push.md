# Deploy + Push from Anywhere

公司、家裡、任何瀏覽器都能 push + auto-deploy 的設定。各只需一次性設定，之後綁
claude.ai / Netlify 帳號，**零 per-machine 安裝**。

---

## A. Push from Claude Code on the web

Web session 能否 `git push` 取決於 **GitHub 授權**（不是機器、不是 network policy）。
授權綁 claude.ai 帳號 → 設一次，所有裝置通用。

### 開通（瀏覽器，約 2 分鐘）

1. 開 <https://github.com/apps/claude> → **Configure** → 選你的帳號
2. **Repository access** 擇一：
   - **All repositories**（最省事，涵蓋本 repo），或
   - **Only select repositories** → 勾本 repo
3. 確認 **Permissions** 含 `Contents: Read and write`（push 必需）→ **Save**
4. 回 <https://claude.ai/code>，確認 GitHub 已連線、環境名稱有顯示
5. **開新 web session**（權限變更需新 session 才生效）

> 替代法（已用本機 gh CLI）：終端機 `gh auth login` → Claude CLI `/login` → `/web-setup`
> 把 gh token 同步到 claude 帳號。

### 限制與驗證

- Web proxy **只允許 push 到當前 working branch**（安全限制）— 對應「1 chat = 1 working branch」。
- GitHub 走獨立 proxy，與 network policy 無關（network access 設 None 也能 push）。
- 驗證：`git push origin <當前 branch>` → 成功即生效。

### 多地點

授權綁 claude.ai 帳號 → 公司 / 家裡 / 手機 App 登入同帳號皆有寫權限，無 per-machine 設定。

---

## B. Deploy via Netlify（雲端，連一次終身自動）

Netlify Git integration 在 Netlify 伺服器上 build，與你在哪台機器、沙箱網路無關。
**連一次 repo，之後任何地方 push 都自動 deploy。**

### 連 repo（瀏覽器，一次性）

1. <https://app.netlify.com> → **Add new site → Import an existing project**
2. **Deploy with GitHub** → 授權 → 選本 repo
3. Build 設定 Netlify 自動讀 `netlify.toml`，確認：
   - Build command：`npm run build-storybook`
   - Publish directory：`storybook-static`
   - NODE_VERSION 22（已在 `netlify.toml`）
4. **Deploy site** → 2–3 分鐘變綠勾

### 上密碼（免費 Basic Auth，30 秒）

1. Site configuration → **Environment variables** → Add a variable
2. Key = `STORYBOOK_BASIC_AUTH`，Value = `帳號:密碼`（多組空格分隔：`a:p1 b:p2`）
3. **Deploys → Trigger deploy** 讓 env var 生效
4. 開站台 URL → 跳瀏覽器原生帳密彈窗 ✅

> 原理：`netlify/edge-functions/basic-auth.ts` 在 edge 層讀 `Authorization` header 比對此
> env var，缺/錯回 401。Edge Functions 免費方案可用。
> **不要**用 Dashboard 的「Password protection」開關 — 那是 Pro $20/mo。密碼只存
> Netlify 後台，不進 repo。

### 自動化

- Push `main` → production 站台自動 rebuild
- Push 任意 branch → 自動 per-branch preview URL
- SEO：`netlify.toml` 已含 `X-Robots-Tag: noindex`

---

## C. 整體流程（設定完成後）

```
本機/web 改 code → push 當前 working branch → Netlify 自動 build + deploy preview
                                            → 確認 preview OK
                                            → 合 main → production 自動 deploy
```

DS 版本升級交給 Dependabot daily auto-PR（見 `04-ds-upgrade.md`）。

---

## 官方文件

- Claude Code on the web：<https://code.claude.com/docs/en/claude-code-on-the-web>
- Web quickstart（Connect GitHub）：<https://code.claude.com/docs/en/web-quickstart>
