import { useCurrentFrame, useVideoConfig } from 'remotion'
import { BUILD_OPS, CURSORS } from '@/data/builderLayout'
import {
  activeOp,
  buildStates,
  cursorPoses,
  cursorTracks,
  phase,
  springIn,
  stateOf,
  TIMELINE,
} from '@/animations/pageBuilder'
import type { CursorState, ElementState, SelectionState } from './PageBuilderView'
import { PageBuilderView } from './PageBuilderView'

const TRACKS = cursorTracks(CURSORS, BUILD_OPS)

/**
 * 适配层：只把「第几帧」换算成各层数值，全部计算都在 animations/pageBuilder.ts。
 * 画面从「只有一个纯色空窗口」开始，107 笔建造由 14 支光标逐元素完成。
 */
export const PageBuilder: React.FC = () => {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  const p = frame / durationInFrames

  const windowProgress = springIn(phase(p, TIMELINE.fadeIn), 20, 22)
  const settleProgress = phase(p, TIMELINE.settle)

  const states = buildStates(p, BUILD_OPS)

  const elements: Record<string, ElementState> = {}
  for (const s of states) {
    elements[s.id] = {
      reveal: s.reveal,
      content: s.content,
      select: s.select,
      mode: s.mode,
      rect: s.rect,
    }
  }

  /** 同时可能有好几笔在拖，所以选框是列表而不是单个；细长元素（下划线、进度条）不挂选框 */
  const selections: SelectionState[] = states
    .filter(s => s.select > 0.001)
    .map(s => ({
      id: s.id,
      rect: s.rect,
      opacity: s.select,
      label: Math.round(s.rect.width) + ' x ' + Math.round(s.rect.height),
    }))

  /** 参考线跟着「最该被标注的那一笔」走：正在拖拽的最后一笔 */
  const guideOp = activeOp(p, BUILD_OPS)
  const guideState = guideOp ? stateOf(states, guideOp.id) : undefined
  const guides = {
    x: guideState ? guideState.rect.x + guideState.rect.width : 0,
    y: guideState ? guideState.rect.y + guideState.rect.height : 0,
    xLabel: guideState ? String(Math.round(guideState.rect.x + guideState.rect.width)) : '',
    yLabel: guideState ? String(Math.round(guideState.rect.y + guideState.rect.height)) : '',
    opacity: guideState ? Math.min(1, guideState.select * 1.4) : 0,
  }

  const poses = cursorPoses(p, TRACKS)
  /** 每支光标只在自己那几笔作业前后存在，presence 为 0 时视图层直接不画 */
  const cursors: CursorState[] = poses.map(pose => ({
    def: pose.def,
    x: pose.x,
    y: pose.y,
    ripple: pose.pressing > 0.15 ? pose.pressing : -1,
    presence: pose.presence,
  }))

  return (
    <PageBuilderView
      windowProgress={windowProgress}
      settleProgress={settleProgress}
      elements={elements}
      selections={selections}
      guides={guides}
      cursors={cursors}
    />
  )
}
