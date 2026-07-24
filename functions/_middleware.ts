// functions/_middleware.ts — Cloudflare Pages Function:免費 HTTP Basic Auth + anti-SEO headers
//
// 為什麼用這個:Cloudflare Pages 免費方案非 credit 制、額度極寬鬆(不像 Netlify 2025/9 起的
// credit 制會把免費額度用完就鎖站),且 Pages Functions 在預設 *.pages.dev 網址直接生效、無需
// 自訂網域。這支是 Netlify 版 netlify/edge-functions/basic-auth.ts 的 Cloudflare 移植。
//
// _middleware.ts 會攔截 Pages 專案的「每一個」request(含靜態資源),先過密碼再放行。
//
// 啟用(Cloudflare dashboard,30 秒,免費):
//   Workers & Pages → 你的 Pages 專案 → Settings → Environment variables → Add
//     Variable name: STORYBOOK_BASIC_AUTH
//     Value:         user:password          (多組帳密空格分隔:"alice:pw1 bob:pw2")
//   重新 deploy(Deployments → Retry/Redeploy)→ 站台跳瀏覽器原生帳密彈窗。
//   未設此 env var = 站台公開(pass-through)。密碼只存 Cloudflare env var,不進 public repo。
//
// 進階(非必須):Cloudflare Access(免費 50 user 真 SSO,dashboard 設 policy;可不寫 code)。

interface Env {
  STORYBOOK_BASIC_AUTH?: string
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const creds = (context.env.STORYBOOK_BASIC_AUTH ?? '').trim()

  // 有設密碼才驗;未設 → 公開放行(no-op)
  if (creds) {
    const allowed = new Set(creds.split(/\s+/).filter(Boolean)) // {"user:pass", ...}
    const header = context.request.headers.get('Authorization') ?? ''
    let ok = false
    if (header.startsWith('Basic ')) {
      try {
        ok = allowed.has(atob(header.slice(6))) // base64 decode "user:pass"
      } catch {
        ok = false // decode 失敗 → 落到 401
      }
    }
    if (!ok) {
      return new Response('Authentication required.', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Storybook", charset="UTF-8"' },
      })
    }
  }

  // 通過(或未設密碼)→ 取靜態資源,補 anti-SEO headers(對齊 netlify.toml [[headers]])
  const response = await context.next()
  const headers = new Headers(response.headers)
  headers.set('X-Robots-Tag', 'noindex, nofollow')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-Frame-Options', 'SAMEORIGIN')
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
