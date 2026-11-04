import { describe, expect, it } from 'vitest'
import { FONT_STACK, VIDEO } from './video'

describe('VIDEO 规格', () => {
  it('是标准 1080p30 规格', () => {
    expect(VIDEO.width).toBe(1920)
    expect(VIDEO.height).toBe(1080)
    expect(VIDEO.fps).toBe(30)
  })

  it('宽高都是偶数，避免 H.264 编码奇数尺寸报错', () => {
    expect(VIDEO.width % 2).toBe(0)
    expect(VIDEO.height % 2).toBe(0)
  })

  it('时长是正整数帧', () => {
    expect(Number.isInteger(VIDEO.durationInFrames)).toBe(true)
    expect(VIDEO.durationInFrames).toBeGreaterThan(0)
  })

  it('字体栈包含中文回退与通用兜底', () => {
    expect(FONT_STACK).toContain('PingFang SC')
    expect(FONT_STACK).toContain('Microsoft YaHei')
    expect(FONT_STACK.endsWith('sans-serif')).toBe(true)
  })
})
