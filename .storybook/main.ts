import { fileURLToPath } from 'node:url'
import type { StorybookConfig } from '@storybook/react-vite'

const srcDir = fileURLToPath(new URL('../src', import.meta.url))

/**
 * Storybook 用 Vite 构建（框架包自带 builder-vite），与 Remotion 的 webpack 链路完全隔离，
 * 互不影响。唯一需要对齐的是路径别名：直接读同一份约定，避免出现两套 '@/xxx' 解析规则。
 */
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  async viteFinal(viteConfig) {
    const existingAlias = viteConfig.resolve?.alias
    const alias = Array.isArray(existingAlias)
      ? [...existingAlias, { find: '@', replacement: srcDir }]
      : { ...(existingAlias as Record<string, string> | undefined), '@': srcDir }

    return {
      ...viteConfig,
      resolve: {
        ...viteConfig.resolve,
        alias,
      },
    }
  },
}

export default config
