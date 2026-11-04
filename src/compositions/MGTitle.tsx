import type { FC } from 'react'
import { useCurrentFrame, useVideoConfig } from 'remotion'
import { getTitleMotion } from '@/animations/mgTitle'
import { MGTitleView } from '@/compositions/MGTitleView'

export type MGTitleProps = {
  title: string
}

/**
 * Remotion 适配层：只负责从渲染上下文取时间，把数值交给 MGTitleView。
 * 动画数学在 src/animations/mgTitle.ts（可单测），视图在 MGTitleView（可 Storybook）。
 */
export const MGTitle: FC<MGTitleProps> = ({ title }) => {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()

  return (
    <MGTitleView
      title={title}
      frame={frame}
      durationInFrames={durationInFrames}
      motion={getTitleMotion({ frame, fps, durationInFrames })}
    />
  )
}
