/**
 * PageBuilder 的版面几何、演示数据与「逐元素建造脚本」。
 * 所有坐标都是 1920x1080 画布坐标；BLOCKS 的 x/y 相对网格原点（CONTENT_X / CONTENT_Y）。
 * BUILD_OPS 的 rect 用「窗口内坐标」（相对窗口左上角 0,0），因为导航栏与卡片共用同一套手势层。
 */
import { CURSOR_COLORS, PALETTE } from '@/config/builder'

/* ===================== 画布几何 ===================== */

export const WINDOW_RECT = { x: 60, y: 60, width: 1800, height: 960 } as const
export const CHROME_HEIGHT = 56
export const PAD_X = 32
export const PAD_Y = 28
export const HEADER_HEIGHT = 56
export const HEADER_GAP = 20

/** 页面栅格原点（窗口内 header 下方） */
export const CONTENT_X = WINDOW_RECT.x + PAD_X
export const CONTENT_Y = WINDOW_RECT.y + CHROME_HEIGHT + PAD_Y + HEADER_HEIGHT + HEADER_GAP
export const CONTENT_W = WINDOW_RECT.width - PAD_X * 2

/** 12 栏栅格 */
const COLUMN_W = 130
const GUTTER = 16
const colX = (i: number) => i * (COLUMN_W + GUTTER)
const span = (n: number) => n * COLUMN_W + (n - 1) * GUTTER

/* ===================== 区块 ===================== */

export type KpiId = 'kpi-sales' | 'kpi-revenue' | 'kpi-clients' | 'kpi-subs'
export type TileId = 'tile-sales' | 'tile-orders' | 'tile-shares' | 'tile-likes'
/** KPI 卡片里的迷你趋势图，独立于卡片本体被「画」出来 */
export type SparkId = `spark-${KpiId}`

export const sparkId = (id: KpiId): SparkId => `spark-${id}`

export type BlockId = 'hero' | 'users' | 'active' | KpiId | TileId | 'traffic' | 'locations'

export type BlockRect = {
  id: BlockId
  x: number
  y: number
  width: number
  height: number
}

export const BLOCKS: readonly BlockRect[] = [
  { id: 'hero', x: colX(0), y: 0, width: span(5), height: 210 },
  { id: 'users', x: colX(5), y: 0, width: span(4), height: 210 },
  { id: 'active', x: colX(9), y: 0, width: span(3), height: 210 },
  { id: 'kpi-sales', x: colX(0), y: 230, width: span(3), height: 150 },
  { id: 'kpi-revenue', x: colX(3), y: 230, width: span(3), height: 150 },
  { id: 'kpi-clients', x: colX(6), y: 230, width: span(3), height: 150 },
  { id: 'kpi-subs', x: colX(9), y: 230, width: span(3), height: 150 },
  { id: 'tile-sales', x: colX(0), y: 400, width: span(3), height: 88 },
  { id: 'tile-orders', x: colX(3), y: 400, width: span(3), height: 88 },
  { id: 'tile-shares', x: colX(6), y: 400, width: span(3), height: 88 },
  { id: 'tile-likes', x: colX(9), y: 400, width: span(3), height: 88 },
  { id: 'traffic', x: colX(0), y: 508, width: span(7), height: 264 },
  { id: 'locations', x: colX(7), y: 508, width: span(5), height: 264 },
] as const

export const BLOCKS_BY_ID = new Map<BlockId, BlockRect>(BLOCKS.map(b => [b.id, b]))

/* ===================== 协作光标 ===================== */

export type CursorDef = {
  id: string
  color: string
  label: string
  /** 兜底的入场点（真正的入场位置由每一段任务的落点决定） */
  home: { x: number; y: number }
  /** 每个人的指针大小略有差异，避免看起来是同一个图标复制出来的 */
  scale: number
}

/** 14 个协作者：分散在页面各处，不是排成一排 */
export const CURSORS: readonly CursorDef[] = [
  { id: 'c1', color: CURSOR_COLORS[0], label: 'Lena', home: { x: 880, y: 300 }, scale: 1 },
  { id: 'c2', color: CURSOR_COLORS[1], label: 'Yuki', home: { x: 240, y: 470 }, scale: 0.94 },
  { id: 'c3', color: CURSOR_COLORS[2], label: 'Marco', home: { x: 1420, y: 240 }, scale: 1.03 },
  { id: 'c4', color: CURSOR_COLORS[3], label: 'Ines', home: { x: 620, y: 760 }, scale: 0.97 },
  { id: 'c5', color: CURSOR_COLORS[4], label: 'Sora', home: { x: 1180, y: 520 }, scale: 1.06 },
  { id: 'c6', color: CURSOR_COLORS[5], label: 'Kai', home: { x: 330, y: 180 }, scale: 1 },
  { id: 'c7', color: CURSOR_COLORS[6], label: 'Noor', home: { x: 1560, y: 700 }, scale: 0.92 },
  { id: 'c8', color: CURSOR_COLORS[7], label: 'Theo', home: { x: 760, y: 140 }, scale: 1.05 },
  { id: 'c9', color: CURSOR_COLORS[8], label: 'Ada', home: { x: 1290, y: 860 }, scale: 0.98 },
  { id: 'c10', color: CURSOR_COLORS[9], label: 'Rui', home: { x: 120, y: 640 }, scale: 1.02 },
  { id: 'c11', color: CURSOR_COLORS[10], label: 'Mila', home: { x: 1680, y: 420 }, scale: 0.95 },
  { id: 'c12', color: CURSOR_COLORS[11], label: 'Owen', home: { x: 1010, y: 180 }, scale: 1.07 },
  { id: 'c13', color: CURSOR_COLORS[12], label: 'Zara', home: { x: 480, y: 860 }, scale: 0.96 },
  { id: 'c14', color: CURSOR_COLORS[13], label: 'Pia', home: { x: 1450, y: 120 }, scale: 1.01 },
] as const

/* ===================== 逐元素建造脚本 ===================== */

/** 页面上每一个会被「搭出来」的元素：一个能看见的独立零件就是一笔作业 */
export type ElementId =
  | BlockId
  | SparkId
  // 应用外壳（导航栏逐个菜单项单独搭，每个菜单项还有一段下划线扫入）
  | 'chrome'
  | 'brand-mark'
  | 'brand-name'
  | 'nav-dash'
  | 'nav-interface'
  | 'nav-forms'
  | 'nav-extra'
  | 'nav-layout'
  | 'nav-plugins'
  | 'nav-help'
  | 'nav-dash-line'
  | 'nav-interface-line'
  | 'nav-forms-line'
  | 'nav-extra-line'
  | 'nav-layout-line'
  | 'nav-plugins-line'
  | 'nav-help-line'
  | 'chip-pkg'
  | 'chip-lang'
  | 'avatar'
  | 'identity-name'
  | 'identity-role'
  // 页头
  | 'eyebrow'
  | 'page-title'
  | 'btn-ghost'
  | 'btn-primary'
  // 首行三卡：卡体与卡内每个零件
  | 'hero'
  | 'users'
  | 'active'
  | 'hero-title'
  | 'hero-sub'
  | 'hero-stat-sales-label'
  | 'hero-stat-sales-value'
  | 'hero-stat-sales-bar'
  | 'hero-stat-growth-label'
  | 'hero-stat-growth-value'
  | 'hero-stat-growth-bar'
  | 'hero-chart-ring'
  | 'hero-chart-tile'
  | 'users-head-title'
  | 'users-head-meta'
  | 'users-value'
  | 'users-spark'
  | 'active-head-title'
  | 'active-head-meta'
  | 'active-ring-track'
  | 'active-ring-arc'
  // KPI 行
  | 'kpi-sales'
  | 'kpi-revenue'
  | 'kpi-clients'
  | 'kpi-subs'
  | 'kpi-sales-head-label'
  | 'kpi-sales-head-meta'
  | 'kpi-revenue-head-label'
  | 'kpi-revenue-head-meta'
  | 'kpi-clients-head-label'
  | 'kpi-clients-head-meta'
  | 'kpi-subs-head-label'
  | 'kpi-subs-head-meta'
  | 'kpi-sales-value'
  | 'kpi-revenue-value'
  | 'kpi-clients-value'
  | 'kpi-subs-value'
  | 'kpi-sales-bar'
  | 'kpi-revenue-bar'
  | 'kpi-clients-bar'
  | 'kpi-subs-bar'
  // 图标行
  | 'tile-sales'
  | 'tile-orders'
  | 'tile-shares'
  | 'tile-likes'
  | 'tile-sales-icon'
  | 'tile-orders-icon'
  | 'tile-shares-icon'
  | 'tile-likes-icon'
  | 'tile-sales-title'
  | 'tile-sales-sub'
  | 'tile-orders-title'
  | 'tile-orders-sub'
  | 'tile-shares-title'
  | 'tile-shares-sub'
  | 'tile-likes-title'
  | 'tile-likes-sub'
  // 底部
  | 'traffic'
  | 'locations'
  | 'traffic-title'
  | 'traffic-legend-web'
  | 'traffic-legend-social'
  | 'traffic-legend-other'
  | 'traffic-web'
  | 'traffic-social'
  | 'traffic-other'
  | 'traffic-axis-line'
  | 'traffic-axis-labels'
  | 'map-title'
  | 'map-dots-amer'
  | 'map-dots-emea'
  | 'map-dots-apac'
  | 'map-pin-sf'
  | 'map-pin-ldn'
  | 'map-pin-tky'
  | 'map-pin-syd'
  // 收尾字幕
  | 'outro-caption'

/**
 * drag：像拉一个矩形那样把元素「拉」出来，选框随拖拽生长，元素按拖出的面积显影。
 * place：点一下，元素原地弹出来（文字、按钮、图钉这类没有面积感的量）。
 */
export type OpMode = 'drag' | 'place'

export type BuildOp = {
  id: ElementId
  /** 哪支光标负责这一笔（由下面的排班器分配，保证同一支光标的两笔不重叠） */
  by: string
  /** 归一化绝对起点（0-1） */
  start: number
  /** 归一化时长 */
  dur: number
  /** 窗口内坐标 */
  rect: { x: number; y: number; width: number; height: number }
  mode: OpMode
  /** 依赖的上一级元素：必须等它开工，这一笔才会开始 */
  parent?: ElementId
  /**
   * 细长元素（菜单下划线、进度条、坐标轴线）不挂选框：
   * 八个手柄比元素本身还宽，画出来只剩一串小方块，反而看不清在拖什么。
   */
  quiet?: boolean
}

type OpDraft = Omit<BuildOp, 'by'>

const bx = (x: number, y: number, width: number, height: number) => ({ x, y, width, height })

/**
 * 107 笔作业的绝对时间表（手写，按波次推进）。
 * 每一波只有一个主题：外壳 -> 导航 -> 页头 -> 首行 -> KPI -> 图标行 -> 底部 -> 字幕。
 */
const OP_DRAFTS: readonly OpDraft[] = [
  /* 外壳背景条 */
  { id: 'chrome', start: 0.02, dur: 0.042, mode: 'drag', rect: bx(0, 0, 1800, 56) },

  /* 导航：品牌标记 + 七个菜单项 + 品牌名 */
  { id: 'brand-mark', start: 0.064, dur: 0.02, mode: 'place', rect: bx(22, 15, 26, 26), parent: 'chrome' },
  { id: 'nav-dash', start: 0.067, dur: 0.02, mode: 'place', rect: bx(151, 14, 92, 28), parent: 'chrome' },
  { id: 'nav-interface', start: 0.07, dur: 0.02, mode: 'place', rect: bx(265, 14, 76, 28), parent: 'chrome' },
  { id: 'nav-forms', start: 0.073, dur: 0.02, mode: 'place', rect: bx(363, 14, 59, 28), parent: 'chrome' },
  { id: 'nav-extra', start: 0.076, dur: 0.02, mode: 'place', rect: bx(444, 14, 54, 28), parent: 'chrome' },
  { id: 'nav-layout', start: 0.079, dur: 0.02, mode: 'place', rect: bx(520, 14, 64, 28), parent: 'chrome' },
  { id: 'nav-plugins', start: 0.082, dur: 0.02, mode: 'place', rect: bx(606, 14, 68, 28), parent: 'chrome' },
  { id: 'nav-help', start: 0.085, dur: 0.02, mode: 'place', rect: bx(696, 14, 51, 28), parent: 'chrome' },
  { id: 'brand-name', start: 0.09, dur: 0.02, mode: 'place', rect: bx(58, 17, 60, 24), parent: 'chrome' },

  /* 七个菜单项的下划线各自扫入 */
  {
    id: 'nav-dash-line',
    start: 0.092,
    dur: 0.014,
    mode: 'drag',
    rect: bx(151, 39, 92, 1.6),
    parent: 'nav-dash',
    quiet: true,
  },
  {
    id: 'nav-interface-line',
    start: 0.0955,
    dur: 0.014,
    mode: 'drag',
    rect: bx(265, 39, 76, 1.6),
    parent: 'nav-interface',
    quiet: true,
  },
  {
    id: 'nav-forms-line',
    start: 0.099,
    dur: 0.014,
    mode: 'drag',
    rect: bx(363, 39, 59, 1.6),
    parent: 'nav-forms',
    quiet: true,
  },
  {
    id: 'nav-extra-line',
    start: 0.1025,
    dur: 0.014,
    mode: 'drag',
    rect: bx(444, 39, 54, 1.6),
    parent: 'nav-extra',
    quiet: true,
  },
  {
    id: 'nav-layout-line',
    start: 0.106,
    dur: 0.014,
    mode: 'drag',
    rect: bx(520, 39, 64, 1.6),
    parent: 'nav-layout',
    quiet: true,
  },
  {
    id: 'nav-plugins-line',
    start: 0.1095,
    dur: 0.014,
    mode: 'drag',
    rect: bx(606, 39, 68, 1.6),
    parent: 'nav-plugins',
    quiet: true,
  },
  {
    id: 'nav-help-line',
    start: 0.113,
    dur: 0.014,
    mode: 'drag',
    rect: bx(696, 39, 51, 1.6),
    parent: 'nav-help',
    quiet: true,
  },

  /* 右侧胶囊、头像、身份区 */
  { id: 'chip-pkg', start: 0.118, dur: 0.018, mode: 'place', rect: bx(1510, 15, 90, 26), parent: 'chrome' },
  { id: 'chip-lang', start: 0.1215, dur: 0.018, mode: 'place', rect: bx(1614, 15, 38, 26), parent: 'chrome' },
  { id: 'avatar', start: 0.125, dur: 0.018, mode: 'place', rect: bx(1666, 14, 28, 28), parent: 'chrome' },
  { id: 'identity-name', start: 0.1285, dur: 0.018, mode: 'place', rect: bx(1708, 13, 70, 15), parent: 'chrome' },
  { id: 'identity-role', start: 0.132, dur: 0.018, mode: 'place', rect: bx(1708, 29, 70, 14), parent: 'chrome' },

  /* 页头 */
  { id: 'eyebrow', start: 0.15, dur: 0.018, mode: 'place', rect: bx(32, 86, 70, 14), parent: 'chrome' },
  { id: 'page-title', start: 0.156, dur: 0.022, mode: 'place', rect: bx(32, 104, 160, 36), parent: 'chrome' },
  { id: 'btn-ghost', start: 0.166, dur: 0.026, mode: 'drag', rect: bx(1512, 94, 104, 35) },
  { id: 'btn-primary', start: 0.173, dur: 0.028, mode: 'drag', rect: bx(1626, 94, 142, 35), parent: 'btn-ghost' },

  /* 首行三卡 */
  { id: 'hero', start: 0.2, dur: 0.048, mode: 'drag', rect: bx(32, 160, 714, 210) },
  { id: 'users', start: 0.206, dur: 0.048, mode: 'drag', rect: bx(762, 160, 568, 210) },
  { id: 'active', start: 0.212, dur: 0.048, mode: 'drag', rect: bx(1346, 160, 422, 210) },

  /* Hero 卡内部：标题、副标题、两组指标各拆成标签/数值/进度条、图表拆成圆环与小卡 */
  { id: 'hero-title', start: 0.258, dur: 0.02, mode: 'place', rect: bx(54, 178, 300, 30), parent: 'hero' },
  { id: 'hero-sub', start: 0.264, dur: 0.02, mode: 'place', rect: bx(54, 214, 320, 20), parent: 'hero' },
  {
    id: 'hero-stat-sales-label',
    start: 0.27,
    dur: 0.018,
    mode: 'place',
    rect: bx(54, 282, 220, 13),
    parent: 'hero',
  },
  {
    id: 'hero-stat-sales-value',
    start: 0.2755,
    dur: 0.02,
    mode: 'place',
    rect: bx(54, 297, 220, 28),
    parent: 'hero',
  },
  {
    id: 'hero-stat-sales-bar',
    start: 0.281,
    dur: 0.024,
    mode: 'drag',
    rect: bx(54, 330, 220, 5),
    parent: 'hero',
    quiet: true,
  },
  {
    id: 'hero-stat-growth-label',
    start: 0.287,
    dur: 0.018,
    mode: 'place',
    rect: bx(308, 282, 220, 13),
    parent: 'hero',
  },
  {
    id: 'hero-stat-growth-value',
    start: 0.2925,
    dur: 0.02,
    mode: 'place',
    rect: bx(308, 297, 220, 28),
    parent: 'hero',
  },
  {
    id: 'hero-stat-growth-bar',
    start: 0.298,
    dur: 0.024,
    mode: 'drag',
    rect: bx(308, 330, 220, 5),
    parent: 'hero',
    quiet: true,
  },
  { id: 'hero-chart-ring', start: 0.305, dur: 0.028, mode: 'drag', rect: bx(588, 198, 84, 84), parent: 'hero' },
  { id: 'hero-chart-tile', start: 0.312, dur: 0.026, mode: 'drag', rect: bx(573, 289, 113, 37), parent: 'hero' },

  /* Users 卡内部 */
  { id: 'users-head-title', start: 0.26, dur: 0.018, mode: 'place', rect: bx(784, 178, 200, 18), parent: 'users' },
  { id: 'users-head-meta', start: 0.2655, dur: 0.018, mode: 'place', rect: bx(1142, 178, 166, 18), parent: 'users' },
  { id: 'users-value', start: 0.271, dur: 0.022, mode: 'place', rect: bx(784, 206, 220, 30), parent: 'users' },
  { id: 'users-spark', start: 0.28, dur: 0.042, mode: 'drag', rect: bx(784, 264, 440, 86), parent: 'users' },

  /* Active 卡内部：标题/角标、环底、环弧 */
  { id: 'active-head-title', start: 0.256, dur: 0.018, mode: 'place', rect: bx(1368, 178, 200, 18), parent: 'active' },
  { id: 'active-head-meta', start: 0.2615, dur: 0.018, mode: 'place', rect: bx(1570, 178, 176, 18), parent: 'active' },
  { id: 'active-ring-track', start: 0.267, dur: 0.026, mode: 'drag', rect: bx(1560, 218, 186, 132), parent: 'active' },
  { id: 'active-ring-arc', start: 0.276, dur: 0.038, mode: 'drag', rect: bx(1560, 218, 186, 132), parent: 'active' },

  /* KPI 四张卡 */
  { id: 'kpi-sales', start: 0.35, dur: 0.046, mode: 'drag', rect: bx(32, 390, 422, 150) },
  { id: 'kpi-revenue', start: 0.356, dur: 0.046, mode: 'drag', rect: bx(470, 390, 422, 150) },
  { id: 'kpi-clients', start: 0.362, dur: 0.046, mode: 'drag', rect: bx(908, 390, 422, 150) },
  { id: 'kpi-subs', start: 0.368, dur: 0.046, mode: 'drag', rect: bx(1346, 390, 422, 150) },

  /* KPI 标签与角标：每张卡两笔 */
  {
    id: 'kpi-sales-head-label',
    start: 0.418,
    dur: 0.018,
    mode: 'place',
    rect: bx(52, 406, 180, 14),
    parent: 'kpi-sales',
  },
  {
    id: 'kpi-sales-head-meta',
    start: 0.4225,
    dur: 0.018,
    mode: 'place',
    rect: bx(318, 406, 116, 14),
    parent: 'kpi-sales',
  },
  {
    id: 'kpi-revenue-head-label',
    start: 0.426,
    dur: 0.018,
    mode: 'place',
    rect: bx(490, 406, 180, 14),
    parent: 'kpi-revenue',
  },
  {
    id: 'kpi-revenue-head-meta',
    start: 0.4305,
    dur: 0.018,
    mode: 'place',
    rect: bx(756, 406, 116, 14),
    parent: 'kpi-revenue',
  },
  {
    id: 'kpi-clients-head-label',
    start: 0.434,
    dur: 0.018,
    mode: 'place',
    rect: bx(928, 406, 180, 14),
    parent: 'kpi-clients',
  },
  {
    id: 'kpi-clients-head-meta',
    start: 0.4385,
    dur: 0.018,
    mode: 'place',
    rect: bx(1194, 406, 116, 14),
    parent: 'kpi-clients',
  },
  {
    id: 'kpi-subs-head-label',
    start: 0.442,
    dur: 0.018,
    mode: 'place',
    rect: bx(1366, 406, 180, 14),
    parent: 'kpi-subs',
  },
  {
    id: 'kpi-subs-head-meta',
    start: 0.4465,
    dur: 0.018,
    mode: 'place',
    rect: bx(1632, 406, 116, 14),
    parent: 'kpi-subs',
  },

  /* KPI 数值：落位后数字逐位滚动 */
  { id: 'kpi-sales-value', start: 0.474, dur: 0.026, mode: 'place', rect: bx(52, 428, 200, 30), parent: 'kpi-sales' },
  {
    id: 'kpi-revenue-value',
    start: 0.482,
    dur: 0.026,
    mode: 'place',
    rect: bx(490, 428, 200, 30),
    parent: 'kpi-revenue',
  },
  {
    id: 'kpi-clients-value',
    start: 0.49,
    dur: 0.026,
    mode: 'place',
    rect: bx(928, 428, 200, 30),
    parent: 'kpi-clients',
  },
  { id: 'kpi-subs-value', start: 0.498, dur: 0.026, mode: 'place', rect: bx(1366, 428, 200, 30), parent: 'kpi-subs' },

  /* KPI 迷你趋势线 */
  { id: 'spark-kpi-sales', start: 0.528, dur: 0.038, mode: 'drag', rect: bx(52, 482, 310, 46), parent: 'kpi-sales' },
  {
    id: 'spark-kpi-revenue',
    start: 0.536,
    dur: 0.038,
    mode: 'drag',
    rect: bx(490, 482, 310, 46),
    parent: 'kpi-revenue',
  },
  {
    id: 'spark-kpi-clients',
    start: 0.544,
    dur: 0.038,
    mode: 'drag',
    rect: bx(928, 482, 310, 46),
    parent: 'kpi-clients',
  },
  { id: 'spark-kpi-subs', start: 0.552, dur: 0.038, mode: 'drag', rect: bx(1366, 482, 310, 46), parent: 'kpi-subs' },

  /* KPI 进度条 */
  {
    id: 'kpi-sales-bar',
    start: 0.566,
    dur: 0.03,
    mode: 'drag',
    rect: bx(52, 470, 382, 5),
    parent: 'kpi-sales',
    quiet: true,
  },
  {
    id: 'kpi-revenue-bar',
    start: 0.574,
    dur: 0.03,
    mode: 'drag',
    rect: bx(490, 470, 382, 5),
    parent: 'kpi-revenue',
    quiet: true,
  },
  {
    id: 'kpi-clients-bar',
    start: 0.582,
    dur: 0.03,
    mode: 'drag',
    rect: bx(928, 470, 382, 5),
    parent: 'kpi-clients',
    quiet: true,
  },
  {
    id: 'kpi-subs-bar',
    start: 0.59,
    dur: 0.03,
    mode: 'drag',
    rect: bx(1366, 470, 382, 5),
    parent: 'kpi-subs',
    quiet: true,
  },

  /* 图标行 */
  { id: 'tile-sales', start: 0.608, dur: 0.04, mode: 'drag', rect: bx(32, 560, 422, 88) },
  { id: 'tile-orders', start: 0.616, dur: 0.04, mode: 'drag', rect: bx(470, 560, 422, 88) },
  { id: 'tile-shares', start: 0.624, dur: 0.04, mode: 'drag', rect: bx(908, 560, 422, 88) },
  { id: 'tile-likes', start: 0.632, dur: 0.04, mode: 'drag', rect: bx(1346, 560, 422, 88) },

  { id: 'tile-sales-icon', start: 0.668, dur: 0.02, mode: 'place', rect: bx(52, 581, 46, 46), parent: 'tile-sales' },
  { id: 'tile-orders-icon', start: 0.674, dur: 0.02, mode: 'place', rect: bx(490, 581, 46, 46), parent: 'tile-orders' },
  { id: 'tile-shares-icon', start: 0.68, dur: 0.02, mode: 'place', rect: bx(928, 581, 46, 46), parent: 'tile-shares' },
  { id: 'tile-likes-icon', start: 0.686, dur: 0.02, mode: 'place', rect: bx(1366, 581, 46, 46), parent: 'tile-likes' },

  {
    id: 'tile-sales-title',
    start: 0.692,
    dur: 0.018,
    mode: 'place',
    rect: bx(114, 586, 220, 18),
    parent: 'tile-sales',
  },
  {
    id: 'tile-orders-title',
    start: 0.698,
    dur: 0.018,
    mode: 'place',
    rect: bx(552, 586, 220, 18),
    parent: 'tile-orders',
  },
  {
    id: 'tile-shares-title',
    start: 0.704,
    dur: 0.018,
    mode: 'place',
    rect: bx(990, 586, 220, 18),
    parent: 'tile-shares',
  },
  {
    id: 'tile-likes-title',
    start: 0.71,
    dur: 0.018,
    mode: 'place',
    rect: bx(1428, 586, 220, 18),
    parent: 'tile-likes',
  },
  { id: 'tile-sales-sub', start: 0.696, dur: 0.018, mode: 'place', rect: bx(114, 606, 220, 16), parent: 'tile-sales' },
  {
    id: 'tile-orders-sub',
    start: 0.702,
    dur: 0.018,
    mode: 'place',
    rect: bx(552, 606, 220, 16),
    parent: 'tile-orders',
  },
  {
    id: 'tile-shares-sub',
    start: 0.708,
    dur: 0.018,
    mode: 'place',
    rect: bx(990, 606, 220, 16),
    parent: 'tile-shares',
  },
  { id: 'tile-likes-sub', start: 0.714, dur: 0.018, mode: 'place', rect: bx(1428, 606, 220, 16), parent: 'tile-likes' },

  /* 底部两张卡 */
  { id: 'traffic', start: 0.74, dur: 0.05, mode: 'drag', rect: bx(32, 668, 1006, 264) },
  { id: 'locations', start: 0.746, dur: 0.05, mode: 'drag', rect: bx(1054, 668, 714, 264) },

  /* 卡片标题与图例逐项入场 */
  { id: 'traffic-title', start: 0.784, dur: 0.018, mode: 'place', rect: bx(54, 682, 200, 18), parent: 'traffic' },
  { id: 'map-title', start: 0.786, dur: 0.018, mode: 'place', rect: bx(1076, 682, 200, 18), parent: 'locations' },
  { id: 'traffic-legend-web', start: 0.79, dur: 0.016, mode: 'place', rect: bx(694, 682, 64, 20), parent: 'traffic' },
  {
    id: 'traffic-legend-social',
    start: 0.795,
    dur: 0.016,
    mode: 'place',
    rect: bx(768, 682, 78, 20),
    parent: 'traffic',
  },
  { id: 'traffic-legend-other', start: 0.8, dur: 0.016, mode: 'place', rect: bx(856, 682, 70, 20), parent: 'traffic' },

  /* 堆叠柱三段分别拖出 */
  { id: 'traffic-web', start: 0.8, dur: 0.032, mode: 'drag', rect: bx(54, 726, 329, 168), parent: 'traffic' },
  { id: 'traffic-social', start: 0.81, dur: 0.032, mode: 'drag', rect: bx(389, 726, 329, 168), parent: 'traffic' },
  { id: 'traffic-other', start: 0.82, dur: 0.032, mode: 'drag', rect: bx(724, 726, 292, 168), parent: 'traffic' },

  /* 地图点阵按大洲分三段扫描 */
  { id: 'map-dots-amer', start: 0.804, dur: 0.03, mode: 'drag', rect: bx(1186, 712, 135, 206), parent: 'locations' },
  { id: 'map-dots-emea', start: 0.814, dur: 0.03, mode: 'drag', rect: bx(1321, 712, 153, 206), parent: 'locations' },
  { id: 'map-dots-apac', start: 0.824, dur: 0.03, mode: 'drag', rect: bx(1474, 712, 163, 206), parent: 'locations' },

  /* 坐标轴：先拉出横线，再落日期 */
  {
    id: 'traffic-axis-line',
    start: 0.846,
    dur: 0.024,
    mode: 'drag',
    rect: bx(54, 898, 962, 1.5),
    parent: 'traffic',
    quiet: true,
  },
  {
    id: 'traffic-axis-labels',
    start: 0.856,
    dur: 0.016,
    mode: 'place',
    rect: bx(54, 898, 962, 18),
    parent: 'traffic-axis-line',
  },

  /* 四个据点逐个落位 */
  { id: 'map-pin-sf', start: 0.848, dur: 0.016, mode: 'place', rect: bx(1246, 767, 24, 24), parent: 'map-dots-apac' },
  { id: 'map-pin-ldn', start: 0.854, dur: 0.016, mode: 'place', rect: bx(1399, 747, 24, 24), parent: 'map-dots-apac' },
  { id: 'map-pin-tky', start: 0.86, dur: 0.016, mode: 'place', rect: bx(1574, 770, 24, 24), parent: 'map-dots-apac' },
  { id: 'map-pin-syd', start: 0.866, dur: 0.016, mode: 'place', rect: bx(1589, 871, 24, 24), parent: 'map-dots-apac' },

  /* 收尾字幕 */
  /* 收尾字幕：落在窗口最底部那条空着的边距里，不压任何卡片 */
  { id: 'outro-caption', start: 0.9, dur: 0.026, mode: 'place', rect: bx(0, 934, 1800, 24) },
] as const

/**
 * 接力编排：14 支光标分成 4 组（4 / 4 / 3 / 3），一组做完自己那段就退场，
 * 下一组顶上来。这样每个人的登场时间互相错开，画面里同时出现的永远是三四支，
 * 而不是 14 支挤成一排。
 */
const CURSOR_CREWS: readonly (readonly string[])[] = (() => {
  const ids = CURSORS.map(cursor => cursor.id)
  const crews: string[][] = []
  let cursor = 0
  for (const size of [4, 4, 3, 3]) {
    crews.push(ids.slice(cursor, cursor + size))
    cursor += size
  }
  return crews
})()

/**
 * 排班器：把作业按时间顺序分给 4 组接力。
 * 同一组里挑「最早空出来」的人接手，因此一个组内部的笔是串行的；
 * 一组做满配额就整体退场，交给下一组。
 */
const scheduleCursors = (drafts: readonly OpDraft[]): readonly BuildOp[] => {
  const ordered = [...drafts].sort((a, b) => a.start - b.start || (a.id < b.id ? -1 : 1))
  const authored = new Map<string, OpDraft>(ordered.map(draft => [draft.id, draft]))
  const planned = new Map<string, BuildOp>()
  const freeAt = new Map<string, number>(CURSORS.map(cursor => [cursor.id, -1]))

  /** 同一支光标两笔之间的最小空档 */
  const CURSOR_GAP = 0.004
  const quota = Math.ceil(ordered.length / CURSOR_CREWS.length)
  let crewIndex = 0
  let crewLoad = 0

  for (const draft of ordered) {
    // 子元素跟着父元素走：保留作者手写的相对间隔
    let floor = draft.start
    const parent = draft.parent ? planned.get(draft.parent) : undefined
    if (parent && draft.parent) {
      floor = Math.max(floor, parent.start + (draft.start - (authored.get(draft.parent) as OpDraft).start))
    }

    // 当前组做满配额后换下一组；换组时整组退场，下一组接上
    while (crewIndex < CURSOR_CREWS.length - 1 && crewLoad >= quota) {
      crewIndex += 1
      crewLoad = 0
    }

    const crew = CURSOR_CREWS[crewIndex]
    // 组内挑最早空出来的人：同一支光标的两笔必然首尾不相接
    const pick = crew.reduce((best, id) => ((freeAt.get(id) as number) < (freeAt.get(best) as number) ? id : best))
    // 同一支光标连着干两笔时，中间要留出抬手换位置的余地
    const start = Math.max(floor, (freeAt.get(pick) as number) + CURSOR_GAP)
    freeAt.set(pick, start + draft.dur)
    crewLoad += 1
    planned.set(draft.id, { ...draft, by: pick, start })
  }

  const result = ordered.map(draft => planned.get(draft.id) as BuildOp)

  // 排完可能因为组间接力把尾巴顶到 build 窗口之外，
  // 这里做一次全局仿射压缩：保序、保留父子相对关系，只把整体塞回窗口内。
  const first = Math.min(...result.map(op => op.start))
  const last = Math.max(...result.map(op => op.start + op.dur))
  const scale = (BUILD_SPAN[1] - BUILD_SPAN[0]) / Math.max(1e-6, last - first)
  return result.map(op => ({
    ...op,
    start: BUILD_SPAN[0] + (op.start - first) * scale,
    dur: Math.max(0.004, op.dur * scale),
  }))
}

/** 排班结果最终要落进的区间：留出收尾给光标退场与镜头推进 */
const BUILD_SPAN = [0.02, 0.926] as const

export const BUILD_OPS: readonly BuildOp[] = scheduleCursors(OP_DRAFTS)

/* ===================== 仪表盘内容 ===================== */

export type Kpi = {
  id: KpiId
  label: string
  value: string
  delta: string
  up: boolean
  /** 进度条宽度百分比 */
  progress: number
  spark: readonly number[]
}

export const KPIS: readonly Kpi[] = [
  {
    id: 'kpi-sales',
    label: 'SALES',
    value: '75%',
    delta: '+7%',
    up: true,
    progress: 75,
    spark: [22, 30, 26, 38, 34, 46, 42, 55, 50, 62, 58, 70],
  },
  {
    id: 'kpi-revenue',
    label: 'REVENUE',
    value: '$4,300',
    delta: '+9%',
    up: true,
    progress: 62,
    spark: [40, 36, 48, 42, 55, 50, 62, 58, 70, 64, 76, 82],
  },
  {
    id: 'kpi-clients',
    label: 'NEW CLIENTS',
    value: '6,782',
    delta: '+18%',
    up: true,
    progress: 48,
    spark: [30, 42, 38, 50, 46, 58, 52, 44, 60, 56, 68, 74],
  },
  {
    id: 'kpi-subs',
    label: 'ACTIVE SUBSCRIPTIONS',
    value: '2,986',
    delta: '+4%',
    up: true,
    progress: 34,
    spark: [18, 26, 22, 30, 26, 34, 30, 38, 34, 42, 38, 46],
  },
] as const

export type Tile = {
  id: TileId
  icon: 'cart' | 'box' | 'share' | 'heart'
  title: string
  sub: string
  tone: 'blue' | 'green' | 'dark'
}

export const TILES: readonly Tile[] = [
  { id: 'tile-sales', icon: 'cart', title: '132 Sales', sub: '2 waiting payments', tone: 'blue' },
  { id: 'tile-orders', icon: 'box', title: '78 Orders', sub: '32 shipped', tone: 'green' },
  { id: 'tile-shares', icon: 'share', title: '623 Shares', sub: '16 today', tone: 'dark' },
  { id: 'tile-likes', icon: 'heart', title: '112 Likes', sub: '21 today', tone: 'blue' },
] as const

/** 折线图采样点（面积图 / 迷你趋势图共用） */
export const MAIN_TREND: readonly number[] = [
  18, 24, 20, 32, 28, 40, 34, 30, 44, 38, 52, 46, 40, 56, 50, 62, 54, 48, 66, 58, 72, 64, 56, 70, 62, 78, 70, 84, 76,
  68, 80, 88,
]

/** 流量柱状图：每根 = [web, social, other] 的高度百分比 */
export const TRAFFIC_SERIES: readonly (readonly [number, number, number])[] = [
  [12, 6, 3],
  [18, 9, 4],
  [15, 7, 2],
  [26, 12, 5],
  [22, 10, 6],
  [34, 15, 4],
  [30, 12, 7],
  [40, 18, 6],
  [36, 14, 8],
  [46, 20, 5],
  [42, 22, 9],
  [52, 24, 6],
  [48, 18, 10],
  [58, 26, 7],
  [54, 22, 12],
  [62, 30, 8],
  [58, 26, 10],
  [68, 32, 14],
  [64, 28, 9],
  [72, 34, 11],
  [66, 30, 16],
  [76, 36, 12],
  [70, 32, 10],
  [80, 40, 18],
  [74, 34, 13],
  [84, 42, 15],
] as const

/* ===================== 世界地图点阵 ===================== */

/**
 * Natural Earth 110m 陆地数据光栅化后的点阵网格：
 * 92 列 = 经度 -180..180，42 行 = 纬度 84N..58S（等距圆柱投影）。
 * '#' 为陆地，'.' 为海洋。离线的字符串常量，运行时零依赖。
 */
export const MAP_COLS = 92
export const MAP_ROWS = 42

export const MAP_GRID: readonly string[] = [
  '........................######....#####.....................................................',
  '...................#..#####.#############........##....................##...................',
  '................###.#.###......##########....................#.......######......##.........',
  '..............#.###.#..##.#.....########...................#....#..############...##........',
  '...###############....#.#..#.....######...........######......#.############################',
  '.#.#####################...###...###....##.......######.####################################',
  '....##################...##......##............###.########################################.',
  '......#....###########....####.................#.#..##############################.....#....',
  '....#.......#############.#####..............#.....##############################.....#.....',
  '.............############.######...........#.#.####################################.........',
  '...............#############.#.#.............######################################.........',
  '..............################................###################################...........',
  '..............##############................###..#.##.#..######################.............',
  '...............###########..................##.....#.#######################..#.............',
  '...............############.................#####...#.######################..#.##..........',
  '................#########...................######.#...######################..#............',
  '..................###......................###########.###.##################...............',
  '.................####.....................#################....#############................',
  '...................##..#..................#############.#####...####..####..................',
  '....................###...................##############.###.....##...###...................',
  '......................###.................##############.##......#.....###..................',
  '........................#..#..............###############.#......#......##..................',
  '..........................#####............################.......#....#.....#..............',
  '..........................#######..............###########............#....#................',
  '..........................#######...............#########..............#..##................',
  '.........................##########.............########................#.###....#..........',
  '.........................############............#######.........................##.#.......',
  '..........................###########............#######..........................##........',
  '..........................##########.............#######.......................##.#.........',
  '...........................#########.............#######..#...................###.#.........',
  '............................########.............######..##..................######.........',
  '............................#######...............#####..#.................##########.......',
  '............................######................####.....................##########.......',
  '............................#####.................####.....................##########.......',
  '............................#####..................##.......................##..#####.......',
  '...........................####...................................................##......#.',
  '...........................###............................................................#.',
  '...........................###.....................................................#........',
  '...........................##...............................................................',
  '...........................##...............................................................',
  '...........................##...............................................................',
  '............................................................................................',
]

export type MapCell = { col: number; row: number }

const cellsCache: MapCell[] = []
for (let row = 0; row < MAP_GRID.length; row++) {
  const line = MAP_GRID[row]
  for (let col = 0; col < line.length; col++) {
    if (line[col] === '#') cellsCache.push({ col, row })
  }
}

export const MAP_CELLS: readonly MapCell[] = cellsCache

/** 经纬度 -> 网格坐标（与点阵同一套投影，用于摆放据点） */
export const mapGridPos = (lon: number, lat: number): { col: number; row: number } => ({
  col: ((lon + 180) / 360) * MAP_COLS,
  row: ((84 - lat) / 142) * MAP_ROWS,
})

/** 地图上的高亮据点：旧金山 / 伦敦 / 东京 / 悉尼 */
export const MAP_PINS: readonly { col: number; row: number; color: string }[] = [
  { ...mapGridPos(-122.4, 37.8), color: PALETTE.accentLight },
  { ...mapGridPos(-0.1, 51.5), color: PALETTE.green },
  { ...mapGridPos(139.7, 35.7), color: '#ffd166' },
  { ...mapGridPos(151.2, -33.9), color: '#b57bff' },
] as const
