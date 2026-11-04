# Agent.md

> 本文件是 **RemotionMG 的协作契约**，人类协作者与 AI 助手同等适用。
> 与 README 分工：README 面向「第一次接触本项目的人」，解释这是什么、怎么跑起来；本文件面向「已经要动手改代码的人或助手」，约束怎么改、怎么验、不许做什么。
> 事实核实时间：2026-11-04。核实方式与出处见附录 A。凡本文件与仓库实际配置冲突，**以配置为准**，并请顺手修正本文件（这是被允许的修改）。

## 1. 项目定位与技术栈

- **定位**：MG（Motion Graphics）动画工程骨架。当前仓库只有 **1 个 Composition**（`Main`），规格 1920×1080 / 30fps / 120 帧，画面为占位标题动画（标题 + 圆角卡片 + 进度条 + 字幕）。
- **业务边界与成片交付目标**：（待补充：面向哪类 MG 场景、成片交付格式与验收标准、是否涉及配音/字幕/素材版权）
- **当前阶段**：只完成工程化搭建，尚未进入正式分镜制作。

技术栈（版本均取自 `package.json`，**全部是精确版本，无 `^` / `~`**）：

| 分类     | 技术 / 包                                                                 | 版本                              |
| -------- | ------------------------------------------------------------------------- | --------------------------------- |
| 视频框架 | `remotion` / `@remotion/cli` / `@remotion/bundler`                        | 4.0.540                           |
| 语言     | `typescript`                                                              | 5.9.3                             |
| UI       | `react` / `react-dom`                                                     | 19.3.1                            |
| 样式     | `less` / `less-loader` / `css-loader` / `style-loader`                    | 4.9.1 / 13.1.0 / 7.1.5 / 4.0.0    |
| 组件预览 | `storybook` / `@storybook/react-vite` / `@storybook/addon-docs`           | 10.6.5                            |
| 单测     | `vitest` / `@vitest/coverage-v8` / `@testing-library/react` / `happy-dom` | 4.1.12 / 4.1.12 / 16.3.3 / 21.0.4 |
| 代码检查 | `eslint` / `@remotion/eslint-config-flat` / `prettier`                    | 10.14.0 / 4.0.540 / 3.9.10        |
| 提交约束 | `husky` / `lint-staged` / `@commitlint/cli`                               | 9.1.7 / 17.6.0 / 21.2.4           |
| 包管理   | `pnpm`（`packageManager` 字段）                                           | 10.13.1                           |

**一条必须记住的链路事实**：Remotion 用 webpack（`esbuild-loader` 转译）产出渲染包，`tsc` 设置了 `noEmit`，**不参与任何产物生成**。所以类型安全只有 `pnpm typecheck` 一条兜底，跳过它等于没有类型检查。

## 2. 环境要求与常用命令

### 2.1 环境要求

| 项          | 要求                                                       | 出处                              |
| ----------- | ---------------------------------------------------------- | --------------------------------- |
| Node.js     | `>=20.19.0`（本地实测 20.19.6）                            | `package.json` → `engines.node`   |
| pnpm        | `>=9.0.0`；仓库锁定 10.13.1                                | `engines.pnpm` / `packageManager` |
| 操作系统    | 不限；本地实测 Windows + PowerShell，CI 为 `ubuntu-latest` | `.github/workflows/ci.yml`        |
| CI 固定版本 | Node `20.19.6` / pnpm `10.13.1` / `TZ=Asia/Shanghai`       | `ci.yml` → `env`                  |

### 2.2 安装依赖

```bash
pnpm install                    # 首次安装；依赖变更后也要跑（会顺带执行 prepare -> husky 安装 git hooks）
pnpm install --frozen-lockfile  # 校验 lockfile 与 package.json 一致；CI 用的就是这条
```

> 易错点：CI 使用 `--frozen-lockfile`，本地只跑 `pnpm install` 而不提交更新后的 `pnpm-lock.yaml`，CI 会以 `ERR_PNPM_OUTDATED_LOCKFILE` 直接失败。

### 2.3 常用命令

下表**全部来自 `package.json` → `scripts`**。表中不存在的脚本（例如 `pnpm preview`）就是不存在，不要臆造。

| 场景             | 命令                                              | 用途                                                                                        |
| ---------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 开发预览         | `pnpm dev`                                        | 启动 Remotion Studio（HMR）。`pnpm studio` 等价                                             |
| 同上（指定端口） | `pnpm exec remotion studio --port=3111 --no-open` | 端口占用时用；实际地址以终端输出为准                                                        |
| 只打包           | `pnpm bundle`                                     | 跑 webpack，输出到 `build/`；**不下载浏览器、不渲染**，验证 Less 规则与 `@/` 别名最快的命令 |
| 渲染成片         | `pnpm build`                                      | `remotion render` → `out/main.mp4`                                                          |
| 渲染单帧         | `pnpm build:still`                                | 第 60 帧 → `out/still.png`，验样式最省时                                                    |
| Lint             | `pnpm lint` / `pnpm lint:fix`                     | ESLint 检查 / 自动修复（含 `--fix` 无法解决的部分需手改）                                   |
| 类型检查         | `pnpm typecheck` / `pnpm typecheck:watch`         | `tsc --noEmit` 单次 / 监听                                                                  |
| 单测             | `pnpm test` / `pnpm test:watch`                   | Vitest 单次 / 监听                                                                          |
| 覆盖率           | `pnpm test:coverage`                              | 输出 `coverage/`（text + html + lcov）                                                      |
| 组件预览         | `pnpm storybook`                                  | 端口 6006，不自动开浏览器、关遥测                                                           |
| 构建静态站       | `pnpm build:storybook`                            | 输出 `storybook-static/`                                                                    |
| Storybook 冒烟   | `pnpm storybook:smoke`                            | `--smoke-test --ci`，启动即退出，验证 SB 配置没坏                                           |
| 格式化           | `pnpm format` / `pnpm format:check`               | Prettier 写入 / 校验                                                                        |
| 三件套           | `pnpm check`                                      | `lint && typecheck && test`，**不含 format:check、不含打包**                                |
| 版本升级         | `pnpm upgrade`                                    | 对齐所有 `remotion` / `@remotion/*` 版本（`remotion upgrade` 的包装）                       |
| 安装钩子         | `pnpm prepare`                                    | 重新安装 husky 的 git hooks（`pnpm install` 后自动执行，一般无需手敲）                      |

### 2.4 提交时的两条命令（由钩子自动执行，一般不需要手敲）

```bash
pnpm exec lint-staged              # .husky/pre-commit 调用
pnpm exec commitlint --edit "$1"   # .husky/commit-msg 调用
```

## 3. 目录结构与文件职责

```text
RemotionMG/
├── .github/workflows/ci.yml     # CI：quality -> build -> render-smoke(手动)
├── .husky/
│   ├── pre-commit               # pnpm exec lint-staged
│   └── commit-msg               # pnpm exec commitlint --edit "$1"
├── .storybook/
│   ├── main.ts                  # stories 匹配 + react-vite 框架 + @ 别名注入
│   └── preview.tsx              # 全局样式 + 深色画布 decorator
├── public/.gitkeep              # Remotion staticFile() 的静态资源根目录
├── src/
│   ├── index.ts                 # 入口：registerRoot + 引入 global.less
│   ├── Root.tsx                 # Composition 注册中心（Folder "MG" / Composition id="Main"）
│   ├── animations/
│   │   ├── mgTitle.ts           # 纯函数：帧号 -> {entrance, offsetY, sweepPercent}
│   │   └── mgTitle.test.ts
│   ├── compositions/
│   │   ├── MGTitle.tsx          # 适配层：Remotion Hook -> getTitleMotion -> MGTitleView
│   │   ├── MGTitleView.tsx      # 纯展示层：接收 frame/motion，不调 Remotion Hook
│   │   ├── MGTitle.test.tsx
│   │   ├── MGTitleView.test.tsx
│   │   └── MGTitleView.stories.tsx
│   ├── config/video.ts          # VIDEO（fps/width/height/durationInFrames）+ FONT_STACK
│   ├── styles/
│   │   ├── tokens.less          # 设计令牌：变量 + 混入，无 CSS 输出
│   │   ├── MGTitle.module.less  # CSS Modules 局部样式
│   │   └── global.less          # 全局重置
│   └── types/styles.d.ts        # *.less / *.module.less 的模块声明
├── commitlint.config.mjs
├── eslint.config.mjs
├── package.json
├── pnpm-lock.yaml
├── prettier.config.mjs
├── remotion.config.ts           # Less 规则 + TsconfigPathsPlugin
├── tsconfig.json
├── vitest.config.ts
├── vitest.setup.ts
└── README.md
```

### 3.1 三条会牵连多处的硬约定

1. **`@/` 别名有 4 个解析入口，改一处等于破坏其余三处**：
   - `tsconfig.json` → `compilerOptions.paths`
   - `remotion.config.ts` → `TsconfigPathsPlugin`（webpack 侧）
   - `vitest.config.ts` → `resolve.alias`
   - `.storybook/main.ts` → `viteFinal` 里的 `resolve.alias`

   新增任何构建/测试工具，必须同样注入这条别名，否则会出现「`tsc` 通过、运行时报 Module not found」。

2. **样式分三层，别混**：
   - `tokens.less`：只有变量与 `.mixin()`，**不产生任何 CSS**，被另外两个 `.less` 用 `@import './tokens.less';` 引入；
   - `*.module.less`：局部作用域，组件内 `import styles from '@/styles/X.module.less'`；
   - `global.less`：全局样式，只在 `src/index.ts` 与 `.storybook/preview.tsx` 各引入一次，禁止在组件里重复引入。

3. **Composition 只能注册在 `src/Root.tsx`**，且 `id` 必须是 PascalCase —— 由 `@remotion/valid-composition-and-folder-name`（error 级）强制，Folder 命名同理。

## 4. 编码与提交规范

### 4.1 TypeScript（`tsconfig.json`）

| 选项                                    | 值                                                                               | 为什么必须是这样                                                                                                          |
| --------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `strict`                                | `true`                                                                           | 全量严格模式；关掉它等于放弃类型检查                                                                                      |
| `noEmit`                                | `true`                                                                           | 产物由 webpack 生成，`tsc` 只做检查                                                                                       |
| `isolatedModules`                       | `true`                                                                           | 与 esbuild 单文件转译一致；因此**纯类型 re-export 必须写 `export type`**，否则运行时导入被擦除后报错                      |
| `noUnusedLocals` / `noUnusedParameters` | `true`                                                                           | 未使用的变量/参数直接报错；确需保留时用 `_` 前缀（与 ESLint 的 `argsIgnorePattern: '^_' / varsIgnorePattern: '^_'` 对齐） |
| `jsx`                                   | `react-jsx`                                                                      | React 17+ 自动运行时，不需要 `import React`                                                                               |
| `moduleResolution`                      | `bundler`                                                                        | 允许无扩展名导入，与打包器行为一致                                                                                        |
| `baseUrl` / `paths`                     | `.` / `@/* -> ./src/*`                                                           | 别名的唯一事实来源                                                                                                        |
| `include`                               | `src`, `remotion.config.ts`, `vitest.config.ts`, `vitest.setup.ts`, `.storybook` | 配置文件本身也要被类型检查，否则它们只会在运行时炸                                                                        |
| `skipLibCheck`                          | `true`                                                                           | 跳过 `node_modules` 的 `.d.ts` 内部校验，换取检查速度（项目自身代码仍在 strict 下）                                       |

另外：`src/types/styles.d.ts` 声明了 `*.module.less` 与 `*.less`，**删掉它 `tsc` 会报 TS2307**。

### 4.2 样式（Less）

- 只有文件名含 `.module` 才开 CSS Modules（`css-loader` 的 `modules.auto: true`）；`namedExport: false` 意味着**只能用默认导入**：

  ```tsx
  import styles from '@/styles/MGTitle.module.less' // 正确
  // import { stage } from '@/styles/MGTitle.module.less' // 错误：namedExport 是 false
  ```

- 组件里写 `className={styles.stage}`；类名在 `.less` 中用 kebab-case 或 camelCase 均可，但**同一文件内保持一致**。
- `remotion.config.ts` 里 `lessOptions.javascriptEnabled: false`。**不要打开它**：Less 的 JS 表达式是编译期执行任意代码，且与 SSR 渲染环境无关，属于纯风险。
- 写样式优先复用 `tokens.less` 的变量与 `.center-flex()` 混入；`fade()` / `lighten()` 这类 Less 内置函数在编译期求值，运行时零成本，优先于手写 rgba。

### 4.3 代码风格（Prettier，`prettier.config.mjs`）

| 项                               | 值                                                          |
| -------------------------------- | ----------------------------------------------------------- |
| `semi`                           | `false`（不写行尾分号）                                     |
| `singleQuote` / `jsxSingleQuote` | `true` / `true`                                             |
| `printWidth`                     | `120`                                                       |
| `tabWidth`                       | `2`                                                         |
| `trailingComma`                  | `all`                                                       |
| `arrowParens`                    | `avoid`                                                     |
| `endOfLine`                      | `lf`                                                        |
| `*.less` 覆盖                    | `singleQuote: false`（`@import "./tokens.less";` 用双引号） |

**不要手工对齐格式**，直接 `pnpm format`。`.editorconfig` 已与之对齐（2 空格、LF、UTF-8、文件末尾空行）。

### 4.4 ESLint（`eslint.config.mjs`，以下为 `--print-config` 实测生效值）

| 规则                                          | 级别  | 说明                                                            |
| --------------------------------------------- | ----- | --------------------------------------------------------------- |
| `@typescript-eslint/no-explicit-any`          | error | **禁止 `any`**，需要兜底用 `unknown` + 收窄                     |
| `@typescript-eslint/no-unused-vars`           | error | 允许 `_` 前缀豁免                                               |
| `@typescript-eslint/consistent-type-imports`  | warn  | 类型导入用 `import type`（`fixStyle: inline-type-imports`）     |
| `@remotion/valid-composition-and-folder-name` | error | Composition / Folder 命名规范                                   |
| `react/jsx-key`                               | error | 官方默认关闭，本项目开启：漏 key 会导致动画重排闪烁             |
| `react/no-unknown-property`                   | error | 防手写错属性名                                                  |
| `react/self-closing-comp`                     | warn  | 空组件自闭合                                                    |
| `react-hooks/rules-of-hooks`                  | error | Hook 调用位置                                                   |
| `react-hooks/exhaustive-deps`                 | warn  | 依赖数组完整性                                                  |
| `no-debugger`                                 | error | 不留调试断点                                                    |
| `no-console`                                  | warn  | 仅允许 `console.warn` / `console.error`（`console.log` 会告警） |
| `prefer-const` / `no-var`                     | error | 基础最佳实践                                                    |

- 格式化规则全部由 `eslint-config-prettier` 关闭，**格式只由 Prettier 一个标准说了算**。
- 规则集来源：`@remotion/eslint-config-flat`（内含 `@eslint/js` recommended + `typescript-eslint` recommended + react / react-hooks 插件），在其之上只做最小覆盖。
- **不引入 `eslint-plugin-jsx-a11y`**：视频帧渲染结果不是可交互网页，无障碍语义在此场景无落点。
- `ignores` 覆盖 `node_modules`、`out`、`build`、`dist`、`coverage`、`storybook-static`、`.husky/_`、`pnpm-lock.yaml`。

### 4.5 提交规范

- 遵循 **Conventional Commits**，由 `commitlint.config.mjs` 约束：

  | 约束                   | 值                                                                                        |
  | ---------------------- | ----------------------------------------------------------------------------------------- |
  | `type-enum`            | `feat` `fix` `docs` `style` `refactor` `perf` `test` `build` `ci` `chore` `revert` `anim` |
  | `header-max-length`    | 100                                                                                       |
  | `subject-case`         | 关闭（中文标题不受大小写规则限制）                                                        |
  | `body-max-line-length` | 关闭                                                                                      |

  `anim` 是本项目扩展的 type，用于**动画表现层改动**（关键帧、插值、缓动），与 `feat`（功能）、`style`（格式）区分开。

- 钩子链：`pre-commit` → `lint-staged`；`commit-msg` → `commitlint`。

  | lint-staged 匹配                    | 执行                                |
  | ----------------------------------- | ----------------------------------- |
  | `*.{ts,tsx}`                        | `eslint --fix` → `prettier --write` |
  | `*.{json,md,css,less,mjs,yml,yaml}` | `prettier --write`                  |

  注意：lint-staged **只处理本次已暂存的文件**，未暂存文件里的问题不会被修，也不会阻止提交。

- **分支策略 / 评审流程 / 发布方式**：（待补充：主干开发还是 Git Flow、是否需要 PR 模板与至少几人 approve、成片如何交付归档）

## 5. CI 与本地验证

### 5.1 流水线事实（`.github/workflows/ci.yml`）

- **触发**：`push`（`main` / `master`）、`pull_request`、`workflow_dispatch`（带布尔入参 `render_smoke`，默认 `false`）。
- **并发**：同 workflow + ref 只保留最新一条（`cancel-in-progress: true`）。
- **权限**：`contents: read`。

| job            | 依赖             | 内容                                                                                                                                |
| -------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `quality`      | —                | `pnpm install --frozen-lockfile` → `pnpm lint` → `pnpm typecheck` → `pnpm test:coverage` → 上传 `coverage/`（7 天）                 |
| `build`        | `needs: quality` | 安装 → `pnpm bundle` → `pnpm build:storybook` → 上传 `storybook-static/`（7 天）                                                    |
| `render-smoke` | `needs: build`   | **仅当** `workflow_dispatch` 且 `render_smoke == 'true'`：缓存 `node_modules/.remotion` → `pnpm build:still` → 上传 `out/still.png` |

### 5.2 本地复刻 CI（推送前的最小闭环）

```bash
pnpm install --frozen-lockfile   # 复刻 CI 的安装门禁
pnpm check                       # lint + typecheck + test
pnpm format:check                # `check` 不含格式化校验，CI 也不跑这条 —— 格式问题只能靠它发现
pnpm bundle                      # 验证 webpack 链路（Less 规则、@/ 别名、入口）
```

需要出片自检时再补：`pnpm build:still`（约十几秒，首次会下载 Headless Chrome）或 `pnpm build`。

### 5.3 现状与已知限制（截至 2026-11-04）

- 最近一次线上运行：提交 `66e085d`，结论 **passing**（`quality` + `build` 通过，`render-smoke` 按设计 skipped）。
- **`render-smoke` 尚未在 CI 上真实执行过**：ubuntu 上的 Chrome 系统依赖、缓存 key 是否命中都未经线上验证。想验证请手动触发（Actions → CI → Run workflow → 勾选 `render_smoke`）。
- **CI 不校验格式化**：`.github/workflows/ci.yml` 只跑 `lint` / `typecheck` / `test:coverage` / `bundle` / `build:storybook`，**没有 `format:check`**。格式跑偏不会让 CI 变红，也就不会有任何地方拦住它。
- **覆盖率没有阈值门禁**：`vitest.config.ts` 未配置 `coverage.thresholds`，`test:coverage` 只产出报告。因此覆盖率数字**不能**当作验证充分的证明。

## 6. 给 AI 助手的执行流程与禁区

### 6.1 每次动手前

1. 读本文件；涉及命令时回查 `package.json` → `scripts`，**表中没有的脚本就是不存在**。
2. 先读后改：动手前读目标文件与其直接依赖，不凭记忆改。
3. 判断改动是否触碰 3.1 的三条硬约定（别名 / 样式分层 / Composition 注册），触碰就要同步检查其余入口。
4. 最小改动，不顺手重构无关文件，不批量改格式制造噪音 diff。
5. 按 6.2 跑对应验证，**保留输出**。
6. 交付时只报「改了什么 + 跑了什么 + 输出是什么 + 还差什么」，不报「应该没问题」。
7. 提交/推送：（待补充：是否授权 AI 助手直接 `git commit` / `git push`；当前默认只给建议、不动 git）

### 6.2 改动类型 → 必跑验证

| 改了什么                          | 必须执行                                                                                     |
| --------------------------------- | -------------------------------------------------------------------------------------------- |
| `src/**/*.ts(x)`                  | `pnpm typecheck` + `pnpm lint` + `pnpm test`                                                 |
| `src/**/*.test.ts(x)`             | `pnpm test:coverage`                                                                         |
| 任何 `.less` / 新增样式文件       | `pnpm bundle`（必须，验证 Less 规则生效）；有 Chrome 缓存时加 `pnpm build:still` 目检        |
| `remotion.config.ts`              | `pnpm bundle` + `pnpm build:still`                                                           |
| `tsconfig.json` / 别名            | 四处别名同步 + `pnpm typecheck` + `pnpm bundle` + `pnpm test` + `pnpm storybook:smoke`       |
| `.storybook/**` / `*.stories.tsx` | `pnpm build:storybook` + `pnpm storybook:smoke`                                              |
| `package.json` 依赖               | `pnpm install`（更新 lockfile）+ `pnpm install --frozen-lockfile` 复验                       |
| `.github/workflows/ci.yml`        | 本地无 actionlint，只能靠推送后看 Actions 结果；（待补充：是否引入 `actionlint` 做本地校验） |
| 任意文件                          | 最后统一跑 `pnpm format:check`                                                               |

### 6.3 禁区（每条都附事实依据）

1. **不许为了让检查通过而改检查配置**。依据：CI 门禁就是 `lint` / `typecheck` / `test` 这三条命令，改规则等于改尺子，不是修问题。
2. **不许手改 `pnpm-lock.yaml`**。依据：`--frozen-lockfile` 会比对 `package.json` 与 lockfile 的 specifier，手改必然对不上。
3. **依赖变更必须连同 lockfile 一起提交**。依据同上，否则 CI 直接 `ERR_PNPM_OUTDATED_LOCKFILE`。
4. **不许提交构建产物**：`out/` `build/` `dist/` `coverage/` `storybook-static/` `node_modules/`。依据：`.gitignore` 已覆盖；CI 通过 artifact 取产物，仓库里只留源码。
5. **不许新增第二套路径别名解析**。依据：见 3.1 第 1 条，四入口任一缺失都会出现「`tsc` 绿、运行时红」。
6. **不许在 Less 里开 `javascriptEnabled`**。依据：`remotion.config.ts` 当前为 `false`，这是编译期代码执行的开关。
7. **不许把临时文件留在仓库目录**。依据：曾把 `.commit-msg.tmp` 随 `git add -A` 提交进历史（已 amend 修正）。写提交信息请用 `git commit -m`，或用 `-F` 并把文件放在仓库外。
8. **不许删测试、跳过测试、写永真断言来换绿灯**。依据：`pnpm check` 与 CI 的 `quality` job 都跑 `test`，这条门禁检验的是行为，不是通过率。
9. **不许 `git commit --no-verify` 绕过钩子**。依据：`pre-commit` / `commit-msg` 是 CI 门禁的本地预演，绕过去只是把红灯推给 CI。（待补充：是否存在紧急绕过流程）
10. **不许擅自 `pnpm upgrade` / `remotion upgrade`**。依据：所有依赖都是精确版本；Remotion 的 `remotion` 与 `@remotion/*` 必须版本一致，单独升级一个包会运行时报错。（待补充：升级的负责人与节奏）
11. **不许引入新的样式方案**（Tailwind / CSS-in-JS / 原生 `.css` 与 `.less` 混用）。依据：技术栈已锁定 `less`，且 `remotion.config.ts` 只为 `.less` 追加了规则。（待补充：是否允许例外及其审批方式）

### 6.4 交付汇报模板

```text
改动：<文件清单，逐条说明改了什么>
执行：<实际跑过的命令，逐条>
证据：<每条命令的关键输出行 / 产物路径与大小>
风险：<未覆盖的验证项、需要人拍板的点>
```

## 附录 A · 事实来源

| 事实类别                                  | 出处                                                                | 核实方式                                            |
| ----------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------- |
| 脚本、依赖版本、engines、lint-staged 配置 | `package.json`                                                      | 直接读取                                            |
| 编译选项                                  | `tsconfig.json`                                                     | 直接读取                                            |
| Less 规则、别名注入                       | `remotion.config.ts`                                                | 直接读取                                            |
| ESLint 规则级别                           | `eslint.config.mjs`                                                 | `pnpm exec eslint --print-config src/Root.tsx` 实测 |
| 格式化规则                                | `prettier.config.mjs` / `.prettierignore` / `.editorconfig`         | 直接读取                                            |
| 提交约束                                  | `commitlint.config.mjs` / `.husky/pre-commit` / `.husky/commit-msg` | 直接读取                                            |
| CI 结构与门禁                             | `.github/workflows/ci.yml`                                          | 直接读取                                            |
| 单测环境与覆盖范围                        | `vitest.config.ts` / `vitest.setup.ts`                              | 直接读取                                            |
| Storybook 配置                            | `.storybook/main.ts` / `.storybook/preview.tsx`                     | 直接读取                                            |
| 目录职责                                  | `src/` 实际文件                                                     | 目录遍历                                            |

## 附录 B · 待补充汇总

1. 项目业务边界与成片交付目标（第 1 节）
2. 分支策略、评审流程、发布方式（第 4.5 节）
3. 是否授权 AI 助手直接执行 `git commit` / `git push`（第 6.1 节）
4. 是否引入 `actionlint` 做 CI 配置的本地校验（第 6.2 节）
5. 紧急情况下是否允许 `--no-verify` 及其审批方式（第 6.3 节第 9 条）
6. 依赖与 Remotion 版本的升级负责人与节奏（第 6.3 节第 10 条）
7. 是否允许新增样式方案的例外（第 6.3 节第 11 条）
