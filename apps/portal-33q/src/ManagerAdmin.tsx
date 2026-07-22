// 主管管理系統 — 從 33q 員工入口「主管管理」圖示進入(in-app 全畫面,bento UI 與入口一致)
//
// 三條 user journey:
//   A 快速看團隊概況就離開 → 頂部「子組織比較卡」一眼掃(人數/男女比/職等分布)。
//   B 找特定人看詳細檔案 → 人員搜尋 + 點表格列 → 個人檔案 Modal(私人電話/出勤警示/歷年考核/戶籍/學經歷)。
//   C 比較直屬子組織 → 同一排子組織比較卡橫向比,可下鑽。
//
// 結構:頁首(返回+組織選擇+搜尋)→ 子組織比較卡 → 膠囊 tab(第一層/第二層/子組織,含人數)
//       → 人員清單卡(內容過濾器 篩列 + 內容分類 tab 換欄位 + 表格)→ 個人檔案 Dialog。
//
// bento/token 與入口一致(rounded-lg / bg-surface-raised / shadow / --layout-space-*);個人檔案走 Dialog
// (同入口行事曆「更多」modal 模式)。SSOT:只 import DS public exports,不改 DS source,不自刻 DS 元件。
// 私人電話 / 戶籍地為敏感個資 — 原型用假資料展示,真實系統應做權限控管與存取紀錄。

import { useMemo, useState, type ReactNode } from 'react'
import {
  Avatar,
  Button,
  Input,
  Tag,
  Separator,
  SegmentedControl,
  SegmentedControlItem,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from '@qijenchen/design-system'
import { ArrowLeft, ChevronDown, Search, Phone, MapPin, TriangleAlert, Building2 } from 'lucide-react'

/* ──────────────────────────── 組織樹 ──────────────────────────── */

type OrgId = string
type Org = { id: OrgId; name: string; parentId: OrgId | null }
// 王經理管理「產品處」,底下三個部門
const ORGS: Org[] = [
  { id: 'prod', name: '產品處', parentId: null },
  { id: 'plan1', name: '企劃一部', parentId: 'prod' },
  { id: 'plan2', name: '企劃二部', parentId: 'prod' },
  { id: 'design', name: '設計部', parentId: 'prod' },
]
const orgName = (id: OrgId) => ORGS.find((o) => o.id === id)?.name ?? id
const childrenOf = (id: OrgId) => ORGS.filter((o) => o.parentId === id)
const subtreeIds = (id: OrgId): OrgId[] => [id, ...childrenOf(id).flatMap((c) => subtreeIds(c.id))]

/* ──────────────────────────── 人員 mock ──────────────────────────── */

type AvatarColor = 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'indigo' | 'amber' | 'magenta'
type Attendance = '正常' | '遲到' | '請假' | '缺勤警示'
type Person = {
  id: string
  name: string
  orgId: OrgId
  gender: 'M' | 'F'
  level: number // 職等 P#
  reportLevel: 1 | 2 // 相對王經理:1=直屬(各部主管)、2=部門成員
  role: string
  color: AvatarColor
  joinedDaysAgo: number
  tenureYears: number
  birthdayThisMonth: boolean
  attendance: Attendance
  leave?: string
  ext: string
  email: string
  privatePhone: string
  seat: string
  edu: string
  school: string
  prevExp: string
  household: string // 戶籍地
  residence: string // 居住地
  raise: string
  reviews: { year: number; grade: string }[] // 近 3 年考核
}

const PEOPLE: Person[] = [
  { id: 'p1', name: '陳雅婷', orgId: 'plan1', gender: 'F', level: 6, reportLevel: 1, role: '企劃一部主管', color: 'blue', joinedDaysAgo: 620, tenureYears: 3, birthdayThisMonth: false, attendance: '正常', ext: '#2201', email: 'yating.chen@33q.com', privatePhone: '0912-345-101', seat: '12F-A01', edu: '碩士', school: '政大 廣告所', prevExp: '奧美 資深企劃', household: '台北市大安區', residence: '台北市信義區', raise: '+6%', reviews: [{ year: 2024, grade: 'A' }, { year: 2025, grade: 'A' }, { year: 2026, grade: 'A+' }] },
  { id: 'p2', name: '林建宏', orgId: 'plan1', gender: 'M', level: 3, reportLevel: 2, role: '企劃專員', color: 'green', joinedDaysAgo: 20, tenureYears: 0, birthdayThisMonth: false, attendance: '遲到', ext: '#2202', email: 'jianhong.lin@33q.com', privatePhone: '0912-345-102', seat: '12F-A02', edu: '學士', school: '台大 工管系', prevExp: '應屆畢業', household: '新北市板橋區', residence: '台北市中正區', raise: '+3%', reviews: [{ year: 2024, grade: '—' }, { year: 2025, grade: '—' }, { year: 2026, grade: 'B+' }] },
  { id: 'p3', name: '王思穎', orgId: 'plan1', gender: 'F', level: 3, reportLevel: 2, role: '企劃專員', color: 'orange', joinedDaysAgo: 75, tenureYears: 0, birthdayThisMonth: true, attendance: '請假', leave: '特休 6/22–6/24', ext: '#2203', email: 'siying.wang@33q.com', privatePhone: '0912-345-103', seat: '12F-A03', edu: '學士', school: '師大 大傳系', prevExp: '應屆畢業', household: '桃園市中壢區', residence: '台北市文山區', raise: '+2%', reviews: [{ year: 2024, grade: '—' }, { year: 2025, grade: '—' }, { year: 2026, grade: 'B' }] },
  { id: 'p4', name: '張哲瑋', orgId: 'plan1', gender: 'M', level: 5, reportLevel: 2, role: '資深企劃', color: 'purple', joinedDaysAgo: 900, tenureYears: 4, birthdayThisMonth: true, attendance: '正常', ext: '#2204', email: 'jhewei.chang@33q.com', privatePhone: '0912-345-104', seat: '12F-A04', edu: '碩士', school: '交大 傳科所', prevExp: '智威湯遜 企劃副理', household: '台中市西屯區', residence: '台北市松山區', raise: '+5%', reviews: [{ year: 2024, grade: 'A' }, { year: 2025, grade: 'A-' }, { year: 2026, grade: 'A' }] },
  { id: 'p5', name: '李佩珊', orgId: 'plan1', gender: 'F', level: 4, reportLevel: 2, role: '企劃專員', color: 'red', joinedDaysAgo: 200, tenureYears: 1, birthdayThisMonth: false, attendance: '正常', ext: '#2205', email: 'peishan.li@33q.com', privatePhone: '0912-345-105', seat: '12F-A05', edu: '學士', school: '輔大 廣告系', prevExp: '電通 企劃', household: '台北市萬華區', residence: '新北市新莊區', raise: '+4%', reviews: [{ year: 2024, grade: 'B+' }, { year: 2025, grade: 'B+' }, { year: 2026, grade: 'A-' }] },
  { id: 'p6', name: '黃冠霖', orgId: 'plan2', gender: 'M', level: 6, reportLevel: 1, role: '企劃二部主管', color: 'indigo', joinedDaysAgo: 1500, tenureYears: 6, birthdayThisMonth: false, attendance: '正常', ext: '#2211', email: 'guanlin.huang@33q.com', privatePhone: '0912-345-111', seat: '12F-B01', edu: '碩士', school: '台科大 企管所', prevExp: '李奧貝納 企劃經理', household: '台北市中山區', residence: '台北市中山區', raise: '+7%', reviews: [{ year: 2024, grade: 'A' }, { year: 2025, grade: 'A+' }, { year: 2026, grade: 'A' }] },
  { id: 'p7', name: '吳孟儒', orgId: 'plan2', gender: 'M', level: 2, reportLevel: 2, role: '企劃專員', color: 'amber', joinedDaysAgo: 15, tenureYears: 0, birthdayThisMonth: false, attendance: '正常', ext: '#2212', email: 'mengru.wu@33q.com', privatePhone: '0912-345-112', seat: '12F-B02', edu: '學士', school: '世新 公廣系', prevExp: '應屆畢業', household: '高雄市左營區', residence: '台北市大同區', raise: '—', reviews: [{ year: 2024, grade: '—' }, { year: 2025, grade: '—' }, { year: 2026, grade: 'B' }] },
  { id: 'p8', name: '蔡宜蓉', orgId: 'plan2', gender: 'F', level: 4, reportLevel: 2, role: '資深企劃', color: 'magenta', joinedDaysAgo: 400, tenureYears: 2, birthdayThisMonth: true, attendance: '正常', ext: '#2213', email: 'yijung.tsai@33q.com', privatePhone: '0912-345-113', seat: '12F-B03', edu: '碩士', school: '中山 傳管所', prevExp: '陽獅 企劃', household: '台南市東區', residence: '台北市內湖區', raise: '+5%', reviews: [{ year: 2024, grade: 'B+' }, { year: 2025, grade: 'A-' }, { year: 2026, grade: 'A-' }] },
  { id: 'p9', name: '周子瑜', orgId: 'design', gender: 'F', level: 6, reportLevel: 1, role: '設計部主任', color: 'blue', joinedDaysAgo: 1100, tenureYears: 5, birthdayThisMonth: false, attendance: '正常', ext: '#2221', email: 'ziyu.chou@33q.com', privatePhone: '0912-345-121', seat: '11F-C01', edu: '碩士', school: '台科大 設計所', prevExp: 'IDEO 資深設計', household: '台北市士林區', residence: '台北市士林區', raise: '+6%', reviews: [{ year: 2024, grade: 'A' }, { year: 2025, grade: 'A' }, { year: 2026, grade: 'A' }] },
  { id: 'p10', name: '鄭家豪', orgId: 'design', gender: 'M', level: 3, reportLevel: 2, role: 'UI 設計師', color: 'green', joinedDaysAgo: 60, tenureYears: 0, birthdayThisMonth: false, attendance: '缺勤警示', leave: '連續 2 日未到、未請假', ext: '#2222', email: 'jiahao.cheng@33q.com', privatePhone: '0912-345-122', seat: '11F-C02', edu: '學士', school: '台藝大 視傳系', prevExp: '應屆畢業', household: '宜蘭縣羅東鎮', residence: '新北市三重區', raise: '+3%', reviews: [{ year: 2024, grade: '—' }, { year: 2025, grade: '—' }, { year: 2026, grade: 'B+' }] },
  { id: 'p11', name: '許雅文', orgId: 'design', gender: 'F', level: 4, reportLevel: 2, role: 'UX 設計師', color: 'orange', joinedDaysAgo: 320, tenureYears: 1, birthdayThisMonth: false, attendance: '正常', ext: '#2223', email: 'yawen.hsu@33q.com', privatePhone: '0912-345-123', seat: '11F-C03', edu: '碩士', school: '交大 應藝所', prevExp: 'LINE UX 設計', household: '台北市北投區', residence: '台北市北投區', raise: '+4%', reviews: [{ year: 2024, grade: 'B+' }, { year: 2025, grade: 'A-' }, { year: 2026, grade: 'A-' }] },
  { id: 'p12', name: '潘威廷', orgId: 'design', gender: 'M', level: 3, reportLevel: 2, role: '視覺設計', color: 'purple', joinedDaysAgo: 28, tenureYears: 0, birthdayThisMonth: true, attendance: '正常', ext: '#2224', email: 'weiting.pan@33q.com', privatePhone: '0912-345-124', seat: '11F-C04', edu: '學士', school: '實踐 媒傳系', prevExp: '應屆畢業', household: '新竹市東區', residence: '台北市大安區', raise: '+2%', reviews: [{ year: 2024, grade: '—' }, { year: 2025, grade: '—' }, { year: 2026, grade: 'B' }] },
]

/* ──────────────────────────── 條件過濾器(篩列)──────────────────────────── */

type Cond = 'all' | 'newMonth' | 'newQuarter' | 'birthday' | 'attention'
const CONDS: { id: Cond; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'newMonth', label: '本月新進' },
  { id: 'newQuarter', label: '本季新進' },
  { id: 'birthday', label: '本月壽星' },
  { id: 'attention', label: '出勤異常' },
]
const condLabel = (c: Cond) => CONDS.find((x) => x.id === c)?.label ?? c
const matchesCond = (p: Person, c: Cond) => {
  switch (c) {
    case 'newMonth':
      return p.joinedDaysAgo <= 30
    case 'newQuarter':
      return p.joinedDaysAgo <= 90
    case 'birthday':
      return p.birthdayThisMonth
    case 'attention':
      return p.attendance !== '正常'
    default:
      return true
  }
}

// 狀態 / 等第 標籤
const attendanceTag = (a: Attendance): ReactNode => {
  if (a === '正常') return null
  const color = a === '缺勤警示' ? 'red' : a === '遲到' ? 'amber' : 'blue'
  return <Tag color={color} size="sm">{a}</Tag>
}
function statusTags(p: Person): ReactNode[] {
  const tags: ReactNode[] = []
  const att = attendanceTag(p.attendance)
  if (att) tags.push(<span key="att">{att}</span>)
  if (p.joinedDaysAgo <= 30) tags.push(<Tag key="nm" color="blue" size="sm">本月新進</Tag>)
  else if (p.tenureYears === 0) tags.push(<Tag key="pb" color="indigo" size="sm">試用期</Tag>)
  if (p.birthdayThisMonth) tags.push(<Tag key="bd" color="magenta" size="sm">壽星</Tag>)
  return tags
}
const gradeColor = (g: string): 'green' | 'blue' | 'amber' | 'neutral' =>
  g.startsWith('A') ? 'green' : g.startsWith('B') ? 'blue' : g === '—' ? 'neutral' : 'amber'

// 職等分桶(比較卡 / 顯示用)
const levelBand = (lv: number): '資深' | '中階' | '初階' => (lv >= 5 ? '資深' : lv >= 4 ? '中階' : '初階')

/* ──────────────────────────── 子組織比較卡(Journey A + C)──────────────────────────── */

function GenderBar({ people }: { people: Person[] }) {
  const m = people.filter((p) => p.gender === 'M').length
  const f = people.length - m
  const mPct = people.length ? (m / people.length) * 100 : 0
  return (
    <div className="flex flex-col gap-[4px]">
      <div className="flex h-[8px] overflow-hidden rounded-full bg-neutral-3">
        <div style={{ width: `${mPct}%`, backgroundColor: 'var(--color-blue-9)' }} />
        <div style={{ width: `${100 - mPct}%`, backgroundColor: 'var(--color-magenta-9)' }} />
      </div>
      <div className="flex justify-between text-caption text-fg-secondary tabular-nums">
        <span>男 {m}</span>
        <span>女 {f}</span>
      </div>
    </div>
  )
}

function SubOrgCompareCard({ org, onDrill }: { org: Org; onDrill: () => void }) {
  const people = useMemo(() => PEOPLE.filter((p) => subtreeIds(org.id).includes(p.orgId)), [org.id])
  const bands = { 資深: 0, 中階: 0, 初階: 0 }
  people.forEach((p) => (bands[levelBand(p.level)] += 1))
  return (
    <button
      type="button"
      onClick={onDrill}
      className="flex flex-col gap-[var(--layout-space-tight)] rounded-lg border border-divider bg-surface p-[var(--layout-space-loose)] text-left transition-colors hover:border-primary hover:bg-neutral-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="flex items-center justify-between">
        <span className="text-body-lg font-semibold text-foreground">{org.name}</span>
        <span className="text-h3 tabular-nums text-foreground">{people.length}<span className="text-caption text-fg-secondary"> 人</span></span>
      </div>
      <GenderBar people={people} />
      <div className="flex gap-[8px] text-caption text-fg-secondary tabular-nums">
        <span>資深 {bands['資深']}</span>
        <span className="opacity-40">·</span>
        <span>中階 {bands['中階']}</span>
        <span className="opacity-40">·</span>
        <span>初階 {bands['初階']}</span>
      </div>
    </button>
  )
}

/* ──────────────────────────── 內容分類 tab 欄位(換欄位)──────────────────────────── */

type ContentTab = 'key' | 'contact' | 'review' | 'background'
const CONTENT_TABS: { id: ContentTab; label: string }[] = [
  { id: 'key', label: '重要資訊' },
  { id: 'contact', label: '聯絡方式' },
  { id: 'review', label: '考核調薪' },
  { id: 'background', label: '背景 / 戶籍' },
]
type Column = { header: string; cell: (p: Person) => ReactNode; num?: boolean }

const NAME_COL: Column = {
  header: '員工',
  cell: (p) => (
    <div className="flex items-center gap-[var(--layout-space-tight)]">
      <Avatar size={32} alt={p.name} color={p.color} />
      <div className="min-w-0">
        <div className="font-medium text-foreground truncate">{p.name}</div>
        <div className="text-caption text-fg-muted truncate">{orgName(p.orgId)}</div>
      </div>
    </div>
  ),
}
const reviewCell = (p: Person, year: number): ReactNode => {
  const g = p.reviews.find((r) => r.year === year)?.grade ?? '—'
  return <Tag color={gradeColor(g)} size="sm">{g}</Tag>
}
const COLUMNS: Record<ContentTab, Column[]> = {
  key: [
    NAME_COL,
    { header: '職稱', cell: (p) => p.role },
    { header: '到職', cell: (p) => `${p.joinedDaysAgo} 天前`, num: true },
    { header: '年資', cell: (p) => `${p.tenureYears} 年`, num: true },
    { header: '狀態', cell: (p) => <div className="flex flex-wrap gap-[4px]">{statusTags(p)}</div> },
  ],
  contact: [
    NAME_COL,
    { header: '分機', cell: (p) => p.ext, num: true },
    { header: '公司 Email', cell: (p) => p.email },
    { header: '私人手機', cell: (p) => p.privatePhone, num: true },
    { header: '座位', cell: (p) => p.seat },
  ],
  review: [
    NAME_COL,
    { header: '2024', cell: (p) => reviewCell(p, 2024) },
    { header: '2025', cell: (p) => reviewCell(p, 2025) },
    { header: '2026', cell: (p) => reviewCell(p, 2026) },
    { header: '職等', cell: (p) => `P${p.level}`, num: true },
    { header: '建議調薪', cell: (p) => p.raise, num: true },
  ],
  background: [
    NAME_COL,
    { header: '最高學歷', cell: (p) => p.edu },
    { header: '畢業校系', cell: (p) => p.school },
    { header: '戶籍地', cell: (p) => p.household },
    { header: '居住地', cell: (p) => p.residence },
  ],
}

function RosterTable({ columns, rows, onOpen }: { columns: Column[]; rows: Person[]; onOpen: (p: Person) => void }) {
  if (rows.length === 0) {
    return <div className="py-[var(--layout-space-loose)] text-center text-body text-fg-muted">此條件下目前沒有符合的人員。</div>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-body">
        <thead>
          <tr className="border-b border-divider text-left text-caption font-medium text-fg-secondary">
            {columns.map((c) => (
              <th key={c.header} className="whitespace-nowrap py-[var(--layout-space-tight)] pr-[var(--layout-space-loose)]">{c.header}</th>
            ))}
            <th className="py-[var(--layout-space-tight)]" aria-label="操作" />
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr
              key={p.id}
              onClick={() => onOpen(p)}
              className="cursor-pointer border-b border-divider last:border-0 hover:bg-neutral-hover"
            >
              {columns.map((c, i) => (
                <td
                  key={c.header}
                  className={`py-[var(--layout-space-tight)] pr-[var(--layout-space-loose)] align-middle ${i > 0 ? 'text-fg-secondary' : ''} ${c.num ? 'tabular-nums' : ''}`}
                >
                  {c.cell(p)}
                </td>
              ))}
              <td className="py-[var(--layout-space-tight)] text-right">
                <span className="text-caption text-primary">查看檔案 ›</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ──────────────────────────── 個人檔案 Dialog(Journey B)──────────────────────────── */

function Field({ label, value, strong }: { label: string; value: ReactNode; strong?: boolean }) {
  return (
    <div className="flex gap-[var(--layout-space-tight)] py-[6px]">
      <span className="w-[84px] shrink-0 text-caption text-fg-muted">{label}</span>
      <span className={`text-body ${strong ? 'font-medium text-foreground' : 'text-fg-secondary'}`}>{value}</span>
    </div>
  )
}

function PersonDialog({ person, onClose }: { person: Person | null; onClose: () => void }) {
  return (
    <Dialog open={person !== null} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-[560px]">
        {person && (
          <>
            <DialogHeader>
              <DialogTitle>
                <div className="flex items-center gap-[var(--layout-space-tight)]">
                  <Avatar size={40} alt={person.name} color={person.color} />
                  <div>
                    <div className="text-body-lg font-semibold text-foreground">{person.name}</div>
                    <div className="text-caption text-fg-secondary">{person.role} · {orgName(person.orgId)} · P{person.level}</div>
                  </div>
                </div>
              </DialogTitle>
            </DialogHeader>
            <DialogBody>
              <div className="flex flex-col gap-[var(--layout-space-loose)]">
                {/* 狀態警示 */}
                {person.attendance !== '正常' && (
                  <div className="flex items-start gap-[8px] rounded-md border border-divider bg-surface p-[var(--layout-space-tight)]">
                    <TriangleAlert size={16} className={person.attendance === '缺勤警示' ? 'text-error' : 'text-warning'} />
                    <div className="text-body">
                      <span className="font-medium text-foreground">出勤狀態:{person.attendance}</span>
                      {person.leave && <div className="text-caption text-fg-secondary">{person.leave}</div>}
                    </div>
                  </div>
                )}

                {/* 聯絡 */}
                <section>
                  <h4 className="mb-[4px] flex items-center gap-[6px] text-caption font-semibold text-fg-secondary"><Phone size={13} /> 聯絡方式</h4>
                  <Field label="公司分機" value={person.ext} />
                  <Field label="公司 Email" value={person.email} />
                  <Field label="私人手機" value={person.privatePhone} strong />
                  <Field label="座位" value={person.seat} />
                </section>

                <Separator />

                {/* 歷年考核 */}
                <section>
                  <h4 className="mb-[6px] text-caption font-semibold text-fg-secondary">歷年考核</h4>
                  <div className="flex gap-[var(--layout-space-loose)]">
                    {person.reviews.map((r) => (
                      <div key={r.year} className="flex flex-col items-center gap-[4px]">
                        <span className="text-caption text-fg-muted tabular-nums">{r.year}</span>
                        <Tag color={gradeColor(r.grade)} size="sm">{r.grade}</Tag>
                      </div>
                    ))}
                    <div className="flex flex-col items-center gap-[4px]">
                      <span className="text-caption text-fg-muted">建議調薪</span>
                      <span className="text-body font-medium text-foreground tabular-nums">{person.raise}</span>
                    </div>
                  </div>
                </section>

                <Separator />

                {/* 個資 / 戶籍 */}
                <section>
                  <h4 className="mb-[4px] flex items-center gap-[6px] text-caption font-semibold text-fg-secondary"><MapPin size={13} /> 個資 / 戶籍</h4>
                  <Field label="戶籍地" value={person.household} strong />
                  <Field label="居住地" value={person.residence} />
                </section>

                <Separator />

                {/* 學經歷 */}
                <section>
                  <h4 className="mb-[4px] text-caption font-semibold text-fg-secondary">學經歷</h4>
                  <Field label="最高學歷" value={person.edu} />
                  <Field label="畢業校系" value={person.school} />
                  <Field label="前一份經歷" value={person.prevExp} />
                </section>

                <p className="text-caption text-fg-muted">※ 私人手機、戶籍地為敏感個資,原型展示用;正式系統應限權限存取並留存紀錄。</p>
              </div>
            </DialogBody>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

/* ──────────────────────────── 組織選擇下拉(TreeView 風格)──────────────────────────── */

function OrgTreeItem({ org, depth, anchored, onPick }: { org: Org; depth: number; anchored: OrgId; onPick: (id: OrgId) => void }) {
  const kids = childrenOf(org.id)
  return (
    <>
      <button
        type="button"
        onClick={() => onPick(org.id)}
        className={`flex w-full items-center gap-[6px] rounded-md py-[6px] pr-[var(--layout-space-tight)] text-left text-body transition-colors hover:bg-neutral-hover ${anchored === org.id ? 'bg-primary-subtle text-primary font-medium' : 'text-foreground'}`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        <Building2 size={14} className="shrink-0 opacity-60" />
        <span className="truncate">{org.name}</span>
      </button>
      {kids.map((k) => (
        <OrgTreeItem key={k.id} org={k} depth={depth + 1} anchored={anchored} onPick={onPick} />
      ))}
    </>
  )
}

/* ──────────────────────────── 人員搜尋(全組織)──────────────────────────── */

function PersonSearch({ onPick }: { onPick: (p: Person) => void }) {
  const [q, setQ] = useState('')
  const matches = useMemo(() => (q.trim() ? PEOPLE.filter((p) => p.name.includes(q.trim())).slice(0, 6) : []), [q])
  return (
    <div className="relative w-[240px]">
      <Input startIcon={Search} size="sm" placeholder="搜尋員工姓名…" aria-label="搜尋員工" value={q} onChange={(e) => setQ(e.target.value)} className="rounded-full" />
      {matches.length > 0 && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 overflow-hidden rounded-md border border-border bg-surface-raised shadow-[var(--elevation-200)]">
          {matches.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => { onPick(p); setQ('') }}
              className="flex w-full items-center gap-[var(--layout-space-tight)] px-[var(--layout-space-tight)] py-[6px] text-left transition-colors hover:bg-neutral-hover"
            >
              <Avatar size={24} alt={p.name} color={p.color} />
              <span className="text-body text-foreground">{p.name}</span>
              <span className="ml-auto text-caption text-fg-muted">{orgName(p.orgId)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ──────────────────────────── 主畫面 ──────────────────────────── */

type Pill = { id: string; label: string; people: Person[] }

export function ManagerAdminApp({ onBack }: { onBack: () => void }) {
  const [anchor, setAnchor] = useState<OrgId>('prod') // 錨定組織,預設王經理的產品處
  const [orgOpen, setOrgOpen] = useState(false)
  const [pillId, setPillId] = useState<string>('level1') // 預設第一層人員
  const [cond, setCond] = useState<Cond>('all')
  const [tab, setTab] = useState<ContentTab>('key')
  const [selected, setSelected] = useState<Person | null>(null)

  const scoped = useMemo(() => PEOPLE.filter((p) => subtreeIds(anchor).includes(p.orgId)), [anchor])
  const subOrgs = childrenOf(anchor)

  // 膠囊:第一層人員 / 第二層人員 / 各直屬子組織
  const pills: Pill[] = useMemo(() => {
    const base: Pill[] = [
      { id: 'level1', label: '第一層人員', people: scoped.filter((p) => p.reportLevel === 1) },
      { id: 'level2', label: '第二層人員', people: scoped.filter((p) => p.reportLevel === 2) },
    ]
    const orgPills = subOrgs.map((o) => ({
      id: `org:${o.id}`,
      label: o.name,
      people: PEOPLE.filter((p) => subtreeIds(o.id).includes(p.orgId)),
    }))
    return [...base, ...orgPills]
  }, [scoped, subOrgs])

  const activePill = pills.find((p) => p.id === pillId) ?? pills[0]
  const rows = useMemo(() => activePill.people.filter((p) => matchesCond(p, cond)), [activePill, cond])

  return (
    <div className="min-h-screen min-w-[1000px] bg-canvas">
      {/* 頁首(與 33q 一致的 chrome)*/}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-[var(--layout-space-loose)] border-b border-border bg-surface px-[40px]">
        <Button variant="text" size="sm" startIcon={ArrowLeft} onClick={onBack}>返回員工入口</Button>
        <span className="text-body-lg font-semibold text-foreground">主管管理系統</span>
        {/* 組織選擇 */}
        <Popover open={orgOpen} onOpenChange={setOrgOpen}>
          <PopoverTrigger asChild>
            <Button variant="secondary" size="sm" startIcon={Building2} endIcon={ChevronDown}>組織：{orgName(anchor)}</Button>
          </PopoverTrigger>
          <PopoverContent className="w-[240px] p-[var(--layout-space-tight)]">
            <div className="mb-[4px] px-[8px] text-caption text-fg-muted">選擇要檢視的組織</div>
            <OrgTreeItem org={ORGS.find((o) => o.parentId === null)!} depth={0} anchored={anchor} onPick={(id) => { setAnchor(id); setPillId('level1'); setOrgOpen(false) }} />
          </PopoverContent>
        </Popover>
        <div className="ml-auto">
          <PersonSearch onPick={(p) => setSelected(p)} />
        </div>
      </header>

      <main className="mx-auto flex max-w-[1600px] flex-col gap-[20px] px-[40px] py-[var(--layout-space-loose)]">
        {/* 子組織比較(Journey A 概覽 + Journey C 比較)*/}
        {subOrgs.length > 0 && (
          <section>
            <h2 className="mb-[var(--layout-space-tight)] text-body-lg font-semibold text-foreground">
              {orgName(anchor)} · 子組織比較
            </h2>
            <div className="grid gap-[20px]" style={{ gridTemplateColumns: `repeat(${Math.min(subOrgs.length, 4)}, minmax(0, 1fr))` }}>
              {subOrgs.map((o) => (
                <SubOrgCompareCard key={o.id} org={o} onDrill={() => { setPillId(`org:${o.id}`); setCond('all') }} />
              ))}
            </div>
          </section>
        )}

        {/* 膠囊 tab(含人數)*/}
        <div className="flex flex-wrap items-center gap-[8px]">
          {pills.map((p) => {
            const on = p.id === pillId
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => { setPillId(p.id); setCond('all') }}
                aria-pressed={on}
                className={`rounded-full border px-[var(--layout-space-loose)] py-[6px] text-body transition-colors ${on ? 'border-primary bg-primary-subtle font-medium text-primary' : 'border-divider bg-surface text-fg-secondary hover:border-primary hover:text-foreground'}`}
              >
                {p.label}
                <span className={`ml-[6px] tabular-nums ${on ? 'text-primary' : 'text-fg-muted'}`}>{p.people.length}</span>
              </button>
            )
          })}
        </div>

        {/* 人員清單卡:當前顯示 + 內容過濾器 + 內容分類 tab + 表格 */}
        <section className="rounded-lg border border-border bg-surface-raised shadow-[var(--elevation-200)]">
          <div className="flex flex-wrap items-center justify-between gap-[var(--layout-space-tight)] border-b border-divider px-[var(--layout-space-loose)] py-[var(--layout-space-tight)]">
            <div className="flex items-baseline gap-[8px]">
              <span className="text-body-lg font-semibold text-foreground">{orgName(anchor)} · {activePill.label} · {condLabel(cond)}</span>
              <span className="text-caption text-fg-secondary tabular-nums">{rows.length} 人</span>
            </div>
            <SegmentedControl size="sm" value={cond} onValueChange={(v) => setCond(v as Cond)}>
              {CONDS.map((c) => (
                <SegmentedControlItem key={c.id} value={c.id}>{c.label}</SegmentedControlItem>
              ))}
            </SegmentedControl>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as ContentTab)}>
            <div className="px-[var(--layout-space-loose)] pt-[var(--layout-space-tight)]">
              <TabsList>
                {CONTENT_TABS.map((t) => (
                  <TabsTrigger key={t.id} value={t.id}>{t.label}</TabsTrigger>
                ))}
              </TabsList>
            </div>
            {CONTENT_TABS.map((t) => (
              <TabsContent key={t.id} value={t.id} className="px-[var(--layout-space-loose)] pb-[var(--layout-space-loose)] pt-[var(--layout-space-tight)]">
                <RosterTable columns={COLUMNS[t.id]} rows={rows} onOpen={(p) => setSelected(p)} />
              </TabsContent>
            ))}
          </Tabs>
        </section>
      </main>

      <PersonDialog person={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
