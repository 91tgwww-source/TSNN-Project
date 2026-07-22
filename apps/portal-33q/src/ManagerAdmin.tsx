// 主管管理系統 — 人員名單(從 33q 員工入口的「主管管理」app 圖示點進來,in-app 全螢幕檢視)
//
// 設計主軸(2026-07 user 拍板):兩個「獨立的軸」各自保留狀態,summary 不再自帶過濾邏輯:
//   - WHO 軸(部門)= 「查看部門」快速篩選器,預設停在主管「直屬團隊」。切部門不重置條件。
//   - WHAT 軸(條件)= 「當前顯示」bar 上的單選過濾器,= 唯一狀態真相。預設「全部人員」。
//   - summary 卡片:segment 型(新進/壽星)可點 = 設定 WHAT 過濾器(selected 只反映在過濾器一處);
//     純聚合(總人數/平均年資)純展示不可點。summary 數值跟目前部門即時重算 → 數字與名單永遠對得上。
//
// 由 portal-33q 的 App 以 view 狀態掛載;TooltipProvider 由外層 App 提供,這裡不重複包。
// SSOT 鐵律:只 import `@qijenchen/design-system` public exports,禁修改 DS source。
// 人員表格用語意 <table> + DS token(DataTable 是 spreadsheet 級重型 grid,read-only roster 用語意 table 較貼切)。

import { useState, useMemo, type ReactElement } from 'react'
import {
  AppShell,
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  ChromeHeader,
  Avatar,
  ItemAvatar,
  Button,
  SegmentedControl,
  SegmentedControlItem,
  Tag,
} from '@qijenchen/design-system'
import { LayoutDashboard, Users, FileText, BarChart3, Settings, Download, ArrowLeft } from 'lucide-react'

/* ──────────────────────────── Mock data ──────────────────────────── */

type DeptId = 'plan1' | 'plan2' | 'design' | 'eng'
const DEPTS: { id: DeptId; label: string }[] = [
  { id: 'plan1', label: '企劃一部' },
  { id: 'plan2', label: '企劃二部' },
  { id: 'design', label: '設計部' },
  { id: 'eng', label: '工程部' },
]
const deptLabel = (id: DeptId) => DEPTS.find((d) => d.id === id)?.label ?? id

type AvatarColor = 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'indigo' | 'amber' | 'magenta'
type Person = {
  id: string
  name: string
  deptId: DeptId
  direct: boolean // 是否為本主管直屬
  role: string
  color: AvatarColor
  joinedDaysAgo: number // 到職天數
  birthdayThisMonth: boolean
  tenureYears: number
}

// direct = 本主管直屬團隊(可跨部門);其餘為各部門一般成員
const PEOPLE: Person[] = [
  { id: 'p1', name: '陳雅婷', deptId: 'plan1', direct: true, role: '資深企劃', color: 'blue', joinedDaysAgo: 620, birthdayThisMonth: false, tenureYears: 3 },
  { id: 'p2', name: '林建宏', deptId: 'plan1', direct: true, role: '企劃專員', color: 'green', joinedDaysAgo: 20, birthdayThisMonth: false, tenureYears: 0 },
  { id: 'p3', name: '王思穎', deptId: 'plan1', direct: true, role: '企劃專員', color: 'orange', joinedDaysAgo: 75, birthdayThisMonth: true, tenureYears: 0 },
  { id: 'p4', name: '張哲瑋', deptId: 'plan1', direct: false, role: '資深企劃', color: 'purple', joinedDaysAgo: 900, birthdayThisMonth: true, tenureYears: 4 },
  { id: 'p5', name: '李佩珊', deptId: 'plan1', direct: true, role: '企劃專員', color: 'red', joinedDaysAgo: 200, birthdayThisMonth: false, tenureYears: 1 },
  { id: 'p6', name: '黃冠霖', deptId: 'plan2', direct: false, role: '企劃經理', color: 'indigo', joinedDaysAgo: 1500, birthdayThisMonth: false, tenureYears: 6 },
  { id: 'p7', name: '吳孟儒', deptId: 'plan2', direct: false, role: '企劃專員', color: 'amber', joinedDaysAgo: 15, birthdayThisMonth: false, tenureYears: 0 },
  { id: 'p8', name: '蔡宜蓉', deptId: 'plan2', direct: false, role: '資深企劃', color: 'magenta', joinedDaysAgo: 400, birthdayThisMonth: true, tenureYears: 2 },
  { id: 'p9', name: '周子瑜', deptId: 'design', direct: false, role: '設計主任', color: 'blue', joinedDaysAgo: 1100, birthdayThisMonth: false, tenureYears: 5 },
  { id: 'p10', name: '鄭家豪', deptId: 'design', direct: true, role: 'UI 設計師', color: 'green', joinedDaysAgo: 60, birthdayThisMonth: false, tenureYears: 0 },
  { id: 'p11', name: '許雅文', deptId: 'design', direct: false, role: 'UX 設計師', color: 'orange', joinedDaysAgo: 320, birthdayThisMonth: false, tenureYears: 1 },
  { id: 'p12', name: '潘威廷', deptId: 'design', direct: false, role: '視覺設計', color: 'purple', joinedDaysAgo: 28, birthdayThisMonth: true, tenureYears: 0 },
  { id: 'p13', name: '劉俊傑', deptId: 'eng', direct: false, role: '前端工程師', color: 'red', joinedDaysAgo: 800, birthdayThisMonth: false, tenureYears: 3 },
  { id: 'p14', name: '楊承恩', deptId: 'eng', direct: true, role: '後端工程師', color: 'indigo', joinedDaysAgo: 25, birthdayThisMonth: false, tenureYears: 0 },
  { id: 'p15', name: '賴詩涵', deptId: 'eng', direct: false, role: '全端工程師', color: 'amber', joinedDaysAgo: 500, birthdayThisMonth: true, tenureYears: 2 },
  { id: 'p16', name: '郭柏翰', deptId: 'eng', direct: false, role: '工程經理', color: 'magenta', joinedDaysAgo: 2000, birthdayThisMonth: false, tenureYears: 8 },
]

/* ──── WHO 軸(部門)+ WHAT 軸(條件)—— 兩軸各自獨立 ──── */

type Scope = 'direct' | DeptId
const SCOPES: { id: Scope; label: string }[] = [{ id: 'direct', label: '直屬團隊' }, ...DEPTS]
const scopeLabel = (s: Scope) => SCOPES.find((x) => x.id === s)?.label ?? s
const inScope = (p: Person, s: Scope) => (s === 'direct' ? p.direct : p.deptId === s)

type Cond = 'all' | 'newMonth' | 'newQuarter' | 'birthday'
const CONDS: { id: Cond; label: string }[] = [
  { id: 'all', label: '全部人員' },
  { id: 'newMonth', label: '本月新進' },
  { id: 'newQuarter', label: '本季新進' },
  { id: 'birthday', label: '本月壽星' },
]
const condLabel = (c: Cond) => CONDS.find((x) => x.id === c)?.label ?? c
const matchesCond = (p: Person, c: Cond) => {
  switch (c) {
    case 'newMonth':
      return p.joinedDaysAgo <= 30
    case 'newQuarter':
      return p.joinedDaysAgo <= 90 // 本季涵蓋本月
    case 'birthday':
      return p.birthdayThisMonth
    default:
      return true
  }
}

// 人員身上的標籤(表格用)
function personTags(p: Person): ReactElement[] {
  const tags: ReactElement[] = []
  if (matchesCond(p, 'newMonth')) tags.push(<Tag key="nm" color="blue" size="sm">本月新進</Tag>)
  else if (matchesCond(p, 'newQuarter')) tags.push(<Tag key="nq" color="indigo" size="sm">本季新進</Tag>)
  if (p.birthdayThisMonth) tags.push(<Tag key="bd" color="magenta" size="sm">壽星</Tag>)
  return tags
}

/* ──────────────────────────── Sidebar / Header ──────────────────────────── */

const NAV = [
  { id: 'overview', label: '團隊總覽', icon: LayoutDashboard },
  { id: 'roster', label: '人員名單', icon: Users },
  { id: 'review', label: '考核管理', icon: FileText },
  { id: 'reports', label: '報表', icon: BarChart3 },
  { id: 'settings', label: '設定', icon: Settings },
] as const

function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 min-w-0 group-data-[collapsible=icon]:justify-center">
          <Avatar alt="主管管理台" size={24} shape="square" color="blue" solid />
          <span className="text-body-lg font-medium truncate group-data-[collapsible=icon]:hidden">主管管理台</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map(({ id, label, icon }) => (
                <SidebarMenuItem key={id}>
                  <SidebarMenuButton id={id} startIcon={icon} tooltip={label}>
                    {label}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <div role="group" aria-label="當前使用者">
                <ItemAvatar alt="王經理" color="blue" />
                <span data-sidebar="menu-label" className="min-w-0 flex-1 truncate">王經理</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

function PageHeader({
  title,
  onBack,
  rightSlot,
}: {
  title: string
  onBack: () => void
  rightSlot?: ReactElement<any, any>
}) {
  return (
    <ChromeHeader className="bg-surface">
      <SidebarTrigger />
      <Button variant="text" size="sm" startIcon={ArrowLeft} onClick={onBack}>
        返回員工入口
      </Button>
      <h1 className="text-body-lg font-medium flex-1 truncate">{title}</h1>
      {rightSlot}
    </ChromeHeader>
  )
}

/* ──────────────────────────── Summary tiles ──────────────────────────── */

// 純聚合:純展示、不可點
function AggregateTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-divider bg-surface p-[var(--layout-space-loose)]">
      <div className="text-caption text-fg-secondary">{label}</div>
      <div className="mt-[4px] text-h3 tabular-nums text-foreground">{value}</div>
    </div>
  )
}

// segment 型:可點 = 設定 WHAT 過濾器;active(cond 命中)高亮
function SegmentTile({
  label,
  value,
  active,
  onClick,
}: {
  label: string
  value: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-lg border p-[var(--layout-space-loose)] text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        active
          ? 'border-primary bg-primary-subtle'
          : 'border-divider bg-surface hover:border-primary hover:bg-neutral-hover'
      }`}
    >
      <div className={`text-caption ${active ? 'text-primary' : 'text-fg-secondary'}`}>{label}</div>
      <div className={`mt-[4px] text-h3 tabular-nums ${active ? 'text-primary' : 'text-foreground'}`}>{value}</div>
      <div className={`mt-[2px] text-caption ${active ? 'text-primary' : 'text-fg-muted'}`}>
        {active ? '篩選中' : '點擊篩選'}
      </div>
    </button>
  )
}

/* ──────────────────────────── Roster page ──────────────────────────── */

function ManagerAdminPage() {
  const [scope, setScope] = useState<Scope>('direct') // WHO 軸,預設直屬團隊
  const [cond, setCond] = useState<Cond>('all') // WHAT 軸 = 唯一狀態真相

  // summary 母體 = 目前部門 scope(跟部門即時重算)
  const scoped = useMemo(() => PEOPLE.filter((p) => inScope(p, scope)), [scope])
  // 表格 = scope ∩ 條件
  const rows = useMemo(() => scoped.filter((p) => matchesCond(p, cond)), [scoped, cond])

  const count = (c: Cond) => scoped.filter((p) => matchesCond(p, c)).length
  const avgTenure = scoped.length ? (scoped.reduce((s, p) => s + p.tenureYears, 0) / scoped.length).toFixed(1) : '0.0'

  return (
    <div className="px-[var(--layout-space-loose)] py-[var(--layout-space-loose)] space-y-[var(--layout-space-loose)]">
      {/* ① Summary — dept-scoped;純聚合不可點,segment 可點=設過濾器 */}
      <section>
        <h2 className="mb-[var(--layout-space-tight)] text-body-lg font-semibold text-foreground">團隊小結</h2>
        <div className="grid grid-cols-5 gap-[var(--layout-space-tight)]">
          <AggregateTile label="團隊總人數" value={`${scoped.length} 人`} />
          <AggregateTile label="平均年資" value={`${avgTenure} 年`} />
          <SegmentTile label="本月新進" value={count('newMonth')} active={cond === 'newMonth'} onClick={() => setCond('newMonth')} />
          <SegmentTile label="本季新進" value={count('newQuarter')} active={cond === 'newQuarter'} onClick={() => setCond('newQuarter')} />
          <SegmentTile label="本月壽星" value={count('birthday')} active={cond === 'birthday'} onClick={() => setCond('birthday')} />
        </div>
      </section>

      {/* ② 部門快速篩選器(WHO 軸)— 切部門不重置條件 */}
      <section className="flex flex-wrap items-center gap-[var(--layout-space-tight)]">
        <span className="text-caption text-fg-secondary">查看部門</span>
        <SegmentedControl value={scope} onValueChange={(v) => setScope(v as Scope)}>
          {SCOPES.map((s) => (
            <SegmentedControlItem key={s.id} value={s.id}>
              {s.label}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
      </section>

      {/* ③ 「當前顯示」bar:描述(部門 · 條件)+ 條件單選過濾器(WHAT 軸,唯一狀態真相)*/}
      <section className="rounded-lg border border-border bg-surface-raised shadow-[var(--elevation-200)]">
        <div className="flex flex-wrap items-center justify-between gap-[var(--layout-space-tight)] border-b border-divider px-[var(--layout-space-loose)] py-[var(--layout-space-tight)]">
          <div className="flex items-baseline gap-[8px]">
            <span className="text-body-lg font-semibold text-foreground">
              {scopeLabel(scope)} · {condLabel(cond)}
            </span>
            <span className="text-caption text-fg-secondary tabular-nums">{rows.length} 人</span>
          </div>
          <SegmentedControl size="sm" value={cond} onValueChange={(v) => setCond(v as Cond)}>
            {CONDS.map((c) => (
              <SegmentedControlItem key={c.id} value={c.id}>
                {c.label}
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
        </div>

        {/* ④ 人員名單(語意 table + DS token)*/}
        <div className="px-[var(--layout-space-loose)] pb-[var(--layout-space-loose)] pt-[var(--layout-space-tight)]">
          {rows.length === 0 ? (
            <div className="py-[var(--layout-space-loose)] text-center text-body text-fg-muted">
              此條件下目前沒有符合的人員。
            </div>
          ) : (
            <table className="w-full border-collapse text-body">
              <thead>
                <tr className="border-b border-divider text-left text-caption font-medium text-fg-secondary">
                  <th className="py-[var(--layout-space-tight)] pr-[var(--layout-space-tight)]">員工</th>
                  <th className="py-[var(--layout-space-tight)] pr-[var(--layout-space-tight)]">部門</th>
                  <th className="py-[var(--layout-space-tight)] pr-[var(--layout-space-tight)]">職稱</th>
                  <th className="py-[var(--layout-space-tight)] pr-[var(--layout-space-tight)]">到職</th>
                  <th className="py-[var(--layout-space-tight)] pr-[var(--layout-space-tight)]">年資</th>
                  <th className="py-[var(--layout-space-tight)]">標籤</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="border-b border-divider last:border-0 hover:bg-neutral-hover">
                    <td className="py-[var(--layout-space-tight)] pr-[var(--layout-space-tight)]">
                      <div className="flex items-center gap-[var(--layout-space-tight)]">
                        <Avatar size={32} alt={p.name} color={p.color} />
                        <span className="font-medium text-foreground">{p.name}</span>
                      </div>
                    </td>
                    <td className="py-[var(--layout-space-tight)] pr-[var(--layout-space-tight)] text-fg-secondary">{deptLabel(p.deptId)}</td>
                    <td className="py-[var(--layout-space-tight)] pr-[var(--layout-space-tight)] text-fg-secondary">{p.role}</td>
                    <td className="py-[var(--layout-space-tight)] pr-[var(--layout-space-tight)] tabular-nums text-fg-secondary">{p.joinedDaysAgo} 天前</td>
                    <td className="py-[var(--layout-space-tight)] pr-[var(--layout-space-tight)] tabular-nums text-fg-secondary">{p.tenureYears} 年</td>
                    <td className="py-[var(--layout-space-tight)]">
                      <div className="flex flex-wrap gap-[4px]">{personTags(p)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  )
}

// 由 portal-33q 的 App 掛載(view==='manager');TooltipProvider 由外層提供
export function ManagerAdminApp({ onBack }: { onBack: () => void }) {
  const [activeId, setActiveId] = useState<string>('roster')
  const current = NAV.find((n) => n.id === activeId) ?? NAV[1]
  return (
    <SidebarProvider activeId={activeId} onActiveChange={setActiveId}>
      <AppShell
        layout="primary-sidebar"
        sidebar={<AppSidebar />}
        header={
          <PageHeader
            title={current.label}
            onBack={onBack}
            rightSlot={<Button variant="secondary" size="md" startIcon={Download}>匯出名單</Button>}
          />
        }
      >
        <ManagerAdminPage />
      </AppShell>
    </SidebarProvider>
  )
}
