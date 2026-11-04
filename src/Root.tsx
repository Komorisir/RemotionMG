import type { FC } from 'react'
import { Composition, Folder } from 'remotion'
import { MGTitle } from '@/compositions/MGTitle'
import { VIDEO } from '@/config/video'

/**
 * 所有 Composition 的注册中心。
 * 新增分镜 = 在此追加一个 <Composition />，id 必须是 PascalCase（Remotion 规则会校验）。
 */
export const RemotionRoot: FC = () => {
  return (
    <Folder name='MG'>
      <Composition
        id='Main'
        component={MGTitle}
        durationInFrames={VIDEO.durationInFrames}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
        defaultProps={{ title: 'Remotion MG' }}
      />
    </Folder>
  )
}
