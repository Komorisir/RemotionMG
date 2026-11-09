import { Easing, interpolate, spring } from 'remotion'
import type { BuildOp, CursorDef } from '@/data/builderLayout'

/**
 * PageBuilder 的时间编排：把「第几帧 -> 每个元素的状态」全部收敛成纯函数。
 * 组件只负责把数值贴到 DOM 上，所以整条时间轴可以在 Node 里直接断言。
 *
 * 叙事：画面里只有一个纯色空窗口 -> 14 位协作者陆续进场，谁有事谁出现，
 * 干完自己那摊就消失，不会在画面上排队站着。
 */

/* ===================== 时间轴（归一化 0-1） ===================== */

export const TIMELINE = {
  /** 空窗口淡入：只有底色，没有任何界面元素 */
  fadeIn: [0, 0.04],
  /** 建造：第一笔落笔到最后一笔收工 */
  build: [0.02, 0.958],
  /** 收工后镜头轻推并定格 */
  settle: [0.958, 1],
} as const

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const

/** 把归一化窗口映射成该区间的局部进度（0-1） */
export const phase = (p: number, [start, end]: readonly [number, number]): number => {
  // 零长度区间在 interpolate 里会直接抛错，这里退化成阶梯函数
  if (start === end) return p < start ? 0 : 1
  return interpolate(p, [start, end], [0, 1], clamp)
}

/** 弹入：短促的过阻尼弹簧（有轻微回弹，像真的「弹」上来） */
export const springIn = (progress: number, damping = 16, durationInFrames = 26): number =>
  spring({ frame: progress * durationInFrames, fps: 30, config: { damping, mass: 0.7 }, durationInFrames })

/* ===================== 单笔内部节奏 ===================== */

/**
 * 每一笔（一个元素）内部的三段：光标飞入 -> 按住拖出/点击落位 -> 松手定稿。
 * 拖拽与显影同时发生：光标拖到哪，元素就长到哪。
 */
export const STEP_PHASES = {
  approach: [0, 0.2],
  drag: [0.2, 0.72],
  release: [0.72, 1],
} as const

const easeOut = Easing.bezier(0.22, 1, 0.36, 1)
const easeDrag = Easing.bezier(0.4, 0, 0.2, 1)
const easeShift = Easing.bezier(0.32, 0.06, 0.16, 1)

/** 一笔的绝对时间窗 */
export const opWindow = (op: BuildOp): readonly [number, number] => [op.start, op.start + op.dur]

/** 某一笔在给定时刻的局部进度（未开始 = 0，结束后 = 1） */
export const opProgress = (p: number, op: BuildOp): number => phase(p, opWindow(op))

/** 汇总后每个元素的状态 */
export type BuildState = {
  id: string
  by: string
  /** 被拖出来的面积比例（0-1，驱动 clip-path 揭示） */
  reveal: number
  /** 元素内部内容的入场进度（拖拽结束后再补一点点） */
  content: number
  /** 选框可见度 */
  select: number
  /** 选框矩形（窗口内坐标，随拖拽生长） */
  rect: { x: number; y: number; width: number; height: number }
  /** drag 是拖出一个面，place 是点一下弹出 */
  mode: BuildOp['mode']
  /** 该笔是否已经开始 */
  active: boolean
}

/** 汇总所有建造笔 */
export const buildStates = (p: number, ops: readonly BuildOp[]): readonly BuildState[] =>
  ops.map(op => {
    const local = opProgress(p, op)
    const { drag, release } = STEP_PHASES
    const dragged = easeDrag(phase(local, drag))
    const revealed = op.mode === 'drag' ? dragged : phase(local, [drag[0], drag[1]])

    return {
      id: op.id,
      by: op.by,
      reveal: revealed,
      content: local <= drag[0] ? 0 : springIn(phase(local, [drag[0], release[1]]), 14, 16),
      // quiet 的细长元素（下划线、进度条、坐标轴）不挂选框，否则八个手柄比元素本身还大
      select: op.quiet ? 0 : interpolate(local, [drag[0], drag[0] + 0.05, release[0], 1], [0, 1, 1, 0], clamp),
      rect: {
        x: op.rect.x,
        y: op.rect.y,
        width: op.rect.width * dragged,
        height: op.rect.height * dragged,
      },
      mode: op.mode,
      active: p >= op.start,
    }
  })

/** 按 id 取状态，方便适配层查单个元素 */
export const stateOf = (states: readonly BuildState[], id: string): BuildState =>
  states.find(s => s.id === id) ?? {
    id,
    by: '',
    reveal: 0,
    content: 0,
    select: 0,
    rect: { x: 0, y: 0, width: 0, height: 0 },
    mode: 'place',
    active: false,
  }

/* ===================== 数字滚动 ===================== */

/**
 * 逐位滚动：从右往左依次定格，每一位在定格前飞快地转圈，
 * 读起来像计数器在跳，而不是整串数字一起淡入。
 */
export const rollDigits = (target: string, progress: number): string => {
  if (progress >= 1) return target
  if (progress <= 0) return target

  const chars = [...target]
  const digits = chars.filter(c => /\d/.test(c)).length

  let seen = 0
  return chars
    .map(char => {
      if (!/\d/.test(char)) return char
      const fromRight = digits - 1 - seen
      seen += 1
      // 越靠左的位越晚定格
      const local = Math.min(1, Math.max(0, (progress - fromRight * 0.07) / 0.6))
      if (local >= 1) return char
      const spins = 2 + fromRight
      const offset = Math.round((1 - local) * (1 - local) * spins * 10)
      return String((Number(char) + offset) % 10)
    })
    .join('')
}

/* ===================== 协作光标 ===================== */

/** 光标的活动范围（窗口内坐标），留出名字牌与箭头的边距 */
export const CURSOR_BOUNDS = { minX: 10, maxX: 1740, minY: 10, maxY: 906 } as const
const clampX = (x: number) => Math.min(CURSOR_BOUNDS.maxX, Math.max(CURSOR_BOUNDS.minX, x))
const clampY = (y: number) => Math.min(CURSOR_BOUNDS.maxY, Math.max(CURSOR_BOUNDS.minY, y))

/** 每支光标的「生命周期」：只在自己那几笔作业前后存在 */
export const CURSOR_LIFE = {
  /** 提前多久出现在画面上 */
  lead: 0.012,
  /** 干完最后一笔多久后离开 */
  tail: 0.01,
  /** 淡入淡出时长 */
  fadeIn: 0.012,
  fadeOut: 0.014,
} as const

/** 光标在某一笔里的锚点：拖拽笔取左上/右下，点击笔取中心 */
const anchorsOf = (op: BuildOp): { from: { x: number; y: number }; to: { x: number; y: number } } => {
  const inset = Math.min(10, Math.max(4, Math.min(op.rect.width, op.rect.height) * 0.2))
  if (op.mode === 'place') {
    const center = { x: op.rect.x + op.rect.width / 2, y: op.rect.y + op.rect.height / 2 }
    return { from: center, to: center }
  }
  return {
    from: { x: op.rect.x + inset, y: op.rect.y + inset },
    to: { x: op.rect.x + op.rect.width - inset, y: op.rect.y + op.rect.height - inset },
  }
}

export type CursorPoint = { x: number; y: number; pressing: number; dragging: boolean }

/** 光标在一笔之内的位置 */
export const cursorInOp = (local: number, op: BuildOp, origin: { x: number; y: number }): CursorPoint => {
  const { approach, drag } = STEP_PHASES
  const { from, to } = anchorsOf(op)

  if (local < approach[1]) {
    const t = easeShift(phase(local, approach))
    return {
      x: origin.x + (from.x - origin.x) * t,
      y: origin.y + (from.y - origin.y) * t,
      pressing: 0,
      dragging: false,
    }
  }

  if (local < drag[1]) {
    if (op.mode === 'place') {
      // 点击笔：停在中心，按下 -> 松开
      const t = phase(local, drag)
      return { x: from.x, y: from.y, pressing: Math.sin(t * Math.PI) * 0.9 + 0.1, dragging: false }
    }
    const t = easeDrag(phase(local, drag))
    return {
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t,
      pressing: 1,
      dragging: true,
    }
  }

  // 松手后轻轻收手，给刚长出来的元素让位
  const t = easeOut(phase(local, [drag[1], 1]))
  const rest = op.mode === 'place' ? 22 : 30
  return {
    x: to.x + rest * t,
    y: to.y + (op.mode === 'place' ? 18 : 24) * t,
    pressing: 0,
    dragging: false,
  }
}

export type CursorTrack = {
  def: CursorDef
  ops: readonly BuildOp[]
  /** 每一笔的飞行起点（上一笔的终点 / 首次登场位置） */
  origins: readonly { x: number; y: number }[]
  /** 首次登场与最后离场的时间点 */
  life: { enter: number; exit: number }
}

/**
 * 登场点：每人从自己第一笔的锚点斜着飘进来，方向和距离由 id 散列决定。
 * 这样 14 支光标不会像排队一样从同一个位置一起冒出来。
 */
const entryPointFor = (op: BuildOp, seed: number): { x: number; y: number } => {
  const { from } = anchorsOf(op)
  const golden = 2.399963229728653
  const angle = ((seed * golden) % (Math.PI * 2)) + 0.35
  const radius = 54 + ((seed * 37) % 76)
  return {
    x: clampX(from.x + Math.cos(angle) * radius),
    y: clampY(from.y + Math.sin(angle) * radius),
  }
}

export const cursorTracks = (cursors: readonly CursorDef[], ops: readonly BuildOp[]): readonly CursorTrack[] =>
  cursors.map((def, seed) => {
    const owned = ops.filter(op => op.by === def.id).sort((a, b) => a.start - b.start)
    const origins: { x: number; y: number }[] = []
    for (let i = 0; i < owned.length; i++) {
      if (i === 0) {
        origins.push(entryPointFor(owned[0], seed + 1))
        continue
      }
      const prevOp = owned[i - 1]
      const prevOrigin = origins[i - 1]
      const at = cursorInOp(1, prevOp, prevOrigin)
      // 用归位点而不是飞出点作为下一笔的起点：两次拖拽之间光标是「抬起来再走」
      origins.push({ x: clampX(at.x - 30), y: clampY(at.y - 24) })
    }

    const enter = owned.length > 0 ? Math.max(0, owned[0].start - CURSOR_LIFE.lead - CURSOR_LIFE.fadeIn) : 1
    const exit = owned.length > 0 ? owned[owned.length - 1].start + owned[owned.length - 1].dur + CURSOR_LIFE.tail : 1
    return { def, ops: owned, origins, life: { enter, exit } }
  })

export type CursorPose = {
  def: CursorDef
  x: number
  y: number
  dragging: boolean
  pressing: number
  /** 该光标当前是否正在干活 */
  busy: boolean
  /** 登场/退场透明度：不在自己的时段里就是 0，画面上根本不存在 */
  presence: number
}

/** 待机时的轻微呼吸，避免光标像冻住了 */
const idleSway = (p: number, seed: number, amplitude: number): number =>
  Math.sin(p * Math.PI * 2 * (0.6 + seed * 0.13) + seed * 1.7) * amplitude

/** 汇总：每支光标此刻的位姿 */
export const cursorPoses = (p: number, tracks: readonly CursorTrack[]): readonly CursorPose[] =>
  tracks.map(({ def, ops, origins, life }) => {
    const presence =
      phase(p, [life.enter, life.enter + CURSOR_LIFE.fadeIn]) *
      (1 - phase(p, [life.exit, life.exit + CURSOR_LIFE.fadeOut]))

    if (ops.length === 0 || presence <= 0) {
      return { def, x: clampX(def.home.x), y: clampY(def.home.y), dragging: false, pressing: 0, busy: false, presence }
    }

    // 找到当前正在干的那一笔；没有则取最近结束的一笔
    let idx = -1
    for (let i = 0; i < ops.length; i++) {
      if (p >= ops[i].start) idx = i
    }

    if (idx < 0) {
      // 还没轮到：从登场点慢慢飘向第一笔的锚点
      const first = ops[0]
      const anchor = anchorsOf(first).from
      const drift = phase(p, [life.enter, first.start])
      return {
        def,
        x: clampX(origins[0].x + (anchor.x - origins[0].x) * drift + idleSway(p, 1, 6)),
        y: clampY(origins[0].y + (anchor.y - origins[0].y) * drift + idleSway(p, 2, 5)),
        dragging: false,
        pressing: 0,
        busy: false,
        presence,
      }
    }

    const op = ops[idx]
    const local = opProgress(p, op)
    const raw = cursorInOp(local, op, origins[idx])
    const busy = local > 0 && local < 1
    return {
      def,
      x: clampX(raw.x + idleSway(p, 3, busy ? 0 : 6)),
      y: clampY(raw.y + idleSway(p, 4, busy ? 0 : 5)),
      dragging: raw.dragging,
      pressing: raw.pressing,
      busy,
      presence,
    }
  })

/* ===================== 参考线与对齐标记 ===================== */

/** 当前最该被标注的那一笔：优先返回正在拖拽的最后一笔 */
export const activeOp = (p: number, ops: readonly BuildOp[]): BuildOp | undefined => {
  let best: BuildOp | undefined
  for (const op of ops) {
    if (op.mode !== 'drag' || op.quiet) continue
    const local = opProgress(p, op)
    if (local > 0 && local < 1) best = op
  }
  return best
}
