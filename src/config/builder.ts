/**
 * 分镜规格与设计令牌：PageBuilder（前端页面搭建可视化）。
 * 数字全部是"设计稿逻辑像素"，与稿件坐标系一致，改尺寸只需改这里。
 */
export const BUILDER = {
  fps: 30,
  width: 1920,
  height: 1080,
  /**
   * 30 秒：纯色空窗口 -> 14 支光标并行逐元素搭建 73 个元素 -> 收工定格。
   * 元素很细（导航菜单项、KPI 的标签与数值、柱状图的三段、地图的每个图钉都各是一笔），
   * 节奏必须放慢，否则每一笔只剩两三帧，看不出「在手搭」。
   */
  durationInFrames: 900,
} as const

/** 仪表盘界面字体：优先系统 UI 字体，中文回落到苹方 */
export const UI_FONT = [
  '-apple-system',
  'BlinkMacSystemFont',
  '"SF Pro Text"',
  '"Helvetica Neue"',
  '"PingFang SC"',
  '"Microsoft YaHei"',
  'sans-serif',
].join(', ')

export const PALETTE = {
  backdrop: '#07080b',
  window: '#0e1014',
  chrome: '#12151a',
  card: '#151920',
  cardTop: '#181d26',
  border: '#232833',
  borderSoft: '#1b2029',
  wire: 'rgba(255, 255, 255, 0.04)',
  wireBorder: 'rgba(255, 255, 255, 0.07)',
  text: '#e9ecf1',
  textMuted: '#78829b',
  textDim: '#4c5468',
  accent: '#2f6bff',
  accentLight: '#5b8dff',
  green: '#37c978',
  red: '#f2545b',
  select: '#2f95ff',
  guideX: '#2ee6d6',
  guideY: '#ff5fd2',
} as const

/** 协作光标配色：多人同时编辑，颜色即身份。相邻两支的色相要拉开，14 支同屏才不会糊成一片 */
export const CURSOR_COLORS = [
  '#ff8a3d', // 橙
  '#2ee6d6', // 青
  '#b57bff', // 紫
  '#4ad991', // 绿
  '#ff6ba8', // 粉
  '#ffd166', // 黄
  '#6ec1ff', // 天蓝
  '#ff5f6d', // 红
  '#a3e635', // 青柠
  '#e879f9', // 品红
  '#2dd4bf', // 水绿
  '#fb923c', // 珊瑚
  '#93c5fd', // 淡蓝
  '#fda4af', // 玫红
] as const
