import { describe, expect, it } from 'vitest'
import { ENTRANCE_OFFSET_PX, getTitleMotion, SWEEP_END_OFFSET_FRAMES } from './mgTitle'

const FPS = 30
const DURATION = 120

describe('getTitleMotion', () => {
  it('第 0 帧：未入场、位移最大、进度条为 0', () => {
    const motion = getTitleMotion({ frame: 0, fps: FPS, durationInFrames: DURATION })

    expect(motion.entrance).toBe(0)
    expect(motion.offsetY).toBeCloseTo(ENTRANCE_OFFSET_PX, 5)
    expect(motion.sweepPercent).toBe(0)
  })

  it('片尾帧：完全入场、位移收敛到 0、进度条 100%', () => {
    const motion = getTitleMotion({ frame: DURATION - 1, fps: FPS, durationInFrames: DURATION })

    expect(motion.entrance).toBeGreaterThan(0.99)
    expect(motion.offsetY).toBeLessThan(0.4)
    expect(motion.sweepPercent).toBe(100)
  })

  it('扫过窗口结束后保持 100%，越界帧不会溢出', () => {
    const windowEnd = DURATION - SWEEP_END_OFFSET_FRAMES
    expect(getTitleMotion({ frame: windowEnd, fps: FPS, durationInFrames: DURATION }).sweepPercent).toBe(100)
    expect(getTitleMotion({ frame: DURATION + 60, fps: FPS, durationInFrames: DURATION }).sweepPercent).toBe(100)
  })

  it('入场随时间轴单调递增，不会回弹', () => {
    const entrances = Array.from(
      { length: 30 },
      (_, frame) => getTitleMotion({ frame, fps: FPS, durationInFrames: DURATION }).entrance,
    )

    entrances.forEach((value, index) => {
      if (index > 0) {
        expect(value).toBeGreaterThanOrEqual(entrances[index - 1])
      }
    })
  })

  it('极短片长不会除零退化（窗口被兜底为 1 帧）', () => {
    const motion = getTitleMotion({ frame: 10, fps: FPS, durationInFrames: 5 })

    expect(Number.isFinite(motion.sweepPercent)).toBe(true)
    expect(motion.sweepPercent).toBe(100)
  })
})
