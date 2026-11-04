import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { TitleMotion } from '@/animations/mgTitle'
import { MGTitleView } from './MGTitleView'
import styles from '@/styles/MGTitle.module.less'

const MOTION: TitleMotion = { entrance: 1, offsetY: 0, sweepPercent: 50 }

const renderView = (overrides: { title?: string; frame?: number; motion?: Partial<TitleMotion> } = {}) =>
  render(
    <MGTitleView
      title={overrides.title ?? 'Remotion MG'}
      frame={overrides.frame ?? 60}
      durationInFrames={120}
      motion={{ ...MOTION, ...overrides.motion }}
    />,
  )

describe('MGTitleView', () => {
  it('渲染标题与帧计数', () => {
    renderView()

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Remotion MG')
    expect(screen.getByText('frame 60 / 120')).toBeInTheDocument()
  })

  it('把 motion.sweepPercent 映射成进度条宽度', () => {
    renderView({ motion: { sweepPercent: 42 } })

    expect(screen.getByTestId('mg-title-progress').style.width).toBe('42%')
  })

  it('把 motion.entrance / offsetY 映射成透明度与位移', () => {
    renderView({ motion: { entrance: 0.5, offsetY: 20 } })

    const title = screen.getByRole('heading', { level: 1 })
    expect(title.style.opacity).toBe('0.5')
    expect(title.style.transform).toBe('translateY(20px)')
  })

  it('类名来自 CSS Modules，样式映射没有断链', () => {
    const { container } = renderView()

    // classNameStrategy 设为 non-scoped 时，styles.stage 就是原始类名
    expect(styles.stage).toBe('stage')
    expect(container.firstElementChild).toHaveClass(styles.stage)
  })
})
