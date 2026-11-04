# RemotionMG

使用 [Remotion](https://www.remotion.dev/) 制作 MG（Motion Graphics）动画的工程骨架。
本仓库只做**工程化搭建**，不包含具体分镜内容；组件与样式均为验证工具链可用的占位实现。

## 技术栈

| 能力       | 选型                                      | 版本                             |
| ---------- | ----------------------------------------- | -------------------------------- |
| 包管理器   | pnpm                                      | 10.13.1（`packageManager` 锁定） |
| 运行时     | Node.js                                   | 20.19.x（`engines` >= 20.19.0）  |
| 视频框架   | Remotion                                  | 4.0.540                          |
| 语言       | TypeScript                                | 5.9.3                            |
| 样式       | Less                                      | 4.9.1 + less-loader 13.1.0       |
| 代码检查   | ESLint                                    | 10.14.0（flat config）           |
| 格式化     | Prettier                                  | 3.9.10                           |
| 提交规范   | husky 9 + lint-staged 17 + commitlint 21  | —                                |
| 单元测试   | Vitest 4.1.12 + Testing Library 16.3.3    | happy-dom 21.0.4 环境            |
| 组件工作台 | Storybook 10.6.5（@storybook/react-vite） | —                                |
| 持续集成   | GitHub Actions                            | `.github/workflows/ci.yml`       |

## 快速开始

```bash
pnpm install          # 安装依赖（会触发 husky 安装 git hooks）
pnpm dev              # 打开 Remotion Studio 预览
pnpm check            # lint + typecheck + test 三件套
pnpm storybook        # 打开 Storybook（http://localhost:6006）预览组件各帧状态
pnpm bundle           # 只打包（最快验证 webpack/Less 链路是否正常）
pnpm build            # 渲染成片 out/main.mp4
pnpm build:still      # 渲染单帧 out/still.png（第 60 帧）
```

## 脚本说明

| 脚本                            | 作用                                                                              |
| ------------------------------- | --------------------------------------------------------------------------------- |
| `dev` / `studio`                | 启动 Remotion Studio（HMR 预览）                                                  |
| `bundle`                        | 仅执行 webpack 打包，输出到 `build/`；不下载浏览器、不渲染，CI 里最省时的冒烟检查 |
| `build`                         | `remotion render` 输出 MP4                                                        |
| `build:still`                   | `remotion still` 输出单帧 PNG，用于快速验样式                                     |
| `lint` / `lint:fix`             | ESLint 检查 / 自动修复                                                            |
| `typecheck` / `typecheck:watch` | `tsc --noEmit`；Remotion 用 esbuild 转译，**类型安全只能靠这条命令兜底**          |
| `test` / `test:watch`           | Vitest 单跑一次 / 监听模式                                                        |
| `test:coverage`                 | 生成 `coverage/`（text + html + lcov）                                            |
| `storybook`                     | Storybook 开发服务器（6006 端口，不自动开浏览器、关闭遥测）                       |
| `build:storybook`               | 构建静态站点到 `storybook-static/`                                                |
| `storybook:smoke`               | `--smoke-test`：启动即退出，用来验证 SB 配置没坏                                  |
| `format` / `format:check`       | Prettier 写入 / 校验                                                              |
| `check`                         | `lint + typecheck + test`，提交前与 CI 的主门禁                                   |
| `upgrade`                       | 一键对齐所有 `remotion` / `@remotion/*` 版本                                      |
| `prepare`                       | `pnpm install` 后自动执行 `husky`，安装 git hooks                                 |

## 目录结构

```
RemotionMG/
├── .github/
│   └── workflows/
│       └── ci.yml              # CI：质量门禁 → 构建产物 → 手动渲染冒烟
├── .husky/                     # git hooks
│   ├── pre-commit              # lint-staged
│   └── commit-msg              # commitlint
├── .storybook/                 # Storybook 配置（走 Vite，独立于 Remotion 的 webpack 链路）
│   ├── main.ts                 # stories 匹配 + framework + @ 别名
│   └── preview.tsx             # 全局样式 + 深色画布装饰器
├── public/                     # staticFile() 根目录（.gitkeep 占位）
├── src/
│   ├── index.ts                # 入口：registerRoot + 全局样式
│   ├── Root.tsx                # 所有 Composition 的注册中心
│   ├── animations/             # 纯函数动画层（不依赖 Remotion 上下文，可直接单测）
│   │   ├── mgTitle.ts
│   │   └── mgTitle.test.ts
│   ├── compositions/           # 分镜组件（一个分镜一个文件）
│   │   ├── MGTitle.tsx         # 适配层：Remotion Hook → getTitleMotion → 视图
│   │   ├── MGTitleView.tsx     # 视图层：只吃 props，可被 Storybook / 单测直接喂数据
│   │   ├── MGTitleView.stories.tsx
│   │   └── MGTitleView.test.tsx
│   ├── config/                 # 全局配置常量（帧率/分辨率/字体等）
│   │   ├── video.ts
│   │   └── video.test.ts
│   ├── styles/
│   │   ├── tokens.less         # 设计令牌：变量 + 混入，无 CSS 输出
│   │   ├── MGTitle.module.less # 组件样式（CSS Modules，局部作用域）
│   │   └── global.less         # 全局样式（重置）
│   └── types/
│       └── styles.d.ts         # *.less / *.module.less 的环境声明
├── build/                      # pnpm bundle 产物（gitignore）
├── coverage/                   # 测试覆盖率报告（gitignore）
├── out/                        # 渲染产物（gitignore）
├── storybook-static/           # Storybook 静态站点（gitignore）
├── remotion.config.ts          # Remotion 配置：入口 + Less 规则 + 路径别名
├── vitest.config.ts            # 单测配置：happy-dom + CSS Modules 类名策略 + @ 别名
├── vitest.setup.ts             # jest-dom 断言 + 显式 cleanup
├── tsconfig.json               # TS 配置（含 @/* 别名）
├── eslint.config.mjs           # ESLint flat config
├── prettier.config.mjs         # Prettier 配置
├── commitlint.config.mjs       # 提交信息规范
├── .editorconfig
├── .gitignore
└── package.json
```

## 关键工程决策

1. **Less 接入方式：`Config.overrideWebpackConfig` + style-loader/css-loader/less-loader 三段式**
   Remotion 内置规则只匹配 `\.css$`（见 `@remotion/bundler/dist/shared-bundler-config.js` 的 `getSharedModuleRules()`）。
   这里追加的 `.less` 规则与官方 css 规则保持同构（`css-loader` 的 `modules.auto: true`、`type: 'javascript/auto'`），
   因此 **`*.module.less` = CSS Modules，`*.less` = 全局样式**，与 Remotion 原生 `.css` 行为完全一致，团队不需要记两套规则。
   loaders 必须显式装在项目里：pnpm 使用隔离式 `node_modules`，webpack 从项目根目录解析 loader 名，只装在 `@remotion/bundler` 里不算数。

2. **路径别名只维护一份**
   `tsconfig.json` 的 `paths` 是唯一事实来源，webpack 侧用 `tsconfig-paths-webpack-plugin` 读取同一份配置，
   Storybook 侧则在 `viteFinal` 里把同一份映射转成 Vite 的 `resolve.alias`。
   Remotion 默认的 `resolve.alias` 不含任何 tsconfig paths 支持（已核对 bundler 源码），缺这个插件会出现「tsc 通过、bundle 报 Module not found」。

3. **ESLint 只装 `@remotion/eslint-config-flat`**
   它是官方 flat config，内部已聚合 `@eslint/js` recommended、`typescript-eslint` recommended、
   `eslint-plugin-react` / `react-hooks` 以及 `@remotion/eslint-plugin` 专属规则。
   因此**不再重复安装 eslint-plugin-react**：flat config 里重复声明同名 plugin 会直接报 `Cannot redefine plugin`。
   本仓库只在官方基线上覆盖少量规则（如恢复 `react/jsx-key`），不引入 `eslint-plugin-jsx-a11y`——
   Remotion 产出的是视频帧而不是可交互网页，a11y 规则在该场景误报率高、收益为零。

4. **格式与检查职责分离**
   ESLint 管「对不对」，Prettier 管「好不好看」；`eslint-config-prettier` 放在 config 数组末尾关闭所有冲突规则，避免两套标准互相打架。

5. **动画逻辑 / 视图 / 适配三层拆分（可测性的地基）**
   `getTitleMotion()` 是纯函数：只吃 `{ frame, fps, durationInFrames }`，返回 `{ entrance, offsetY, sweepPercent }`，不碰任何 Remotion Hook。
   好处是时间轴计算可以在 Node 里毫秒级断言（不需要 `<Composition>`、不需要浏览器），而 `MGTitle.tsx` 只剩「读 Hook → 调纯函数 → 传 props」的胶水。
   代价是多一个文件；不这么拆，任何帧相关的 bug 都只能靠肉眼盯 Studio 发现。

6. **Storybook 只做帧状态工作台，不做第二套渲染管线**
   Storybook 走 Vite，Remotion 走 webpack，两者互不干扰：Storybook 里预览的是 `MGTitleView`（纯视图），
   时间轴由 story 的 `frame` 参数手动推进。这样调整布局/配色时不用反复 seek 视频，也不必为了 SB 去改 Remotion 的 webpack 配置。

7. **CI 分三层，昂贵的放最后一层**
   静态门禁（lint/typecheck/test）→ 构建产物（bundle + Storybook build）→ 真实渲染冒烟（下载 Chrome、出图），
   普通 push/PR 跑前两层，渲染冒烟只在手动触发时执行，避免每次提交都付 130MB 浏览器下载的时间成本。

## 测试策略

**测什么**

| 层         | 文件                                    | 断言内容                                                                                                      |
| ---------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 动画纯函数 | `src/animations/mgTitle.test.ts`        | 0 帧入场值为 0、进度条起止帧、末尾越界帧被 clamp、`durationInFrames` 变短时终点不回退                         |
| 配置常量   | `src/config/video.test.ts`              | 分辨率/帧率/时长为正数、时长为整数、`FONT_STACK` 非空                                                         |
| 视图组件   | `src/compositions/MGTitleView.test.tsx` | 标题文本渲染、CSS Modules 类名挂载、进度条 `width` 随 `sweepPercent` 变化、`opacity`/`translateY` 跟随 motion |
| 适配层     | `src/compositions/MGTitle.test.tsx`     | mock 掉两个时间 Hook，验证帧号被正确接到 `getTitleMotion`、`title` 透传视图层                                 |

**不测什么（明确边界）**

- 不测真实渲染像素：那是 `pnpm build:still` + 人工/CI 抽帧比对的事，放进单测只会变慢且脆弱。
- 不测 Remotion 框架内部行为：适配层用例只把 `useCurrentFrame` / `useVideoConfig` 换成固定返回值（`spring`、`interpolate` 仍用真实实现），
  验证的是「接线对不对」，而不是替框架自证数学公式；真正的像素结果交给渲染冒烟。
- 不追求覆盖率数字，`coverage` 只用于发现「完全没被碰过的文件」，不作为门禁阈值。

**两个容易踩的点**

- `vitest.config.ts` 里设了 `css.modules.classNameStrategy = 'non-scoped'`，所以测试里断言的是 `styles.stage === 'stage'`；
  如果不设，Vitest 默认不处理 CSS Modules，`styles` 会是 `undefined`，组件直接崩。
- `globals: false` 时 Testing Library **不会**自动 `cleanup`，多个用例复用同一个文件会残留上一次的 DOM，
  表现为 `getByTestId` 报 "Found multiple elements"。因此 `vitest.setup.ts` 里显式注册了 `afterEach(cleanup)`。

## Storybook 用途

- 入口：`pnpm storybook`（6006 端口）；静态产物：`pnpm build:storybook` → `storybook-static/`。
- 三个 story 覆盖时间轴关键点：`Entrance`（第 0 帧，入场起始）、`Midpoint`（第 60 帧，进度条走到一半）、`Outro`（第 119 帧，末帧）。
- 1920×1080 的舞台用 `transform: scale(0.5)` 收到 960 宽，避免在 SB 画布里出现横向滚动。
- 只装了 `@storybook/addon-docs`：`addon-essentials` 在 SB 10 已停止发布（最新 8.6.14），`addon-a11y` 对视频帧没有意义。
- 所有 storybook 命令都带 `--disable-telemetry`，CI 与本地都不会向外发送使用数据。

## CI 流水线

`.github/workflows/ci.yml`，触发条件：`push`（main/master）、`pull_request`、`workflow_dispatch`（可勾选 `render_smoke`）。

| Job            | 依赖    | 执行内容                                                                                  |
| -------------- | ------- | ----------------------------------------------------------------------------------------- |
| `quality`      | —       | `pnpm install --frozen-lockfile` → `lint` → `typecheck` → `test:coverage`，上传覆盖率产物 |
| `build`        | quality | `pnpm bundle` + `pnpm build:storybook`，上传 `storybook-static/`                          |
| `render-smoke` | build   | 仅手动触发且勾选时执行：`pnpm build:still` 出图并上传 `out/still.png`                     |

- `--frozen-lockfile`：`package.json` 与 `pnpm-lock.yaml` 不一致时直接失败，杜绝「本地能跑、CI 装出另一套依赖」。
- `node_modules/.remotion` 用 `actions/cache` 缓存（key 含 lockfile 哈希），命中时省掉 Headless Chrome 的下载。
- `concurrency` 按分支收敛，同一分支新提交会取消上一次未完成的流水线。

## 已标注的假设

- 项目名 `RemotionMG`、包名 `remotion-mg`；Remotion 4.0.540（当前最新稳定版）。
- Node 版本按 **>= 20.19.0** 约束（而不是 20.0.0）：Vite 7 的 `engines` 要求 `^20.19.0 || >=22.12.0`，降低门槛会让 `pnpm install` 出现引擎告警。
- TypeScript 采用 **5.9.3** 而不是最新的 7.0.2：TS 7 是原生重写版，类型检查行为与社区生态仍在磨合，Remotion 官方模板与 `typescript-eslint` 也以 5.9 为基线。
- Vitest 采用 **4.1.12** 而不是最新的 5.1.0：Vitest 5 的 `engines` 要求 Node ^22.12 || ^24 || >=26，与 Node 20 LTS 不兼容。
- 1920×1080 / 30fps / 120 帧（4 秒）为占位规格，正式分镜请改 `src/config/video.ts`。
- 尚未接入：e2e/视觉回归测试、发布流水线（打 tag 自动出片）。当前单测只覆盖时间轴逻辑与视图层。

## 已知提示

- `pnpm install` 可能出现一次 `unmet peer webpack@^5.112.0` 提示：它来自 Remotion 内部锁定的 `webpack@5.105` 与 `schema-utils` 的声明差异，
  项目本身不走 terser 压缩（Remotion 已设 `optimization.minimize = false`），已在 `package.json` 的 `pnpm.peerDependencyRules` 中显式放行，不影响构建。
- `remotion.config.ts` 与 `eslint.config.mjs` 被官方 config 主动 ignore，这是官方约定（它们由 Node 侧加载，不走浏览器打包）。
- `tsc` 会同时检查 `vitest.config.ts`、`vitest.setup.ts`、`.storybook/`，所以这三个文件里的类型错误也会让 `pnpm typecheck` 失败——这是故意的，配置写错不该等到 CI 才发现。
- Windows 下 husky 的 hook 脚本由 Git Bash 执行；首次 `pnpm install` 后可用 `git config core.hooksPath` 确认指向 `.husky/_`。
