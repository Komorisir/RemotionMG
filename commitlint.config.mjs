/**
 * Conventional Commits 规范，与 .husky/commit-msg 配合使用。
 * 用 .mjs 而不是 .js：仓库默认 CJS，但 commitlint >= 19 原生支持 ESM 配置，
 * 且 .js 写 module.exports 会被 ESLint 当成 ESM 解析而报 no-undef。
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert', 'anim'],
    ],
    'subject-case': [0],
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [0],
  },
}
