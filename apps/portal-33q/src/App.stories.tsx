// 33q 員工入口平台 — 完整 portal 畫面(供測試人員檢視版面 + 互動)
// Mock 資料,僅展示既有系統 UI;數值非真實。

import type { Meta, StoryObj } from '@storybook/react'
import App from './App'

const meta: Meta<typeof App> = {
  title: 'Apps/portal-33q/員工入口平台',
  component: App,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '33q 員工入口平台 — bento UI 風格 web portal。\n\n' +
          '佈局:固定 header(64px)+ hero background band(400px)+ 三欄 bento(左右固定 360px、' +
          '中間 fill,模塊間距 20px)+ footer(110px),content max 1920 / min 1200、四邊 ≥40px margin。\n\n' +
          '模塊:左欄(個人資訊 + 團隊清單)、中欄(精選應用 / 通知中心 / 所有應用 / 常見問題)、' +
          '右欄(動態追蹤 popover / 精選文章 carousel / 每日一句)。\n\n' +
          '全部 consume `@qijenchen/design-system` primitives(Avatar / Button / Popover / Carousel / ' +
          'ScrollArea / Badge / Separator),不自刻 DS 元件。',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof App>

export const Portal: Story = {
  name: '入口首頁',
}
