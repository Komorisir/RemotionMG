import type { Preview } from '@storybook/react-vite'
// 与 Remotion 入口保持同一份全局样式（重置 + 字体抗锯齿）
import '../src/styles/global.less'

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i },
    },
  },
  decorators: [
    Story => (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          minHeight: '100vh',
          background: '#0b1020',
        }}
      >
        <Story />
      </div>
    ),
  ],
}

export default preview
