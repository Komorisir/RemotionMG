import type { FC } from 'react'
import type { TitleMotion } from '@/animations/mgTitle'
import { FONT_STACK } from '@/config/video'
import styles from '@/styles/MGTitle.module.less'

export type MGTitleViewProps = {
  title: string
  /** 当前帧，仅用于字幕文本 */
  frame: number
  durationInFrames: number
  /** 由 getTitleMotion() 算出的动画数值，组件本身不读 Remotion 上下文 */
  motion: TitleMotion
}

/**
 * 纯展示层（presentational）。
 * 不调用任何 Remotion Hook —— 这样它既能在 Remotion 时间轴上渲染，
 * 也能被 Storybook 和 Testing Library 直接消费，两者共享同一份实现，不存在「预览一套、成片一套」。
 */
export const MGTitleView: FC<MGTitleViewProps> = ({ title, frame, durationInFrames, motion }) => {
  return (
    <div className={styles.stage} style={{ fontFamily: FONT_STACK }}>
      <div className={styles.card}>
        <h1 className={styles.title} style={{ opacity: motion.entrance, transform: `translateY(${motion.offsetY}px)` }}>
          {title}
        </h1>
        <div className={styles.track}>
          <div className={styles.bar} data-testid='mg-title-progress' style={{ width: `${motion.sweepPercent}%` }} />
        </div>
        <p className={styles.caption}>
          frame {frame} / {durationInFrames}
        </p>
      </div>
    </div>
  )
}
