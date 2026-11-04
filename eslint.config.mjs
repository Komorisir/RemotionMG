import { config as remotionConfig } from '@remotion/eslint-config-flat'
import prettierConfig from 'eslint-config-prettier'

/**
 * 规则集来源与理由：
 * 1. @remotion/eslint-config-flat —— Remotion 官方 flat config（ESLint >= 9）：
 *    内含 @eslint/js recommended + typescript-eslint recommended + react / react-hooks 插件
 *    + @remotion/eslint-plugin（valid-composition-and-folder-name 等 Remotion 专属规则）。
 * 2. eslint-config-prettier —— 关闭所有与格式化冲突的规则，格式化只由 Prettier 负责，避免两套标准打架。
 * 3. 下方按 MG 视频渲染场景做少量覆盖（视频帧不是可交互网页，故不引入 eslint-plugin-jsx-a11y）。
 */
export default [
  ...remotionConfig,

  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // Remotion 官方把 jsx-key 关掉了；MG 场景列表渲染很常见，漏 key 会导致重排闪烁，这里恢复为 error
      'react/jsx-key': 'error',
      'react/no-unknown-property': 'error',
      'react/self-closing-comp': 'warn',
      '@typescript-eslint/consistent-type-imports': ['warn', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },

  // 必须放最后：覆盖掉所有格式化相关规则
  prettierConfig,

  {
    ignores: [
      'node_modules/**',
      'out/**',
      'build/**',
      'dist/**',
      'coverage/**',
      'storybook-static/**',
      '.husky/_/**',
      'pnpm-lock.yaml',
    ],
  },
]
