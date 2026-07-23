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

import { Fragment, createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Avatar,
  Button,
  Badge,
  Input,
  Separator,
  Skeleton,
  ScrollArea,
  ScrollBar,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverBody,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  SegmentedControl,
  SegmentedControlItem,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselDots,
  TooltipProvider,
} from '@qijenchen/design-system'
import {
  Bell,
  Phone,
  Search,
  Calendar,
  Check,
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
  SlidersHorizontal,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react'
import { ManagerAdminApp } from './ManagerAdmin'

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
  { name: '主管管理', icon: ShieldCheck, color: 'blue' },
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

// 行事曆 — 多「行事曆來源」(對應既有系統:user 可訂閱數十個行事曆,各有顏色 + 長名稱);
// event 以距今天的 offset 表示(0=今天)。
const CALENDARS = {
  company: { label: '公司公告行事曆', color: 'blue' },
  dept: { label: '產品設計部', color: 'purple' },
  personal: { label: '個人行程', color: 'green' },
  training: { label: '教育訓練與工作坊', color: 'orange' },
  leave: { label: '請假與出勤', color: 'red' },
  meeting: { label: '跨部門會議', color: 'indigo' },
  project: { label: '33q 改版專案', color: 'magenta' },
  hr: { label: '人資活動與員工福利', color: 'turquoise' },
  holiday: { label: '國定假日', color: 'amber' },
} as const
type CalendarKey = keyof typeof CALENDARS
// period 事件:offset = 起始日,endOffset = 結束日(inclusive);time/endTime = 起訖 time-of-day。
// 單日事件省略 endOffset;無 endTime = 只有起始時間(或全天)。
type CalEvent = {
  offset: number
  endOffset?: number
  time?: string
  endTime?: string
  allDay?: boolean
  title: string
  calendar: CalendarKey
}
const EVENTS: CalEvent[] = [
  // 橫跨今天的進行中跨天事件 — 示範 period 事件於區間內「每天可見」+「進行中」
  { offset: -1, endOffset: 1, allDay: true, title: '設計衝刺週', calendar: 'project' },
  { offset: 1, allDay: true, title: '全員教育訓練日', calendar: 'training' },
  { offset: 1, time: '11:00', title: '與主管 1:1', calendar: 'personal' },
  { offset: 2, endOffset: 4, time: '09:00', endTime: '17:00', title: '台北出差', calendar: 'company' }, // 跨天帶起訖時間
  { offset: 2, time: '10:00', endTime: '11:30', title: 'Sprint 規劃會議', calendar: 'project' }, // 同日時段
  { offset: 2, time: '15:00', title: '設計部週會', calendar: 'dept' },
  { offset: 3, time: '15:30', title: '使用者訪談', calendar: 'project' },
  { offset: 5, time: '14:00', title: '33q 改版設計評審', calendar: 'project' },
  { offset: 6, endOffset: 8, allDay: true, title: '中秋連假', calendar: 'holiday' }, // 全天跨天事件
  { offset: 9, time: '16:00', title: '季度成果檢討', calendar: 'company' },
  { offset: 11, time: '13:00', title: '年度員工健檢', calendar: 'hr' },
]
// period helper:區間(inclusive)+ 某天是否落在區間內 + 是否跨天
const evEnd = (e: CalEvent) => e.endOffset ?? e.offset
const covers = (e: CalEvent, offset: number) => offset >= e.offset && offset <= evEnd(e)
const isMultiDay = (e: CalEvent) => evEnd(e) > e.offset
const CAL_COLOR = (k: CalendarKey) => `var(--color-${CALENDARS[k].color}-6)`
const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']
// 當年第幾週(ISO-style:以該週週四歸屬年份)
function weekOfYear(d: Date) {
  const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7) + 3) // 移到該週週四
  const firstThu = new Date(Date.UTC(x.getUTCFullYear(), 0, 4))
  return 1 + Math.round((x.getTime() - firstThu.getTime()) / (7 * 86400000))
}
// 週數標記:年尾數 + 第幾週(例 2026 第 26 週 → "626")
const weekTag = (d: Date) => `${d.getFullYear() % 10}${weekOfYear(d)}`
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

/* ──────────────────────────── Building blocks ──────────────────────────── */

// 進場載入態:App 進場時全站 loading,各 module 顯示 DS Skeleton(pulse + 自帶 motion-reduce)佔位
const PortalLoadingContext = createContext(false)

// Skeleton 佔位小工具(形狀/尺寸由 className / style 決定,顏色動畫由 DS Skeleton 提供)
function SkelBar({ className = '' }: { className?: string }) {
  return <Skeleton className={`h-[12px] ${className}`} />
}
// N 列「圖示 + 兩行文字」骨架(團隊 / 動態 / 文章)
function SkelRows({ n, circle = true }: { n: number; circle?: boolean }) {
  return (
    <div className="flex flex-col gap-[var(--layout-space-tight)]">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="flex items-center gap-[var(--layout-space-tight)]">
          <Skeleton className={circle ? 'rounded-full' : 'rounded-md'} style={{ width: 40, height: 40 }} />
          <div className="flex flex-1 flex-col gap-[6px]">
            <SkelBar className="w-2/3" />
            <SkelBar className="w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}
// N 格 app icon grid 骨架(精選 / 所有應用)
function SkelAppGrid({ n }: { n: number }) {
  return (
    <div className="grid grid-cols-6 gap-[var(--layout-space-tight)]">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-[8px]">
          <Skeleton className="rounded-md" style={{ width: 48, height: 48 }} />
          <SkelBar className="h-[10px] w-4/5" />
        </div>
      ))}
    </div>
  )
}

function Module({
  title,
  action,
  children,
  bodyClassName,
  skeleton,
}: {
  title?: string
  action?: ReactNode
  children: ReactNode
  bodyClassName?: string
  skeleton?: ReactNode
}) {
  const loading = useContext(PortalLoadingContext)
  return (
    <section className="rounded-lg border border-border bg-surface-raised shadow-[var(--elevation-200)]">
      {(title || action) && (
        <header className="flex items-center justify-between gap-[8px] px-[var(--layout-space-loose)] pt-[var(--layout-space-loose)] pb-[var(--layout-space-tight)]">
          {title && <h2 className="text-body-lg font-semibold text-foreground">{title}</h2>}
          {!loading && action}
        </header>
      )}
      <div className={bodyClassName ?? 'px-[var(--layout-space-loose)] pb-[var(--layout-space-loose)]'}>
        {loading && skeleton ? skeleton : children}
      </div>
    </section>
  )
}

function AppTile({ app, onOpen }: { app: AppEntry; onOpen?: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex flex-col items-center gap-[8px] rounded-md p-[var(--layout-space-tight)] text-center transition-colors hover:bg-neutral-hover">
      <Avatar shape="square" icon={app.icon} color={app.color} size={48} solid />
      <span className="text-caption text-fg-secondary line-clamp-1 w-full">{app.name}</span>
    </button>
  )
}

/* ──────────────────────────── Left column ──────────────────────────── */

function CalendarModule() {
  const [sel, setSel] = useState<number | null>(null) // null = 預設「近期 3 筆」視圖;number = 距今天 offset(>=0)
  const [hidden, setHidden] = useState<Set<CalendarKey>>(() => new Set()) // 被隱藏的行事曆
  const [view, setView] = useState<'list' | 'week' | 'month'>('list') // 完整 modal 檢視模式
  const toggleCal = (k: CalendarKey) =>
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])
  // 兩週對齊真實日曆週:從「本週日」起算 14 格(日~六 × 2),星期共用最上方一排
  const cells = useMemo(() => {
    const start = new Date(today)
    start.setDate(start.getDate() - start.getDay()) // 回到本週日
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      return { date: d, offset: Math.round((d.getTime() - today.getTime()) / 86400000) }
    })
  }, [today])
  const visibleEvents = EVENTS.filter((e) => !hidden.has(e.calendar))
  // 排序:全天事件置頂,再依時間
  const byTime = (a: CalEvent, b: CalEvent) =>
    Number(b.allDay ?? false) - Number(a.allDay ?? false) || (a.time ?? '').localeCompare(b.time ?? '')
  const dayHasEvents = (offset: number) => offset >= 0 && visibleEvents.some((e) => covers(e, offset))
  const todayEmpty = !visibleEvents.some((e) => covers(e, 0))
  const shown =
    sel === null
      ? // 近期摘要:尚未結束(evEnd>=0)的事件,每筆一次,依「下一個相關日 = max(起始, 今天)」排序
        [...visibleEvents]
          .filter((e) => evEnd(e) >= 0)
          .sort((a, b) => Math.max(a.offset, 0) - Math.max(b.offset, 0) || byTime(a, b))
          .slice(0, 3)
      : visibleEvents.filter((e) => covers(e, sel)).sort(byTime)
  const offsetDate = (offset: number) => {
    const d = new Date(today)
    d.setDate(d.getDate() + offset)
    return d
  }
  const selDate = sel === null ? null : offsetDate(sel)
  const dayLabel = (offset: number) => {
    if (offset === 0) return '今天'
    if (offset === 1) return '明天'
    const d = offsetDate(offset)
    return `${d.getMonth() + 1}/${d.getDate()}`
  }

  // 日期 / 區間 / 起訖時間 標記
  const md = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`
  const spanLabel = (e: CalEvent) => `${md(offsetDate(e.offset))}–${md(offsetDate(evEnd(e)))}`
  // 帶時間事件的時間字串:跨天→單行完整 datetime;同日→時段或單一時間
  const timeText = (e: CalEvent) => {
    if (isMultiDay(e)) {
      const start = `${md(offsetDate(e.offset))} ${e.time ?? ''}`.trim()
      const end = e.endTime ? `${md(offsetDate(evEnd(e)))} ${e.endTime}` : md(offsetDate(evEnd(e)))
      return `${start} → ${end}`
    }
    return e.endTime ? `${e.time}–${e.endTime}` : (e.time ?? '')
  }
  const allDayPill = <span className="rounded-full border border-divider px-[6px] text-fg-secondary">全天</span>

  // 單筆事件列(widget 清單 + modal agenda 共用)。跨天顯示區間/起訖 +(進行中)
  const renderEvent = (e: CalEvent, showDay: boolean) => (
    <div className="flex items-start gap-[var(--layout-space-tight)]">
      <span className="mt-[6px] size-2 shrink-0 rounded-full" style={{ backgroundColor: CAL_COLOR(e.calendar) }} />
      <div className="min-w-0 flex-1">
        <div className="text-body font-medium text-foreground truncate">{e.title}</div>
        <div className="flex flex-wrap items-center gap-[6px] text-caption text-fg-muted">
          {isMultiDay(e) ? (
            e.allDay ? (
              <>
                <span className="tabular-nums">{spanLabel(e)}</span>
                {allDayPill}
              </>
            ) : (
              // 跨天帶時間:單行完整 datetime(dates 已內含)
              <span className="tabular-nums">{timeText(e)}</span>
            )
          ) : (
            <>
              {showDay && <span className="tabular-nums">{dayLabel(e.offset)}</span>}
              {e.allDay ? allDayPill : <span className="tabular-nums">{timeText(e)}</span>}
            </>
          )}
          {isMultiDay(e) && covers(e, 0) && (
            <span className="rounded-full bg-primary-subtle px-[6px] text-primary">進行中</span>
          )}
          <span className="opacity-50">·</span>
          <span className="max-w-[120px] truncate" title={CALENDARS[e.calendar].label}>
            {CALENDARS[e.calendar].label}
          </span>
        </div>
      </div>
    </div>
  )

  // 行事曆來源篩選(icon 鈕 → Popover;移出右上角「完整」固定鈕區)
  const calendarFilter = (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="text" size="sm" iconOnly startIcon={SlidersHorizontal} aria-label="篩選行事曆來源" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[260px]">
        <PopoverHeader>
          <PopoverTitle>行事曆 ({Object.keys(CALENDARS).length})</PopoverTitle>
        </PopoverHeader>
        <PopoverBody>
          <ScrollArea className="max-h-[280px]">
            <ul className="flex flex-col">
              {Object.entries(CALENDARS).map(([key, c]) => {
                const k = key as CalendarKey
                const on = !hidden.has(k)
                return (
                  <li key={key}>
                    <button
                      onClick={() => toggleCal(k)}
                      aria-pressed={on}
                      className="flex w-full items-center gap-[var(--layout-space-tight)] rounded-md p-[var(--layout-space-tight)] text-left transition-colors hover:bg-neutral-hover"
                    >
                      <span
                        className={`size-[12px] shrink-0 rounded-full ${on ? '' : 'border border-divider'}`}
                        style={on ? { backgroundColor: CAL_COLOR(k) } : undefined}
                      />
                      <span
                        className={`min-w-0 flex-1 truncate text-body ${on ? 'text-foreground' : 'text-fg-muted'}`}
                        title={c.label}
                      >
                        {c.label}
                      </span>
                      {on && <Check className="size-4 shrink-0 text-primary" />}
                    </button>
                  </li>
                )
              })}
            </ul>
          </ScrollArea>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  )

  // 完整行事曆 modal 的 agenda(近兩週,只列有行程的日子;跨天事件每個涵蓋日都算)
  const agendaDays = cells.filter((c) => c.offset >= 0 && visibleEvents.some((e) => covers(e, c.offset)))
  const eventsOnDate = (d: Date) => {
    const o = Math.round((d.getTime() - today.getTime()) / 86400000)
    return visibleEvents.filter((e) => covers(e, o))
  }
  // 月檢視:當月所在的 6 週 grid(從該月首日所在週的週日起算 42 格)
  const monthCells = useMemo(() => {
    const first = new Date(today.getFullYear(), today.getMonth(), 1)
    const start = new Date(first)
    start.setDate(1 - first.getDay())
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      return d
    })
  }, [today])

  // ── modal 三種檢視(既有功能,示意)──
  const listView =
    agendaDays.length > 0 ? (
      <div className="flex flex-col gap-[var(--layout-space-loose)]">
        {agendaDays.map(({ offset }) => (
          <div key={offset}>
            <div className="mb-[var(--layout-space-tight)] text-body font-semibold text-foreground">
              {dayLabel(offset)} · 週{WEEKDAYS[offsetDate(offset).getDay()]}
            </div>
            <ul className="flex flex-col gap-[var(--layout-space-tight)]">
              {visibleEvents
                .filter((e) => covers(e, offset))
                .sort(byTime)
                .map((e) => (
                  <li key={`${offset}-${e.calendar}-${e.title}`}>{renderEvent(e, false)}</li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    ) : (
      <div className="py-[var(--layout-space-loose)] text-center text-caption text-fg-muted">近兩週沒有行程</div>
    )

  const weekView = (
    <div className="grid grid-cols-7 gap-[8px]">
      {cells.slice(0, 7).map(({ date: d, offset }) => (
        <div key={offset} className="min-w-0">
          <div className={`mb-[8px] text-center text-caption ${offset === 0 ? 'font-semibold text-primary' : 'text-fg-muted'}`}>
            週{WEEKDAYS[d.getDay()]}
            <span className="block tabular-nums">{d.getDate()}</span>
          </div>
          <div className="flex flex-col gap-[4px]">
            {visibleEvents
              .filter((e) => covers(e, offset))
              .sort(byTime)
              .map((e) => (
                <div
                  key={`${offset}-${e.calendar}-${e.title}`}
                  className="flex items-center gap-[4px] rounded-sm bg-surface px-[6px] py-[4px]"
                  title={`${e.allDay ? '全天' : timeText(e)} · ${e.title}`}
                >
                  <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: CAL_COLOR(e.calendar) }} />
                  <span className="truncate text-caption text-foreground">{e.title}</span>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  )

  const monthView = (
    <div>
      <div className="grid grid-cols-7 gap-[4px]">
        {WEEKDAYS.map((w) => (
          <span key={w} className="text-center text-caption text-fg-muted">
            {w}
          </span>
        ))}
      </div>
      <div className="mt-[4px] grid grid-cols-7 gap-[4px]">
        {monthCells.map((d, i) => {
          const inMonth = d.getMonth() === today.getMonth()
          const isToday = sameDay(d, today)
          const evs = eventsOnDate(d)
          return (
            <div
              key={i}
              className={`flex min-h-[48px] flex-col items-center gap-[2px] rounded-md py-[4px] ${isToday ? 'bg-primary-subtle' : ''}`}
            >
              <span
                className={`text-caption tabular-nums ${isToday ? 'font-semibold text-primary' : inMonth ? 'text-foreground' : 'text-fg-disabled'}`}
              >
                {d.getDate()}
              </span>
              <span className="flex flex-wrap justify-center gap-[2px]">
                {evs.slice(0, 3).map((e, j) => (
                  <span key={j} className="size-[5px] rounded-full" style={{ backgroundColor: CAL_COLOR(e.calendar) }} />
                ))}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <Module
      skeleton={
        <div className="flex flex-col gap-[var(--layout-space-tight)]">
          <div className="grid grid-cols-7 gap-[4px]">
            {Array.from({ length: 14 }).map((_, i) => (
              <Skeleton key={i} className="h-[32px] rounded-md" />
            ))}
          </div>
          <SkelRows n={3} />
        </div>
      }
      title="我的行事曆"
      action={
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="link" size="sm">
              更多
            </Button>
          </DialogTrigger>
          <DialogContent autoHeight maxWidth={640}>
            <DialogHeader>
              <DialogTitle>我的行事曆</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <div className="mb-[var(--layout-space-loose)]">
                <SegmentedControl value={view} onValueChange={(v) => setView(v as 'list' | 'week' | 'month')}>
                  <SegmentedControlItem value="list">清單</SegmentedControlItem>
                  <SegmentedControlItem value="week">週</SegmentedControlItem>
                  <SegmentedControlItem value="month">月</SegmentedControlItem>
                </SegmentedControl>
              </div>
              {view === 'list' ? listView : view === 'week' ? weekView : monthView}
            </DialogBody>
          </DialogContent>
        </Dialog>
      }
    >
      {/* 星期共用最上方一排;每週左側顯示週數(年尾數+第幾週,例 626);今天前淡化不可選;灰點 = 有行程 */}
      <div className="grid items-center gap-[4px]" style={{ gridTemplateColumns: 'auto repeat(7, minmax(0,1fr))' }}>
        <span aria-hidden />
        {WEEKDAYS.map((w) => (
          <span key={w} className="text-center text-caption text-fg-muted">
            {w}
          </span>
        ))}
        {[0, 7].map((wkStart) => (
          <Fragment key={wkStart}>
            <span
              className="pr-[6px] text-right text-caption tabular-nums text-fg-muted"
              title={`第 ${weekOfYear(cells[wkStart].date)} 週`}
            >
              {weekTag(cells[wkStart].date)}
            </span>
            {cells.slice(wkStart, wkStart + 7).map(({ date: d, offset }) => {
              const isToday = offset === 0
              const isPast = offset < 0
              const isSel = sel === offset
              const has = dayHasEvents(offset)
              const state = isSel
                ? 'bg-primary text-on-emphasis'
                : isPast
                  ? 'text-fg-disabled cursor-default'
                  : isToday
                    ? 'bg-primary-subtle text-primary font-semibold'
                    : 'text-foreground hover:bg-neutral-hover'
              return (
                <button
                  key={offset}
                  disabled={isPast}
                  onClick={() => !isPast && setSel(isSel ? null : offset)}
                  aria-pressed={isSel}
                  aria-label={`${d.getMonth() + 1}月${d.getDate()}日 週${WEEKDAYS[d.getDay()]}${has ? ' · 有行程' : ''}`}
                  className={`flex flex-col items-center gap-[2px] rounded-md py-[6px] transition-colors ${state}`}
                >
                  <span className="text-body tabular-nums leading-none">{d.getDate()}</span>
                  <span className="flex h-[5px] items-center">
                    {has && !isSel && <span className="size-[5px] rounded-full bg-current opacity-40" />}
                  </span>
                </button>
              )
            })}
          </Fragment>
        ))}
      </div>

      <Separator className="my-[var(--layout-space-tight)]" />

      {/* event 區:預設近 3 筆;選日期則過濾當日。右側 = 返回 + 行事曆來源篩選 */}
      <div className="flex items-center justify-between gap-[8px]">
        <span className="min-w-0 truncate text-body font-medium text-foreground">
          {sel === null ? '近期行程' : `${selDate!.getMonth() + 1}月${selDate!.getDate()}日 · 週${WEEKDAYS[selDate!.getDay()]}`}
        </span>
        <div className="flex shrink-0 items-center gap-[4px]">
          {sel !== null && (
            <Button variant="text" size="sm" onClick={() => setSel(null)}>
              返回近期
            </Button>
          )}
          {calendarFilter}
        </div>
      </div>

      {/* 今天無行程的情境提示 */}
      {sel === null && todayEmpty && (
        <div className="mt-[4px] text-caption text-fg-muted">今天沒有行程,以下為近期安排</div>
      )}

      {shown.length > 0 ? (
        <ul className="mt-[var(--layout-space-tight)] flex flex-col">
          {shown.map((e, idx) => (
            <li key={`${e.offset}-${e.time ?? 'allday'}-${e.title}`}>
              {idx > 0 && <Separator className="my-[8px]" />}
              {renderEvent(e, sel === null)}
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-[var(--layout-space-tight)] py-[var(--layout-space-loose)] text-center text-caption text-fg-muted">
          這天沒有安排行程
        </div>
      )}
    </Module>
  )
}

function MeModule() {
  return (
    <Module
      bodyClassName="p-[var(--layout-space-loose)]"
      skeleton={
        <div className="flex flex-col gap-[var(--layout-space-loose)]">
          <div className="flex items-center gap-[var(--layout-space-tight)]">
            <Skeleton className="rounded-full" style={{ width: 56, height: 56 }} />
            <div className="flex flex-1 flex-col gap-[6px]">
              <SkelBar className="w-1/2" />
              <SkelBar className="h-[10px] w-3/4" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-[var(--layout-space-tight)]">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[52px] rounded-md" />
            ))}
          </div>
        </div>
      }
    >
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
    <Module
      title="我的團隊"
      action={<Button variant="text" size="sm" endIcon={ChevronRight}>全部</Button>}
      skeleton={<SkelRows n={5} />}
    >
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

function FeaturedAppsModule({ onOpenManager }: { onOpenManager: () => void }) {
  return (
    <Module title="精選應用" skeleton={<SkelAppGrid n={6} />}>
      <div className="grid grid-cols-6 gap-[var(--layout-space-tight)]">
        {FEATURED_APPS.map((app) => (
          <AppTile key={app.name} app={app} onOpen={app.name === '主管管理' ? onOpenManager : undefined} />
        ))}
      </div>
    </Module>
  )
}

function NotificationsModule() {
  return (
    <Module
      title="通知中心"
      action={<Button variant="text" size="sm" endIcon={ChevronRight}>查看全部</Button>}
      skeleton={
        <div className="flex gap-[var(--layout-space-tight)] overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="shrink-0 rounded-md" style={{ width: 204, height: 143 }} />
          ))}
        </div>
      }
    >
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

function AppsModule({ onOpenManager }: { onOpenManager: () => void }) {
  return (
    <Module
      title="所有應用"
      action={<Button variant="text" size="sm" endIcon={ChevronRight}>應用市集</Button>}
      skeleton={<SkelAppGrid n={12} />}
    >
      <div className="grid grid-cols-6 gap-[var(--layout-space-tight)]">
        {ALL_APPS.map((app) => (
          <AppTile key={app.name} app={app} onOpen={app.name === '主管管理' ? onOpenManager : undefined} />
        ))}
      </div>
    </Module>
  )
}

function QaModule() {
  return (
    <Module
      title="常見問題"
      skeleton={
        <div className="grid grid-cols-2 gap-[var(--layout-space-tight)]">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-[6px] rounded-md border border-divider p-[var(--layout-space-tight)]">
              <SkelBar className="w-3/4" />
              <SkelBar className="h-[10px] w-full" />
              <SkelBar className="h-[10px] w-2/3" />
            </div>
          ))}
        </div>
      }
    >
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
    <Module title="動態追蹤" skeleton={<SkelRows n={4} circle={false} />}>
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
    <Module title="精選文章" skeleton={<SkelRows n={4} circle={false} />}>
      <Carousel opts={{ loop: false }}>
        <CarouselContent>
          {pages.map((page, pi) => (
            <CarouselItem key={pi}>
              <ul className="flex flex-col">
                {page.map((article, ai) => (
                  <li key={article.title}>
                    {ai > 0 && <Separator className="my-[8px]" />}
                    <a href="#" className="group flex items-start gap-[var(--layout-space-tight)] rounded-md p-[4px] transition-colors hover:bg-neutral-hover">
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
      skeleton={
        <div className="flex flex-col gap-[8px]">
          <SkelBar className="w-full" />
          <SkelBar className="w-2/3" />
        </div>
      }
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
              href="#"
              className={`rounded-md px-[var(--layout-space-tight)] py-[6px] transition-colors hover:bg-neutral-hover ${i === 0 ? 'text-foreground font-medium' : ''}`}
            >
              {n}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-[8px]">
          <Input
            startIcon={Search}
            size="sm"
            placeholder="搜尋應用、同事、公告…"
            aria-label="全站搜尋"
            className="w-[260px] rounded-full"
          />
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
            <a key={n} href="#" className="transition-colors hover:text-foreground">
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
  // 進場模擬載入:所有 module 先顯示 skeleton,約 0.9s 後換真實內容
  const [loading, setLoading] = useState(true)
  // 入口首頁 vs 主管管理系統(點精選/所有應用的「主管管理」圖示進入,自帶全螢幕 AppShell)
  const [view, setView] = useState<'home' | 'manager'>('home')
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900)
    return () => clearTimeout(t)
  }, [])

  if (view === 'manager') {
    // 主管管理是 33q 原生開啟的 app → 沿用 33q 的 PortalHeader,管理頁本身不自帶 header
    return (
      <TooltipProvider delayDuration={500} skipDelayDuration={300}>
        <div className="relative min-h-screen min-w-[1000px] bg-canvas">
          <PortalHeader />
          <ManagerAdminApp onBack={() => setView('home')} />
        </div>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider delayDuration={500} skipDelayDuration={300}>
      <PortalLoadingContext.Provider value={loading}>
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
              <CalendarModule />
              <TeamModule />
            </div>

            {/* 中欄 */}
            <div className="flex flex-col gap-[20px]">
              <FeaturedAppsModule onOpenManager={() => setView('manager')} />
              <NotificationsModule />
              <AppsModule onOpenManager={() => setView('manager')} />
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
      </PortalLoadingContext.Provider>
    </TooltipProvider>
  )
}
