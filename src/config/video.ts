/**
 * 视频基础规格（单一事实来源）。
 * 别名 @/ 由 tsconfig.json 的 paths + remotion.config.ts 的 TsconfigPathsPlugin 提供。
 */
export const VIDEO = {
  fps: 30,
  width: 1920,
  height: 1080,
  /** 4 秒占位时长，替换剧本时只改这里 */
  durationInFrames: 120,
} as const

export const FONT_STACK = [
  '"PingFang SC"',
  '"Microsoft YaHei"',
  '-apple-system',
  'BlinkMacSystemFont',
  'sans-serif',
].join(', ')
