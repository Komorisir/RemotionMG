import type { Meta, StoryObj } from '@storybook/react-vite'
import type { FC, ReactNode } from 'react'
import { getTitleMotion } from '@/animations/mgTitle'
import { VIDEO } from '@/config/video'
import { MGTitleView } from './MGTitleView'

/**
 * Storybook 只挂载纯展示层 MGTitleView —— 它不依赖 Remotion 渲染上下文。
 * 时间轴的真值仍在 Remotion Studio（pnpm dev）；Storybook 负责「静态状态评审」：
 * 设计走查、多状态并排、组件回收复用，不需要渲染视频。
 */

/** 把 1920x1080 的舞台等比缩到 960x540，方便在浏览器里一眼看全 */
const Stage: FC<{ children: ReactNode }> = ({ children }) => (
  <div
    style={{
      position: 'relative',
      width: '100%',
      maxWidth: 960,
      margin: '24px auto',
      overflow: 'hidden',
      boxShadow: '0 24px 60px rgba(0, 0, 0, 0.45)',
      aspectRatio: `${VIDEO.width} / ${VIDEO.height}`,
    }}
  >
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: VIDEO.width,
        height: VIDEO.height,
        transform: 'scale(0.5)',
        transformOrigin: 'top left',
      }}
    >
      {children}
    </div>
  </div>
)

type StoryArgs = {
  title: string
  fps: number
  durationInFrames: number
  frame: number
}

const meta = {
  title: 'MG/Title',
  parameters: { layout: 'fullscreen' },
  args: {
    title: 'Remotion MG',
    fps: VIDEO.fps,
    durationInFrames: VIDEO.durationInFrames,
    frame: 0,
  },
  argTypes: {
    frame: {
      name: '帧号',
      control: { type: 'range', min: 0, max: VIDEO.durationInFrames - 1, step: 1 },
    },
    title: { name: '标题', control: 'text' },
    fps: { control: 'number' },
    durationInFrames: { control: 'number' },
  },
  // args 是「时间轴参数」而非组件 props：组件 props 里的 motion 由 getTitleMotion 现算，
  // 这样 Storybook 里的状态与真实时间轴严格同源，不会出现预览和成片两套数值。
  render: ({ title, fps, durationInFrames, frame }) => (
    <Stage>
      <MGTitleView
        title={title}
        frame={frame}
        durationInFrames={durationInFrames}
        motion={getTitleMotion({ frame, fps, durationInFrames })}
      />
    </Stage>
  ),
} satisfies Meta<StoryArgs>

export default meta
type Story = StoryObj<typeof meta>

export const Entrance: Story = {
  name: '入场（第 0 帧）',
  args: { frame: 0 },
}

export const Midpoint: Story = {
  name: '中段（第 60 帧）',
  args: { frame: 60 },
}

export const Outro: Story = {
  name: '片尾（第 119 帧）',
  args: { frame: 119 },
}
