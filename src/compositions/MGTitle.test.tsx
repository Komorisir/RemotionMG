import { render, screen } from '@testing-library/react'
import type * as RemotionModule from 'remotion'
import { describe, expect, it, vi } from 'vitest'
import { getTitleMotion } from '@/animations/mgTitle'
import { MGTitle } from './MGTitle'

/**
 * 适配层测试：只替换 Remotion 的两个时间 Hook，spring / interpolate 保持真实实现。
 * 这样验证的是「上下文里的帧号有没有被正确接到 getTitleMotion 上」，
 * 而不是用伪造的数学结果自证自明。
 */
vi.mock('remotion', async importOriginal => {
  const actual = await importOriginal<typeof RemotionModule>()

  return {
    ...actual,
    useCurrentFrame: () => 60,
    useVideoConfig: () => ({
      id: 'Main',
      width: 1920,
      height: 1080,
      fps: 30,
      durationInFrames: 120,
      defaultProps: {},
    }),
  }
})

describe('MGTitle（Remotion 适配层）', () => {
  it('把 useCurrentFrame / useVideoConfig 接到 getTitleMotion 上', () => {
    const expected = getTitleMotion({ frame: 60, fps: 30, durationInFrames: 120 })

    render(<MGTitle title='Remotion MG' />)

    expect(screen.getByTestId('mg-title-progress').style.width).toBe(`${expected.sweepPercent}%`)
    expect(screen.getByRole('heading', { level: 1 }).style.opacity).toBe(String(expected.entrance))
    expect(screen.getByText('frame 60 / 120')).toBeInTheDocument()
  })

  it('把 title prop 透传给视图层', () => {
    render(<MGTitle title='MG 分镜' />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('MG 分镜')
  })
})
