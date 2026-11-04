import { interpolate, spring } from 'remotion'

/**
 * 组件动画的纯函数层。
 *
 * 为什么单独抽出来：Remotion 的 useCurrentFrame / useVideoConfig 必须跑在渲染上下文里，
 * 想在单测里直接挂载组件就得伪造一整套 Composition 上下文，成本高且脆弱。
 * 把「第几帧 -> 什么样式」的换算变成纯函数后，时间轴逻辑可以在 Node 环境里直接断言，
 * React 组件只剩「把数值贴到 DOM 上」这一件事，测试成本大幅下降。
 */

/** 入场弹簧参数：damping 200 为临界阻尼，无回弹，是 MG 标题的默认手感 */
export const ENTRANCE_SPRING_CONFIG = { damping: 200 } as const

/** 标题从下方入场的起始位移（px） */
export const ENTRANCE_OFFSET_PX = 40

/** 进度条提前这么多帧走完，避免片尾还在动 */
export const SWEEP_END_OFFSET_FRAMES = 30

export type TitleMotionInput = {
  frame: number
  fps: number
  durationInFrames: number
}

export type TitleMotion = {
  /** 0 -> 完全不可见，1 -> 完全入场 */
  entrance: number
  /** 入场位移（px），随 entrance 增大收敛到 0 */
  offsetY: number
  /** 进度条宽度百分比（0-100） */
  sweepPercent: number
}

export const getTitleMotion = ({ frame, fps, durationInFrames }: TitleMotionInput): TitleMotion => {
  const entrance = spring({ frame, fps, config: ENTRANCE_SPRING_CONFIG })
  const sweepEndFrame = Math.max(durationInFrames - SWEEP_END_OFFSET_FRAMES, 1)
  const sweepPercent = interpolate(frame, [0, sweepEndFrame], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return {
    entrance,
    offsetY: (1 - entrance) * ENTRANCE_OFFSET_PX,
    sweepPercent,
  }
}
