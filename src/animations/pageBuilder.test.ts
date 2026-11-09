import { describe, expect, it } from 'vitest'
import { BLOCKS, BUILD_OPS, CURSORS } from '@/data/builderLayout'
import {
  activeOp,
  buildStates,
  CURSOR_BOUNDS,
  CURSOR_LIFE,
  cursorInOp,
  cursorPoses,
  cursorTracks,
  opProgress,
  opWindow,
  phase,
  rollDigits,
  springIn,
  stateOf,
  STEP_PHASES,
  TIMELINE,
} from './pageBuilder'

const TRACKS = cursorTracks(CURSORS, BUILD_OPS)

/** 扫过整条时间轴，方便逐帧断言 */
const SWEEP = Array.from({ length: 601 }, (_, i) => i / 600)

describe('phase', () => {
  it('把窗口两端钳制在 0 和 1', () => {
    expect(phase(-1, [0.2, 0.6])).toBe(0)
    expect(phase(0.2, [0.2, 0.6])).toBe(0)
    expect(phase(0.4, [0.2, 0.6])).toBeCloseTo(0.5, 5)
    expect(phase(0.6, [0.2, 0.6])).toBe(1)
    expect(phase(9, [0.2, 0.6])).toBe(1)
  })

  it('退化的零长度区间不会返回 NaN，也不抛错', () => {
    expect(phase(0.4, [0.5, 0.5])).toBe(0)
    expect(phase(0.6, [0.5, 0.5])).toBe(1)
  })
})

describe('springIn', () => {
  it('从 0 出发并单调上升到 1 附近', () => {
    expect(springIn(0)).toBeCloseTo(0, 5)
    const head = [0, 0.2, 0.4, 0.6].map(v => springIn(v, 14, 18))
    for (let i = 1; i < head.length; i++) expect(head[i]).toBeGreaterThanOrEqual(head[i - 1] - 1e-6)
    expect(springIn(1, 14, 18)).toBeCloseTo(1, 2)
  })
})

describe('建造脚本', () => {
  it('13 个区块每个都有对应的建造笔，且只出现一次', () => {
    const ids = BUILD_OPS.map(op => op.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const block of BLOCKS) expect(ids).toContain(block.id)
  })

  it('每一笔都指向一支真实存在的光标', () => {
    const known = new Set(CURSORS.map(c => c.id))
    for (const op of BUILD_OPS) expect(known.has(op.by)).toBe(true)
  })

  it('14 支光标人人有活干，没有干站着看的', () => {
    expect(CURSORS).toHaveLength(14)
    for (const cursor of CURSORS) {
      expect(BUILD_OPS.filter(op => op.by === cursor.id).length, cursor.id).toBeGreaterThanOrEqual(4)
    }
  })

  it('同一支光标的两笔不重叠，中间留出移动的余地', () => {
    for (const cursor of CURSORS) {
      const mine = BUILD_OPS.filter(op => op.by === cursor.id).sort((a, b) => a.start - b.start)
      for (let i = 1; i < mine.length; i++) {
        expect(mine[i].start, cursor.id + ' 的 ' + mine[i - 1].id + ' 与 ' + mine[i].id).toBeGreaterThan(
          mine[i - 1].start + mine[i - 1].dur,
        )
      }
    }
  })

  it('粗粒度被拆细：至少 100 笔，且每笔都有独立矩形', () => {
    expect(BUILD_OPS.length).toBeGreaterThanOrEqual(100)
    for (const op of BUILD_OPS) {
      expect(op.rect.width).toBeGreaterThan(0)
      expect(op.rect.height).toBeGreaterThan(0)
    }
  })

  it('子元素要等父元素开工，且全部在 build 区间内收工', () => {
    const byId = new Map(BUILD_OPS.map(op => [op.id, op]))
    for (const op of BUILD_OPS) {
      if (op.dur <= 0) throw new Error(op.id + ' 的时长必须为正')
      if (op.parent) {
        const parent = byId.get(op.parent)
        expect(parent, op.id + ' 的父元素 ' + op.parent + ' 必须存在').toBeDefined()
        expect(op.start).toBeGreaterThanOrEqual(parent!.start)
      }
      expect(op.start).toBeGreaterThanOrEqual(TIMELINE.build[0] - 1e-9)
      expect(op.start + op.dur).toBeLessThanOrEqual(TIMELINE.build[1] + 1e-9)
    }
  })

  it('idle 位置都落在光标活动范围内', () => {
    for (const cursor of CURSORS) {
      expect(cursor.home.x).toBeGreaterThanOrEqual(CURSOR_BOUNDS.minX)
      expect(cursor.home.x).toBeLessThanOrEqual(CURSOR_BOUNDS.maxX)
      expect(cursor.home.y).toBeGreaterThanOrEqual(CURSOR_BOUNDS.minY)
      expect(cursor.home.y).toBeLessThanOrEqual(CURSOR_BOUNDS.maxY)
    }
  })
})

describe('buildStates', () => {
  it('片头是纯色空窗口：第一笔开工前一个元素都没有', () => {
    const first = Math.min(...BUILD_OPS.map(op => op.start))
    const states = buildStates(first - 1e-6, BUILD_OPS)
    expect(states).toHaveLength(BUILD_OPS.length)
    for (const s of states) expect(s.reveal).toBe(0)
    for (const s of states) expect(s.active).toBe(false)
  })

  it('收工时所有元素都完整长成', () => {
    const states = buildStates(1, BUILD_OPS)
    for (const s of states) expect(s.reveal).toBeCloseTo(1, 3)
    for (const s of states) expect(s.content).toBeCloseTo(1, 2)
    for (const s of states) expect(s.select).toBe(0)
  })

  it('元素只在自己那一笔里生长，之前为 0、之后停在 1', () => {
    for (const op of BUILD_OPS) {
      const [from, to] = opWindow(op)
      const before = stateOf(buildStates(from - 1e-6, BUILD_OPS), op.id)
      const after = stateOf(buildStates(to + 1e-6, BUILD_OPS), op.id)
      expect(before.reveal, op.id).toBe(0)
      expect(after.reveal, op.id).toBeCloseTo(1, 3)
    }
  })

  it('reveal 单调不减，选框矩形永远不超过目标尺寸', () => {
    for (const op of BUILD_OPS) {
      let prev = 0
      for (const p of SWEEP) {
        const s = stateOf(buildStates(p, BUILD_OPS), op.id)
        expect(s.reveal).toBeGreaterThanOrEqual(prev - 1e-9)
        expect(s.reveal).toBeLessThanOrEqual(1 + 1e-9)
        expect(s.rect.width).toBeLessThanOrEqual(op.rect.width + 1e-6)
        expect(s.rect.height).toBeLessThanOrEqual(op.rect.height + 1e-6)
        expect(Number.isNaN(s.rect.width)).toBe(false)
        prev = s.reveal
      }
    }
  })

  it('选框只在拖拽期间亮起，松手后消失', () => {
    for (const op of BUILD_OPS) {
      if (op.quiet) continue
      const [from, to] = opWindow(op)
      expect(stateOf(buildStates(from - 1e-6, BUILD_OPS), op.id).select).toBe(0)
      expect(stateOf(buildStates(to + 1e-4, BUILD_OPS), op.id).select).toBe(0)
      const mid = stateOf(buildStates(from + (to - from) * 0.5, BUILD_OPS), op.id)
      expect(mid.select).toBeCloseTo(1, 3)
    }
  })

  it('细长元素（下划线、进度条）不挂选框', () => {
    const quietOps = BUILD_OPS.filter(op => op.quiet)
    expect(quietOps.length).toBeGreaterThan(5)
    for (const op of quietOps) {
      for (const p of SWEEP) {
        expect(stateOf(buildStates(p, BUILD_OPS), op.id).select, op.id).toBe(0)
      }
    }
  })

  it('内容要等拖拽结束才补上来', () => {
    for (const op of BUILD_OPS) {
      const [from, to] = opWindow(op)
      const early = stateOf(buildStates(from + (to - from) * (STEP_PHASES.drag[0] - 0.01), BUILD_OPS), op.id)
      expect(early.content, op.id).toBe(0)
      const late = stateOf(buildStates(to, BUILD_OPS), op.id)
      expect(late.content, op.id).toBeGreaterThan(0.5)
    }
  })

  it('拖拽笔是拉出一个矩形，点放笔是原地弹出', () => {
    const dragOps = BUILD_OPS.filter(op => op.mode === 'drag')
    const placeOps = BUILD_OPS.filter(op => op.mode === 'place')
    expect(dragOps.length).toBeGreaterThan(5)
    expect(placeOps.length).toBeGreaterThan(5)
    for (const op of dragOps) {
      const [from, to] = opWindow(op)
      const mid = stateOf(buildStates(from + (to - from) * 0.5, BUILD_OPS), op.id)
      expect(mid.rect.width).toBeGreaterThan(0)
      expect(mid.rect.width).toBeLessThan(op.rect.width)
    }
  })
})

describe('opProgress', () => {
  it('按绝对时间窗返回 0-1 的局部进度', () => {
    const op = BUILD_OPS[5]
    expect(opProgress(op.start - 0.01, op)).toBe(0)
    expect(opProgress(op.start + op.dur / 2, op)).toBeCloseTo(0.5, 3)
    expect(opProgress(op.start + op.dur * 2, op)).toBe(1)
  })
})

describe('协作光标', () => {
  it('每支光标只领自己那一摊活，按时间排序', () => {
    for (const track of TRACKS) {
      for (const op of track.ops) expect(op.by).toBe(track.def.id)
      for (let i = 1; i < track.ops.length; i++) {
        expect(track.ops[i].start).toBeGreaterThanOrEqual(track.ops[i - 1].start)
      }
      expect(track.origins).toHaveLength(track.ops.length)
    }
  })

  it('首笔从自己锚点斜上方飘进来，而不是全员从同一排冒出', () => {
    for (const track of TRACKS) {
      const first = track.ops[0]
      const anchor =
        first.mode === 'place'
          ? { x: first.rect.x + first.rect.width / 2, y: first.rect.y + first.rect.height / 2 }
          : { x: first.rect.x, y: first.rect.y }
      const dx = track.origins[0].x - anchor.x
      const dy = track.origins[0].y - anchor.y
      const distance = Math.hypot(dx, dy)
      // 黄金角散列的半径区间是 54~130，钳制后只会更近
      expect(distance, track.def.id).toBeLessThanOrEqual(131)
      expect(track.origins[0].x).toBeGreaterThanOrEqual(CURSOR_BOUNDS.minX - 1e-6)
      expect(track.origins[0].x).toBeLessThanOrEqual(CURSOR_BOUNDS.maxX + 1e-6)
      expect(track.origins[0].y).toBeGreaterThanOrEqual(CURSOR_BOUNDS.minY - 1e-6)
      expect(track.origins[0].y).toBeLessThanOrEqual(CURSOR_BOUNDS.maxY + 1e-6)
    }
  })

  it('每支光标投完自己那几笔就退场，不会整场站着', () => {
    for (const track of TRACKS) {
      const span = track.life.exit - track.life.enter
      expect(span, track.def.id).toBeGreaterThan(0)
      expect(span, track.def.id).toBeLessThanOrEqual(0.4)
    }
  })

  it('一笔之内：先飞向起点，再拖到终点，松手后收手', () => {
    const op = BUILD_OPS.find(o => o.mode === 'drag')!
    const origin = { x: 20, y: 20 }
    const head = cursorInOp(0, op, origin)
    const atDragStart = cursorInOp(STEP_PHASES.drag[0], op, origin)
    const atDragEnd = cursorInOp(STEP_PHASES.drag[1] - 1e-6, op, origin)
    expect(head.dragging).toBe(false)
    expect(atDragStart.dragging).toBe(true)
    // 拖到一半之后光标已经离起点很远
    expect(Math.abs(atDragEnd.x - atDragStart.x) + Math.abs(atDragEnd.y - atDragStart.y)).toBeGreaterThan(100)
    expect(cursorInOp(1, op, origin).dragging).toBe(false)
  })

  it('点放笔按下时有涟漪，且原地不动', () => {
    const op = BUILD_OPS.find(o => o.mode === 'place')!
    const origin = { x: 0, y: 0 }
    const press = cursorInOp((STEP_PHASES.drag[0] + STEP_PHASES.drag[1]) / 2, op, origin)
    expect(press.pressing).toBeGreaterThan(0.5)
    expect(press.dragging).toBe(false)
  })

  it('整条时间轴上 14 支光标都不越界、不出 NaN', () => {
    for (const p of SWEEP) {
      const poses = cursorPoses(p, TRACKS)
      expect(poses).toHaveLength(CURSORS.length)
      for (const pose of poses) {
        expect(Number.isNaN(pose.x)).toBe(false)
        expect(Number.isNaN(pose.y)).toBe(false)
        expect(pose.x).toBeGreaterThanOrEqual(CURSOR_BOUNDS.minX - 1e-6)
        expect(pose.x).toBeLessThanOrEqual(CURSOR_BOUNDS.maxX + 1e-6)
        expect(pose.y).toBeGreaterThanOrEqual(CURSOR_BOUNDS.minY - 1e-6)
        expect(pose.y).toBeLessThanOrEqual(CURSOR_BOUNDS.maxY + 1e-6)
      }
    }
  })

  it('同一时刻有几支光标在拖，但不是全员一起抖', () => {
    let peak = 0
    for (const p of SWEEP) {
      const dragging = cursorPoses(p, TRACKS).filter(pose => pose.dragging).length
      peak = Math.max(peak, dragging)
    }
    expect(peak).toBeGreaterThanOrEqual(3)
    expect(peak).toBeLessThanOrEqual(8)
  })
})

describe('数字滚动', () => {
  it('起步时数字还没跳，收工时精确等于目标值', () => {
    expect(rollDigits('75,782', 0)).toBe('75,782')
    expect(rollDigits('75,782', 1)).toBe('75,782')
  })

  it('滚动过程中位数与分隔符保持不变，不会少一位或多一位', () => {
    const target = '75,782'
    for (let i = 0; i <= 20; i++) {
      const shown = rollDigits(target, i / 20)
      expect(shown).toHaveLength(target.length)
      expect(shown[2]).toBe(',')
      expect(/^\d+,\d{3}$/.test(shown)).toBe(true)
    }
  })

  it('越往后越接近目标值，中途真的在跳', () => {
    const target = '4,300'
    const numeric = (s: string) => Number(s.replace(',', ''))
    const mid = rollDigits(target, 0.35)
    const late = rollDigits(target, 0.98)
    expect(numeric(mid)).not.toBe(4300)
    expect(Math.abs(numeric(late) - 4300)).toBeLessThanOrEqual(Math.abs(numeric(mid) - 4300))
  })

  it('把进度钳在 0-1 之外也不会崩', () => {
    expect(rollDigits('132', -3)).toBe('132')
    expect(rollDigits('132', 9)).toBe('132')
  })
})

describe('光标生命周期', () => {
  it('每支光标只在自己那段时段里存在，前后都是空的', () => {
    for (const track of TRACKS) {
      const before = cursorPoses(track.life.enter - 0.02, [track])[0]
      const inside = cursorPoses((track.life.enter + track.life.exit) / 2, [track])[0]
      const after = cursorPoses(track.life.exit + CURSOR_LIFE.fadeOut + 0.02, [track])[0]
      expect(before.presence, track.def.id).toBe(0)
      expect(inside.presence, track.def.id).toBeGreaterThan(0.9)
      expect(after.presence, track.def.id).toBe(0)
    }
  })

  it('登场时间彼此错开，不会 14 支一起冒出来', () => {
    const enters = TRACKS.map(track => track.life.enter).sort((a, b) => a - b)
    expect(enters[enters.length - 1] - enters[0]).toBeGreaterThan(0.4)
  })

  it('同一时刻在场的光标最多 7 支，画面不会被名字牌糊满', () => {
    let peak = 0
    for (const p of SWEEP) {
      peak = Math.max(peak, cursorPoses(p, TRACKS).filter(pose => pose.presence > 0.002).length)
    }
    expect(peak).toBeLessThanOrEqual(7)
  })

  it('镜头收束时画面上没有残留的光标', () => {
    const poses = cursorPoses(1, TRACKS).filter(pose => pose.presence > 0.002)
    expect(poses).toHaveLength(0)
  })
})

describe('activeOp', () => {
  it('拖拽中段能挑出一笔正在拖的', () => {
    for (const op of BUILD_OPS.filter(o => o.mode === 'drag' && !o.quiet)) {
      const [from, to] = opWindow(op)
      const found = activeOp(from + (to - from) * 0.5, BUILD_OPS)
      expect(found, op.id).toBeDefined()
      expect(found!.mode).toBe('drag')
    }
  })

  it('一笔都没在拖时返回空', () => {
    expect(activeOp(0, BUILD_OPS)).toBeUndefined()
    expect(activeOp(1, BUILD_OPS)).toBeUndefined()
  })
})
