// 33q — 員工入口平台(Employee Portal)
//
// 既有系統的 UI 重現(mock 資料,僅供測試人員看版面/互動;數值非真實)。
// 佈局規格:
//   - Web portal,bento UI 風格;content max 1920 / min 1200,置中,四邊 ≥40px margin
//   - 三欄:左右固定 360px,中間 fill;模塊間距 20px
//   - 固定 header 64px;模塊距 header 120px;背景 hero band 高 400px,模塊從 120px 處 overlap
//   - footer 110px
//
// 間距策略:容器呼吸 padding/gap 走 DS `--layout-space-*` token(density-aware);
//   產品精確結構值(20px 模塊間距 / 40px margin / 360px 欄 / 204×143 卡 / 64px header / 400px band)
//   與 micro icon gap 用 arbitrary `[Npx]`(非 Tailwind scale,符合既有系統精確規格)。
// 色值/字級/陰影一律走 DS token(`bg-surface` / `text-body` / `shadow-[var(--elevation-N)]`),不硬寫。
//
// SSOT 鐵律:只 consume @qijenchen/design-system public exports,不改 DS source,不自刻 DS 元件。

import { useState, type ReactNode } from 'react'
import {
  Avatar,
  Button,
  Badge,
  Separator,
  ScrollArea,
  ScrollBar,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverBody,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselDots,
  TooltipProvider,
} from '@qijenchen/design-system'
import {
  Bell,
  Phone,
  Calendar,
  Mail,
  Users,
  BarChart3,
  Settings,
  CreditCard,
  Plane,
  GraduationCap,
  ClipboardList,
  Briefcase,
  Building2,
  Wallet,
  HeartPulse,
  Megaphone,
  ShieldCheck,
  RefreshCw,
  FileText,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react'

/* ──────────────────────────── Mock data ──────────────────────────── */

const ME = {
  name: '陳怡君',
  title: '產品設計部 · 資深設計師',
  metrics: [
    { label: '待辦事項', value: 12 },
    { label: '已完成', value: 148 },
    { label: '待審批', value: 3 },
    { label: '本月出勤', value: '21d' },
  ],
}

const TEAM = [
  { name: '林志明', role: '工程經理', phone: '#2201', color: 'blue' as const },
  { name: '王思婷', role: '前端工程師', phone: '#2202', color: 'green' as const },
  { name: '張家豪', role: '後端工程師', phone: '#2203', color: 'orange' as const },
  { name: '李美玲', role: 'QA 工程師', phone: '#2204', color: 'purple' as const },
  { name: '黃柏翰', role: '產品經理', phone: '#2205', color: 'red' as const },
]

type AppEntry = { name: string; icon: LucideIcon; color: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'turquoise' }
const FEATURED_APPS: AppEntry[] = [
  { name: '差勤系統', icon: Calendar, color: 'blue' },
  { name: '請款報帳', icon: Wallet, color: 'green' },
  { name: '差旅申請', icon: Plane, color: 'orange' },
  { name: '人事資料', icon: Users, color: 'purple' },
  { name: '簽核中心', icon: ClipboardList, color: 'red' },
  { name: '薪資查詢', icon: CreditCard, color: 'turquoise' },
]

const ALL_APPS: AppEntry[] = [
  ...FEATURED_APPS,
  { name: '教育訓練', icon: GraduationCap, color: 'blue' },
  { name: '專案管理', icon: Briefcase, color: 'green' },
  { name: '會議室預訂', icon: Building2, color: 'orange' },
  { name: '健康關懷', icon: HeartPulse, color: 'red' },
  { name: '報表中心', icon: BarChart3, color: 'purple' },
  { name: '系統設定', icon: Settings, color: 'turquoise' },
]

const NOTIFICATIONS = [
  { tag: '簽核', title: '差旅申請待簽核', desc: '王思婷提出 11/20 台北出差申請,等待你核可。', time: '10 分鐘前' },
  { tag: '系統', title: '差勤系統維護公告', desc: '本週六 02:00–04:00 進行系統維護,屆時暫停服務。', time: '1 小時前' },
  { tag: '人資', title: '年度健檢預約開始', desc: '2026 年度員工健檢開放預約,額滿為止。', time: '3 小時前' },
  { tag: '財務', title: '10 月薪資已發放', desc: '10 月份薪資明細已可於薪資查詢系統檢視。', time: '昨天' },
  { tag: '公告', title: '尾牙活動報名', desc: '年度尾牙 1/18 舉行,即日起開放線上報名。', time: '昨天' },
  { tag: '訓練', title: '資安意識課程', desc: '必修資安課程請於本月底前完成,逾期將提醒主管。', time: '2 天前' },
  { tag: '簽核', title: '加班單已核准', desc: '你 11/12 的加班申請已由主管核准。', time: '3 天前' },
]

const QA = [
  { q: '如何申請特休假?', a: '進入差勤系統 →「假勤申請」→ 選擇特別休假,填寫起迄時間後送出主管簽核即可。' },
  { q: '忘記打卡怎麼辦?', a: '可於差勤系統提出「補打卡」申請,附上事由,經主管核可後補登出勤紀錄。' },
  { q: '報帳期限是什麼時候?', a: '當月費用請於次月 5 日前完成請款報帳,逾期需附說明並由部門主管核准。' },
  { q: '如何預約會議室?', a: '於會議室預訂系統選擇日期、時段與會議室,送出後系統會即時鎖定該時段。' },
]

const ACTIVITIES: { icon: LucideIcon; label: string; meta: string; detail: ReactNode }[] = [
  { icon: ClipboardList, label: '待我簽核', meta: '3 筆待處理', detail: '差旅申請 ×1、加班單 ×1、請款單 ×1 等待你的簽核,最久已等待 2 天。' },
  { icon: RefreshCw, label: '流程進度', meta: '2 筆進行中', detail: '你的「教育訓練補助」已送至人資審核;「設備申請」正由 IT 處理中。' },
  { icon: ShieldCheck, label: '待辦提醒', meta: '本週 4 項', detail: '資安課程、健檢預約、季度目標填寫、部門週報尚未完成。' },
  { icon: Megaphone, label: '最新公告', meta: '5 則未讀', detail: '包含尾牙報名、系統維護、健檢開放等 5 則公告,點擊前往公告中心檢視全部。' },
]

const ARTICLES = [
  { tag: '組織文化', title: '從 0 到 1:33q 設計系統的導入歷程', meta: '產品團隊 · 5 分鐘閱讀' },
  { tag: '工作技巧', title: '遠距協作的 7 個高效習慣', meta: '人資部 · 3 分鐘閱讀' },
  { tag: '福利政策', title: '2026 員工福利與補助總整理', meta: '人資部 · 6 分鐘閱讀' },
  { tag: '技術分享', title: '導入 CI/CD 後我們省下的時間', meta: '工程部 · 8 分鐘閱讀' },
  { tag: '健康', title: '久坐族必看的 5 分鐘伸展操', meta: '健康關懷 · 4 分鐘閱讀' },
  { tag: '管理', title: '一對一會議該怎麼開才有效', meta: '管理學院 · 7 分鐘閱讀' },
  { tag: '產品', title: '使用者研究的入門指南', meta: '產品團隊 · 9 分鐘閱讀' },
  { tag: '財務', title: '報帳新制上路重點懶人包', meta: '財務部 · 3 分鐘閱讀' },
  { tag: '活動', title: '年度黑客松回顧與得獎作品', meta: '工程部 · 5 分鐘閱讀' },
  { tag: '永續', title: '辦公室減塑,我們可以這樣做', meta: 'ESG 小組 · 4 分鐘閱讀' },
  { tag: '資安', title: '釣魚郵件的 5 個辨識技巧', meta: '資安團隊 · 6 分鐘閱讀' },
  { tag: '學習', title: '線上課程平台使用教學', meta: '教育訓練 · 2 分鐘閱讀' },
]

const QUOTES = [
  '把每一件小事做好,就是不平凡。',
  '今天的努力,是明天的選擇權。',
  '與其追求完美,不如先開始。',
  '溝通的品質,決定協作的速度。',
  '休息,是為了走更長遠的路。',
]

/* ──────────────────────────── Building blocks ──────────────────────────── */

function Module({
  title,
  action,
  children,
  bodyClassName,
}: {
  title?: string
  action?: ReactNode
  children: ReactNode
  bodyClassName?: string
}) {
  return (
    <section className="rounded-lg border border-border bg-surface-raised shadow-[var(--elevation-200)]">
      {(title || action) && (
        <header className="flex items-center justify-between gap-[8px] px-[var(--layout-space-loose)] pt-[var(--layout-space-loose)] pb-[var(--layout-space-tight)]">
          {title && <h2 className="text-body-lg font-semibold text-foreground">{title}</h2>}
          {action}
        </header>
      )}
      <div className={bodyClassName ?? 'px-[var(--layout-space-loose)] pb-[var(--layout-space-loose)]'}>{children}</div>
    </section>
  )
}

function AppTile({ app }: { app: AppEntry }) {
  return (
    <button className="group flex flex-col items-center gap-[8px] rounded-md p-[var(--layout-space-tight)] text-center transition-colors hover:bg-neutral-hover">
      <Avatar shape="square" icon={app.icon} color={app.color} size={48} solid />
      <span className="text-caption text-fg-secondary line-clamp-1 w-full">{app.name}</span>
    </button>
  )
}

/* ──────────────────────────── Left column ──────────────────────────── */

function MeModule() {
  return (
    <Module bodyClassName="p-[var(--layout-space-loose)]">
      <div className="flex items-center gap-[var(--layout-space-tight)]">
        <Avatar size={56} alt={ME.name} color="blue" status="online" />
        <div className="min-w-0">
          <div className="text-body-lg font-semibold text-foreground truncate">{ME.name}</div>
          <div className="text-caption text-fg-muted truncate">{ME.title}</div>
        </div>
      </div>
      <Separator className="my-[var(--layout-space-loose)]" />
      <div className="grid grid-cols-2 gap-[var(--layout-space-tight)]">
        {ME.metrics.map((m) => (
          <div key={m.label} className="rounded-md bg-surface p-[var(--layout-space-tight)]">
            <div className="text-h3 font-semibold text-foreground leading-tight">{m.value}</div>
            <div className="text-caption text-fg-muted mt-[2px]">{m.label}</div>
          </div>
        ))}
      </div>
    </Module>
  )
}

function TeamModule() {
  return (
    <Module title="我的團隊" action={<Button variant="text" size="sm" endIcon={ChevronRight}>全部</Button>}>
      <ul className="flex flex-col">
        {TEAM.map((t, i) => (
          <li key={t.name}>
            {i > 0 && <Separator className="my-[4px]" />}
            <div className="flex items-center gap-[var(--layout-space-tight)] py-[6px]">
              <Avatar size={40} alt={t.name} color={t.color} />
              <div className="min-w-0 flex-1">
                <div className="text-body font-medium text-foreground truncate">{t.name}</div>
                <div className="text-caption text-fg-muted truncate">{t.role}</div>
              </div>
              <span className="text-caption text-fg-secondary tabular-nums">{t.phone}</span>
              <Button variant="text" size="sm" iconOnly startIcon={Phone} aria-label={`撥打給 ${t.name}`} />
            </div>
          </li>
        ))}
      </ul>
    </Module>
  )
}

/* ──────────────────────────── Middle column ──────────────────────────── */

function FeaturedAppsModule() {
  return (
    <Module title="精選應用">
      <div className="grid grid-cols-6 gap-[var(--layout-space-tight)]">
        {FEATURED_APPS.map((app) => (
          <AppTile key={app.name} app={app} />
        ))}
      </div>
    </Module>
  )
}

function NotificationsModule() {
  return (
    <Module title="通知中心" action={<Button variant="text" size="sm" endIcon={ChevronRight}>查看全部</Button>}>
      <ScrollArea className="w-full">
        <div className="flex gap-[var(--layout-space-tight)] pb-[var(--layout-space-tight)]">
          {NOTIFICATIONS.map((n) => (
            <article
              key={n.title}
              className="flex h-[143px] w-[204px] shrink-0 flex-col rounded-md border border-border bg-surface p-[var(--layout-space-tight)]"
            >
              <span className="text-caption text-info font-medium">{n.tag}</span>
              <h3 className="text-body font-medium text-foreground line-clamp-1 mt-[4px]">{n.title}</h3>
              <p className="text-caption text-fg-secondary line-clamp-3 mt-[4px] flex-1">{n.desc}</p>
              <span className="text-caption text-fg-muted mt-[4px]">{n.time}</span>
            </article>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </Module>
  )
}

function AppsModule() {
  return (
    <Module title="所有應用" action={<Button variant="text" size="sm" endIcon={ChevronRight}>應用市集</Button>}>
      <div className="grid grid-cols-6 gap-[var(--layout-space-tight)]">
        {ALL_APPS.map((app) => (
          <AppTile key={app.name} app={app} />
        ))}
      </div>
    </Module>
  )
}

function QaModule() {
  return (
    <Module title="常見問題">
      <div className="grid grid-cols-2 gap-[var(--layout-space-tight)]">
        {QA.map((item) => (
          <div key={item.q} className="rounded-md border border-divider bg-surface p-[var(--layout-space-tight)]">
            <h3 className="text-body font-medium text-foreground line-clamp-1">{item.q}</h3>
            <p className="text-caption text-fg-secondary line-clamp-2 mt-[4px]">{item.a}</p>
          </div>
        ))}
      </div>
    </Module>
  )
}

/* ──────────────────────────── Right column ──────────────────────────── */

function ActivityModule() {
  return (
    <Module title="動態追蹤">
      <ul className="flex flex-col gap-[4px]">
        {ACTIVITIES.map((a) => (
          <li key={a.label}>
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex w-full items-center gap-[var(--layout-space-tight)] rounded-md p-[var(--layout-space-tight)] text-left transition-colors hover:bg-neutral-hover">
                  <Avatar shape="square" icon={a.icon} color="blue" size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="text-body font-medium text-foreground truncate">{a.label}</div>
                    <div className="text-caption text-fg-muted truncate">{a.meta}</div>
                  </div>
                  <ChevronRight className="size-4 text-fg-muted" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end">
                <PopoverHeader>
                  <PopoverTitle>{a.label}</PopoverTitle>
                </PopoverHeader>
                <PopoverBody>
                  <p className="text-body text-fg-secondary">{a.detail}</p>
                </PopoverBody>
              </PopoverContent>
            </Popover>
          </li>
        ))}
      </ul>
    </Module>
  )
}

function ArticlesModule() {
  const pages = [ARTICLES.slice(0, 4), ARTICLES.slice(4, 8), ARTICLES.slice(8, 12)]
  return (
    <Module title="精選文章">
      <Carousel opts={{ loop: false }}>
        <CarouselContent>
          {pages.map((page, pi) => (
            <CarouselItem key={pi}>
              <ul className="flex flex-col">
                {page.map((article, ai) => (
                  <li key={article.title}>
                    {ai > 0 && <Separator className="my-[8px]" />}
                    <a className="group flex items-start gap-[var(--layout-space-tight)] rounded-md p-[4px] transition-colors hover:bg-neutral-hover">
                      <div className="mt-[2px] size-10 shrink-0 rounded-md bg-surface flex items-center justify-center">
                        <FileText className="size-5 text-fg-muted" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-caption text-info font-medium">{article.tag}</span>
                        <h3 className="text-body font-medium text-foreground line-clamp-2 leading-snug">{article.title}</h3>
                        <span className="text-caption text-fg-muted">{article.meta}</span>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="mt-[var(--layout-space-tight)] flex justify-center">
          <CarouselDots />
        </div>
      </Carousel>
    </Module>
  )
}

function QuoteModule() {
  const [idx, setIdx] = useState(0)
  return (
    <Module
      title="每日一句"
      action={
        <Button
          variant="text"
          size="sm"
          iconOnly
          startIcon={RefreshCw}
          aria-label="換一句"
          onClick={() => setIdx((i) => (i + 1) % QUOTES.length)}
        />
      }
    >
      <blockquote className="text-body-lg text-foreground leading-relaxed">「{QUOTES[idx]}」</blockquote>
    </Module>
  )
}

/* ──────────────────────────── Chrome (header / footer) ──────────────────────────── */

function PortalHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-divider bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-full max-w-[2000px] items-center gap-[var(--layout-space-loose)] px-[40px]">
        <div className="flex items-center gap-[8px]">
          <Avatar shape="square" alt="33q" color="blue" size={32} solid />
          <span className="text-body-lg font-semibold text-foreground">33q 員工入口</span>
        </div>
        <nav className="flex items-center gap-[4px] text-body text-fg-secondary">
          {['首頁', '應用', '公告', '知識庫'].map((n, i) => (
            <a
              key={n}
              className={`rounded-md px-[var(--layout-space-tight)] py-[6px] transition-colors hover:bg-neutral-hover ${i === 0 ? 'text-foreground font-medium' : ''}`}
            >
              {n}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-[8px]">
          <Button variant="text" size="md" iconOnly startIcon={Mail} aria-label="信件" />
          <div className="relative">
            <Button variant="text" size="md" iconOnly startIcon={Bell} aria-label="通知" />
            <span className="pointer-events-none absolute right-[4px] top-[4px]">
              <Badge variant="critical" count={5} />
            </span>
          </div>
          <Separator orientation="vertical" className="mx-[4px] h-6" />
          <Avatar size={32} alt={ME.name} color="blue" status="online" />
        </div>
      </div>
    </header>
  )
}

function PortalFooter() {
  return (
    <footer className="h-[110px] border-t border-divider bg-surface">
      <div className="mx-auto flex h-full max-w-[2000px] items-center justify-between px-[40px]">
        <div className="flex items-center gap-[8px] text-fg-muted">
          <Avatar shape="square" alt="33q" color="blue" size={28} solid />
          <span className="text-caption">© 2026 33q 員工入口平台 · 內部系統</span>
        </div>
        <nav className="flex items-center gap-[var(--layout-space-loose)] text-caption text-fg-secondary">
          {['使用說明', '意見回饋', 'IT 服務台', '隱私政策'].map((n) => (
            <a key={n} className="transition-colors hover:text-foreground">
              {n}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  )
}

/* ──────────────────────────── Page ──────────────────────────── */

export default function App() {
  return (
    <TooltipProvider delayDuration={500} skipDelayDuration={300}>
      <div className="relative min-h-screen min-w-[1200px] bg-canvas">
        <PortalHeader />

        {/* hero background band — 高 400px,從 header 下緣起,模塊從 120px 處 overlap */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-16 h-[400px]"
          style={{
            background:
              'linear-gradient(120deg, var(--color-blue-7) 0%, var(--color-blue-9) 60%, var(--color-blue-10) 100%)',
          }}
        />

        <main
          className="relative z-10 mx-auto max-w-[2000px] px-[40px] pb-[40px]"
          style={{ paddingTop: 'calc(4rem + 120px)' }}
        >
          <div className="grid items-start gap-[20px]" style={{ gridTemplateColumns: '360px minmax(0,1fr) 360px' }}>
            {/* 左欄 */}
            <div className="flex flex-col gap-[20px]">
              <MeModule />
              <TeamModule />
            </div>

            {/* 中欄 */}
            <div className="flex flex-col gap-[20px]">
              <FeaturedAppsModule />
              <NotificationsModule />
              <AppsModule />
              <QaModule />
            </div>

            {/* 右欄 */}
            <div className="flex flex-col gap-[20px]">
              <ActivityModule />
              <ArticlesModule />
              <QuoteModule />
            </div>
          </div>
        </main>

        <PortalFooter />
      </div>
    </TooltipProvider>
  )
}
