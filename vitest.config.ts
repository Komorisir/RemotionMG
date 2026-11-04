import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

/**
 * 单测只覆盖「纯逻辑 + 纯展示层」，不挂载 Remotion 渲染上下文：
 * - src/animations/*      帧号 -> 数值的换算
 * - src/config/*          规格常量
 * - src/compositions/*View 纯展示组件（不含 Remotion Hook）
 * 时间轴整合层的真值由 pnpm build:still / Studio 预览负责，见 README「测试策略」。
 */
export default defineConfig({
  resolve: {
    // 与 tsconfig paths / remotion.config.ts 保持同一个别名
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'happy-dom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    // 让 Vitest 真正编译 .less / .module.less，类名映射与 webpack 侧一致
    css: {
      modules: { classNameStrategy: 'non-scoped' },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/**/*.stories.tsx', 'src/types/**', 'src/index.ts', 'src/Root.tsx'],
    },
  },
})
