# Remotion 动效制作笔记

> 这是一份"边做边记"的工作笔记：先把**思路和判断**记下来，再补**能直接抄的代码**。
>
> - **适用工程**：本仓库 RemotionMG（Remotion 4.0.540 + React 19 + TypeScript 5.9 + Less，pnpm 10）。
> - **约定**：✅ 表示已验证的做法，⚠️ 表示坑，📝 表示待补充/待验证 —— 看到标记就知道哪里可以直接信、哪里还要自己试。
> - **阅读顺序**：想马上出片 → 03 + 04；想理解为什么用 Remotion → 01；想找现成风格 → 07。

## 目录

1. [视频模型 vs Remotion](#01-视频模型-vs-remotion)
2. [模型与 Agent 的选型](#02-模型与-agent-的选型)
3. [开工前的四件套](#03-开工前的四件套)
4. [制作流程的拆解](#04-制作流程的拆解)
5. [手绘风格动画](#05-手绘风格动画)
6. [地图动画](#06-地图动画)
7. [现成 Skill 与风格库清单](#07-现成-skill-与风格库清单)
8. [音效与音乐](#08-音效与音乐)
9. [工程化：把动画做成长久资产](#09-工程化把动画做成长久资产)
10. [常见坑](#10-常见坑)
11. [术语表](#11-术语表)
12. [附录：速查卡](#附录-a速查卡)

---

# 01 视频模型 vs Remotion

## 一句话区别

视觉生成模型是**神经网络"画"出画面**：你给提示词，它采样出一个像素结果。
Remotion 是**用代码定义动画元素、运动轨迹和时间轴，再逐帧渲染成视频**：你给组件和帧号，它输出确定的一帧。

一个是**生成式 AI**（概率采样），一个是**程序化动画**（确定性渲染）。二者不是替代关系，而是两条不同的生产线，也可以串起来用：AI 出素材，Remotion 编排节奏。

## 对比表

| 维度       | 生成式视频模型                     | Remotion                                    |
| ---------- | ---------------------------------- | ------------------------------------------- |
| 产出方式   | 提示词 → 采样                      | 组件 + 帧号 → render()                      |
| 确定性     | 不保证可复现（换种子就换片子）     | 完全确定：同一帧号永远同一像素              |
| 可控性     | 分镜/时长/节奏难以精确控制         | 帧级精确，interpolate 想怎么弯怎么弯        |
| 文字准确性 | 中文字幕基本靠"生成得像"           | 真实字体渲染，绝对清晰                      |
| 品牌一致性 | Logo、色值、字体容易漂移           | 设计令牌固定，改一处全片生效                |
| 迭代成本   | 改一个字通常要重新生成整条         | 改一行代码，重渲染只影响该帧                |
| 制作周期   | 出首版快，改细节贵                 | 搭骨架慢，之后边际成本极低                  |
| 适合场景   | 实拍质感、人物面部、概念氛围、素材 | MG 动画、数据可视化、字幕、片头、模板化量产 |
| 许可与成本 | 按次计费，商用条款各异             | 开源框架，但 Remotion 自身有许可分层        |

> ⚠️ **Remotion 的许可分层**（为公司出片前先确认）：个人与 3 人及以下的小公司走 Free License 即可商用；规模更大的公司需要 Company License；把 Remotion 做成"用户点一下就出片"的产品（视频编辑器、prompt-to-video）属于自动化/Player 类授权，按渲染次数计费。详见 [remotion.dev/pricing](https://www.remotion.dev/pricing)。

## 什么时候用哪个

- **必须用 Remotion**：字幕、数据图表、品牌模板、需要反复微调的片子、要批量生成 N 条同结构视频。
- **优先用生成模型**：真实人物、物理光影、抽象质感镜头、需要"摄影感"的转场素材。
- **混用（性价比最高）**：AI 出关键帧大图 → Remotion 做镜头运动（Ken Burns 推拉摇移）+ 文字板式 + 卡点剪辑。

## Remotion 的本质（一张图记住）

```
props + frame ──▶ <Composition 组件> ──▶ 某一帧的 React 画面 ──▶ 逐帧截图 ──▶ FFmpeg 合成 MP4
```

- 组件是**纯函数**：给定 props 和当前帧 frame，返回该帧的 DOM，**不保存跨帧状态**。
- 预览 = 把时间轴拖到某个 frame 再渲染一次；渲染 = 把这条时间轴逐帧跑一遍。
- 中间层是 DOM/CSS，所以排版、渐变、圆角、混合模式全部可用，不用学 AE 表达式。

---

# 02 模型与 Agent 的选型

不同模型与 Agent 的能力各有不同。选型的关键不是"谁最强"，而是**"谁在长上下文的代码改动里最不容易改崩"**。

## 分工建议

| 环节        | 适合交给谁         | 说明                                                         |
| ----------- | ------------------ | ------------------------------------------------------------ |
| 创意/脚本   | 通用大模型（对话） | 文字产出质量高、允许发散；产出物是 Markdown 脚本，方便人工改 |
| 分镜/解说词 | 通用大模型         | 让它在"每句话 1~2 个镜头"的约束下写，比自由发挥更可用        |
| 动画实现    | 编程能力强的 Agent | 要同时理解 Remotion API、TypeScript、CSS 和本仓库约定        |
| 视觉评审    | 能看图的多模态模型 | 渲染单帧 PNG 后让它挑版式/配色/可读性问题，比纯文字描述有效  |
| 素材生成    | 图像/视频生成模型  | 只管单张素材，不参与时间轴                                   |

## 给 Agent 的上下文怎么给

1. **仓库约定优先**：根目录的 [Agent.md](../Agent.md) 和 [README.md](../README.md) 写了三条硬约定（Less 接入方式、路径别名单一事实来源、ESLint 基线）。开工前让 Agent 先读，比事后返工便宜得多。
2. **一次只改一个 Composition**：改完立刻 pnpm check，别让类型错误滚雪球。
3. **让它先跑 pnpm bundle**：bundle 不下载浏览器、不出片，是验证 webpack/Less 链路最快的方式。
4. **不要让它"顺手重构"**：动效代码最怕并行改动，视觉回归的成本极高。

📝 **待补充**：自己实测过的模型/Agent 组合，以及各自在哪些环节掉链子（例如写 interpolate 时忘加 clamp、把随机数写进组件导致每帧乱跳）。

---

# 03 开工前的四件套

开始之前先完成四项基础配置，缺任何一项都会在后面莫名其妙的环节卡住：

| 能力            | 具体是什么                             | 缺了会怎样                           |
| --------------- | -------------------------------------- | ------------------------------------ |
| Remotion Skills | 官方/社区技能合集（给 Agent 的说明书） | Agent 写的代码能跑，但不符合最佳实践 |
| 系统环境        | Node.js（含 pnpm）、FFmpeg             | 装不上依赖 / 渲染报错 / 素材没法处理 |
| Remotion 工程   | 一个能长期维护的动效库                 | 每个动画重复初始化，资产散落各处     |
| 生图能力        | 图像模型 + 素材管理                    | 只有纯排版，缺少画面主体             |

## 3.1 安装 Remotion Skills

Remotion 官方维护了一组 Agent Skills（remotion-dev/skills），本质是给 AI 的**分章节说明书**：写组件要遵守什么、渲染参数怎么传、字幕怎么对齐……装了它，Agent 才不会凭印象编 API。

**方式一：官方 CLI（推荐）**

```bash
npx remotion skills add      # 安装
npx remotion skills update   # 更新
```

- 默认装到项目内的 .agents/skills/，随仓库提交，团队和 CI 用同一份。
- Claude Code 的兼容性通过把 .claude/skills 软链接到 .agents/skills 实现。
- 详见 [remotion.dev/docs/cli/skills](https://www.remotion.dev/docs/cli/skills)。

**方式二：社区 Skills CLI（装到用户级，跨项目复用）**

```bash
npx -y skills@latest add remotion-dev/skills -g -y
```

- `-g` 装到用户级目录，`-y` 跳过交互确认；去掉这两个参数就是"只装到当前项目"。
- 生态入口：[skills.sh](https://www.skills.sh/)，通用写法是 `npx skills add <owner/repo>`。

> ✅ 装好 Skills 之后，Remotion Studio 也可以被 Agent 直接拉起：`npx remotion studio --no-open` 会打印预览 URL，Agent 把操作台打开给你看实时帧效果，不用手动重启。

## 3.2 系统环境

- **Node.js + 包管理器**：本仓库锁 `node >= 20.19.0`（Vite 7 的 engines 要求）、`pnpm 10.13.1`（packageManager 字段锁定）。低于 20.19 会出现一堆引擎告警。
- **FFmpeg**：Remotion 4 自带一份 FFmpeg 用于合成，**渲染本身不依赖系统 FFmpeg**；但素材预处理（裁剪、抽帧、转码、烧字幕）用系统 ffmpeg 方便很多，建议装。
- **浏览器**：渲染时用无头 Chrome，首次渲染自动下载约 130MB，缓存在 node_modules/.remotion；CI 里记得用 actions/cache 缓存这个目录。

快速自检：

```bash
node -v && pnpm -v && ffmpeg -version | head -1
```

## 3.3 创建一个能长期维护的 Remotion 动效库

核心思想：**一个仓库，多个动画，共享一套环境**。

- 每个动画 = 一个独立的子文件夹（脚本、素材、渲染产物各管各的）。
- 共用根目录的依赖：新动画直接复用环境，不用重新 `pnpm install`。
- 长期积累下来，动效库 = 自己的动画资产库，甚至能长成一个"动效工作台"。

对应到本仓库的落地方式（已具备）：

```
RemotionMG/
├── src/
│   ├── animations/    # 纯函数动画层：只吃 frame/fps/durationInFrames，可在 Node 里直接单测
│   ├── compositions/  # 分镜组件：一个分镜一个文件（Name.tsx 适配层 / NameView.tsx 视图层）
│   ├── config/        # 全局常量：帧率、分辨率、字体栈（单一事实来源）
│   ├── styles/        # tokens.less 设计令牌 + 组件 CSS Modules
│   └── Root.tsx       # 所有 Composition 的注册中心
├── public/            # staticFile() 的根目录：图片、音频、字体
└── out/               # 渲染产物（gitignore）
```

命名约定：Composition id 用"项目 + 镜头"的形式（如 `MGTitle`、`BrandOutro`），props 用 TypeScript 类型 + Studio 里的交互式调试配合使用。

> ⚠️ 别做成"每个动画一个仓库"：依赖装 N 份、版本漂移、素材复用全靠复制粘贴，三个月后基本没法维护。

## 3.4 生图与素材能力

- 图片素材至少准备两档分辨率：预览用（1280 宽）、渲染用（1920 或 2560 宽）。
- 所有素材放进 `public/`，代码里用 `staticFile('xxx.png')` 引用 —— **绝对不要写外链**，渲染时请求网络会随机失败或变慢。
- 需要透明背景的素材一律 PNG/WebP；叠在视频上动的元素用带 alpha 的 `.webm`。

---

# 04 制作流程的拆解

## 4.0 全流程总览

```
需求 → 脚本 → 配音 → SRT 字幕 → 素材（截图/录屏/小动画）
     → 分镜表（每个镜头的起止帧） → 组件实现 → Studio 调帧 → 渲染 → 复盘沉淀
```

| 阶段   | 产出物                                     | 判断标准                       |
| ------ | ------------------------------------------ | ------------------------------ |
| 需求   | 一句话：给谁看、看多久、想让对方记住什么   | 说不出这句就是需求没想清楚     |
| 脚本   | Markdown 逐句稿                            | 每句能对应到 1~2 个镜头        |
| 配音   | wav/mp3                                    | 时长定死总片长                 |
| SRT    | 字幕文件                                   | 断句不超过一行 18 个中文字     |
| 分镜表 | 表格：镜头号 / 起止秒 / 画面 / 运动 / 音效 | 每格都能落到一个组件或一段 JSX |
| 实现   | Composition 代码                           | pnpm build:still 抽帧不崩      |
| 渲染   | MP4                                        | 无黑帧、无字体闪变、音画对齐   |

## 4.1 需求：说人话，但要说全

1. **说清楚你的需求** —— AI 比你更懂技术语言和实现方案，但**它不知道你要什么感觉**。给它"信息 + 情绪 + 约束"，而不是一句"做个酷炫的"。
2. **提供参考动画比文字描述有效得多** —— 一个 10 秒链接胜过 500 字形容词。
3. 找参考时好用的关键词：`Motion`、`Vibe Motion`、`AE`、`Remotion`、`MG`、`Motion Graphics`、`Kinetic Typography`、`Broadcast Package`、`Explainer Video`。

需求模板（直接抄）：

```text
主题：___
受众：___
总时长：___ 秒（帧率 30fps）
画幅：1920×1080 / 1080×1920（竖屏短视频）
风格参考：<链接 1> <链接 2>
必须出现的元素：Logo、色值 #___、字体 ___、文案逐字稿 ___
禁止出现的元素：___
交付：MP4（H.264）+ 封面单帧 PNG
```

## 4.2 脚本与分镜

- 先定**朗读节奏**再定画面：配音总时长 ÷ 句数 = 每句可用帧数。先算帧再写动画，能少改一大半。
- 分镜表用表格而不是文字，字段固定：镜头、入点帧、出点帧、画面描述、运动/转场、音效。
- MG 片子的黄金结构：**3 秒钩子 → 主体分点 → 5 秒收尾落版（Logo + Slogan）**。

## 4.3 素材准备

先凑齐这四样再开工，否则边做边找素材会打断节奏：

1. **脚本**（逐句稿）
2. **配音**（先配好音，时长是硬约束）
3. **SRT**（字幕，可用 @remotion/captions 或剪映/Whisper 导出）
4. **素材**：截图、录屏、小动画、图标、贴图

> 💡 素材缺口先用占位符顶上（纯色块 + 尺寸标注），把时间轴跑通再替换。**先让片子"能动"，再让它"好看"**。

## 4.4 动画实现：三条铁律

1. **一切从帧推导**：只用 `useCurrentFrame()`，不要用 `Date.now()`、`Math.random()` 或 `setState` 累积。渲染器可能并行/乱序渲染多帧，任何跨帧状态都是 bug 温床。需要随机感就用 Remotion 的 `random('seed')`（同种子同结果）。
2. **插值一律 clamp**：`interpolate(frame, [0, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })`，否则时间轴一超界数值就飞。
3. **动画逻辑抽成纯函数**：放进 `src/animations/`，视图层只吃 props。时间轴 bug 就能在 Node 里毫秒级断言，不用靠肉眼盯 Studio。

最常用的一段模板：

```tsx
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'

export const FadeUp: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // 弹簧入场：damping 调大 = 关掉回弹；要"有弹性"就调小
  const enter = spring({ frame: frame - delay, fps, config: { damping: 100 } })

  // 线性推进：一定带 clamp
  const sweep = interpolate(frame, [delay, delay + 30], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1), // easeOutExpo，收尾更"高级"
  })

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ opacity: enter, transform: `translateY(${(1 - enter) * 40}px)` }}>Hello</div>
      <div style={{ width: `${sweep}%`, height: 6, background: '#111' }} />
    </AbsoluteFill>
  )
}
```

## 4.5 预览、渲染与交付

| 目的     | 命令               | 说明                                             |
| -------- | ------------------ | ------------------------------------------------ |
| 实时调帧 | `pnpm dev`         | 拖时间轴预览，改代码热更新                       |
| 只验链路 | `pnpm bundle`      | 不下载浏览器、不出片，最快的冒烟检查             |
| 出单帧   | `pnpm build:still` | 抓第 60 帧 PNG，验版式/配色最快                  |
| 出成片   | `pnpm build`       | `remotion render src/index.ts Main out/main.mp4` |
| 质量门禁 | `pnpm check`       | lint + typecheck + test                          |

渲染常用参数（`npx remotion render`）：

```bash
npx remotion render src/index.ts Main out/main.mp4 \
  --concurrency=8 \
  --scale=0.5 \
  --frames=0-90 \
  --props='{"title":"hi"}'

# --concurrency=8   并行渲染的标签页数，机器好就开大
# --scale=0.5       半分辨率预览，省一半时间
# --frames=0-90     只渲染这一段
# --props=...       传 props（Windows 上内联 JSON 不支持，改传 JSON 文件路径）
```

交付注意：

- 常规 MP4 用 H.264 + `yuv420p`，兼容性最好（微信/浏览器都能直接播）。
- **透明背景**必须用 WebM（VP8/VP9 with alpha）、ProRes 4444 或 PNG 序列，H.264 不支持 alpha。
- 首帧黑屏通常不是 bug：检查动画是不是被 delay 推迟过头。

## 4.6 复盘与沉淀

每个片子做完，把**能复用的部分**抽出来：转场、文字板式、进度条、结尾落版。放进 `src/animations/` 和 `src/compositions/`，下一个片子直接改 props。

这就是"动效库"真正的复利来源 —— 不是代码行数，而是**可组合的零件数**。

---

# 05 手绘风格动画

手绘感是 MG 里最容易出效果、也最容易翻车的一类。先分清楚你要的是哪一种。

## 5.1 三种做法

| 做法            | 原理                                               | 效果                       | 成本             |
| --------------- | -------------------------------------------------- | -------------------------- | ---------------- |
| A. SVG 路径描边 | 用 strokeDasharray / strokeDashoffset 让线"长出来" | 干净线稿、图解、白板       | 低，需要路径数据 |
| B. 画笔 + 遮罩  | 笔刷贴图沿路径移动，配 mask 逐步显露               | 有笔触、有干湿浓淡，像手绘 | 中，需要笔刷素材 |
| C. 逐帧实拍     | 真人拍白板，后期抠像/变速                          | 最真实                     | 高，且不好改     |

对应笔记里的两类手绘氛围：

1. **简单线稿**：直接做成 SVG，Remotion 沿路径一点点显现，模拟画笔。
2. **不逐条画路径**：用笔刷贴图 + 遮罩，走到哪里哪里就逐步显现（更像真人手绘，但不可精确控制每一笔）。

## 5.2 SVG 路径描边（最稳的一条路）

关键技巧：给 path 加 `pathLength={1}`，把整条路径长度归一化成 1，就不用去测真实长度了。

```tsx
import { interpolate, useCurrentFrame } from 'remotion'

export const DrawPath: React.FC<{ d: string; start?: number; duration?: number }> = ({
  d,
  start = 0,
  duration = 45,
}) => {
  const frame = useCurrentFrame()
  const p = interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <svg viewBox='0 0 800 600'>
      <path
        d={d}
        pathLength={1}
        fill='none'
        stroke='#1a1a1a'
        strokeWidth={4}
        strokeLinecap='round'
        strokeDasharray={1}
        strokeDashoffset={1 - p}
      />
    </svg>
  )
}
```

- 路径数据从 Figma（插件导出 SVG）或 Illustrator 里拷，`d` 直接粘进 `src/` 下的常量文件。
- 多条路径想"一笔一笔"画，就用 `<Sequence>` 或给每条路径的 `start` 加偏移，做出**手速感**（人不会匀速，见 5.4）。
- `@remotion/paths` 提供 `evolvePath()`、`getPointAtLength()`、`getLength()`，需要沿路径放元素（笔尖、小圆点、箭头）时直接用。

## 5.3 笔刷 + 遮罩

思路：一张倾斜的笔刷 PNG 沿路径移动，同时用"只显示已走过部分"的遮罩逐步显露。

- 笔刷要**两端渐隐**，否则起笔收笔会露出方块边缘。
- 遮罩可以用 SVG `mask` + 描边进度，也可以用 CSS `clip-path: inset()` / `polygon()` 做斜切推进。
- 笔刷角度要跟着路径切线转：`atan2(dy, dx)`，否则笔画会在拐角处"歪头"。

## 5.4 节奏：让"机器画的"像"人画的"

- **速度不匀速**：起笔快、中段稳、收笔略慢（用 `Easing` 或 spring 拉曲线）。
- **轻微抖动**：给线宽/透明度叠加 `random('seed' + frame)` 的极小扰动（±2%），静态时也有呼吸感。
- **不要每条线都同样时长**：长线慢、短线快，人为打乱节奏才像手。
- **加纸张纹理**：`background-blend-mode: multiply` 叠一张噪点图，立刻从"矢量"变"手绘"。

## 5.5 现成方案

想要更真实的手绘风格，直接用 Skill：`srt-whiteboard-animation`（白板讲解）、`sweety-handdraw-video`（手绘讲解），见第 07 节。

---

# 06 地图动画

- **静态底图**：Mapbox / MapLibre / MapTiler 导出高分辨率 PNG 放进 `public/`，在 Remotion 里做推拉摇移最省事、最稳。
- **数据驱动**：GeoJSON + `d3-geo` 算出投影坐标，再在该坐标系里做路径动画 —— 路线"长出来"、标记点逐个弹出、连线跳点。
- **真实地图数据**：可以接入高德地图 API（国内 POI、路径规划、行政区划齐全）；注意底图瓦片有使用条款，商用前看清楚。
- **注意比例尺**：不同 zoom 级别下同一个位移看起来完全不一样，动画参数要按 zoom 归一化。

📝 **待补充**：一次真实的高德 API 接入记录（key 申请、瓦片抓取、坐标系 GCJ-02 与 WGS-84 的偏移处理）。

---

# 07 现成 Skill 与风格库清单

> 这一节是"风格目录"：先看有没有现成的，再决定自己写。用之前一定先打开它的 SKILL.md 读一遍 —— 多数 Skill 是**方法论 + 模板**，不是开箱即用的插件。

> ✅ **本节已落地**：下面全部 Skill 已装到本机 `~/.agents/skills/`（全局，所有项目共享）。表里的 **Skill 名**是实际可调用的名字——和搜索结果里的仓库名不一定相同，以本表为准。

## 7.1 风格库（大类合集）

| Skill 名            | 来源仓库                         | 内容                                                                 | 适合               |
| ------------------- | -------------------------------- | -------------------------------------------------------------------- | ------------------ |
| `lemo-opuscar`      | `lemomo-ai/lemo-opuscar`         | 66 种动画风格，涵盖剪辑纪实、手绘绘画、立体书、3D 等 11 个类别       | 找风格、做风格对照 |
| `huashu-art-motion` | `alchaincyf/huashu-art-motion`   | 36 种艺术风格（像素、梵高油画、莫奈睡莲等）+ 16 种可迁移配方         | 艺术化片头、视觉系 |
| `mg-styles-15`      | `Vincentwei1021/mg-styles-15`    | 15 种 MG 风格：扁平矢量、线条、等轴 2.5D、3D、逐帧手绘、拼贴、像素…… | 商业 MG、品牌宣传  |
| `video-talkcraft`   | `vincentwei1021/video-talkcraft` | 口播视频全流程 + 108 张动效配方卡（下文说明为何加它）                | 口播 / 解说 / 科普 |

> ⚠️ 原笔记里的 `motiontemplates`（"真人出镜类动画模板"）**在 skills.sh 上没有对应条目**，搜索同名、`motion-templates`、`talking-head`、`recut`、`真人出镜` 均无结果。最接近的两个：`layerai/skills` 里的 `layer-motion-templates` 其实是 Layer 平台视频模板的**批量渲染**（slots / variants / batch render），跟"真人出镜"无关；真正对得上"口播 + 图文混合"的是 `video-talkcraft`。所以这里用后者替换。

## 7.2 全流程导演类

| Skill 名          | 能力                                                                               |
| ----------------- | ---------------------------------------------------------------------------------- |
| `vox-director`    | Vox 风格拼贴解说片：脚本 → 拼贴关键帧 → 动效 → 配音 → BGM → 字幕，整条链路自动串完 |
| `video-talkcraft` | 中文口播稿 + 成品配音 → 字级时间戳 → SHOTBOOK 层矩阵分镜 → Remotion 成片，偏电影感 |

## 7.3 手绘 / 白板类

| Skill 名                    | 说明                                                                         |
| --------------------------- | ---------------------------------------------------------------------------- |
| `srt-whiteboard-animation`  | 白板手绘讲解，吃 SRT 字幕驱动画面（分区遮罩 + 连续笔迹）                     |
| `sweety-handdraw-video`     | 手绘讲解视频，按真实配音算分镜预算，风格更柔和                               |
| `directing-stickman-videos` | 火柴人风格动画（**注意：仓库名是 `stickman-video-director`，装完叫这个名**） |

## 7.4 镜头 / 宣传类

| Skill 名          | 说明                                                                                                      |
| ----------------- | --------------------------------------------------------------------------------------------------------- |
| `video-shotcraft` | 产品宣传片镜头工具箱：124 张镜头配方卡、Ink Press 模板、节拍对齐、音效选材（**注意：不是 `shortcraft`**） |

## 7.5 安装方法（含国内网络这一关）

标准做法是一行命令：

```bash
npx -y skills@latest add <owner/repo> -g --all -y
# --all = --skill '*' --agent '*' -y，装到 ~/.agents/skills/，所有 agent 共享
```

**但本机实际踩到的坑**：这些仓库走 `git clone` 拉取，国内到 `codeload.github.com` 实测只有 2.6 KB/s，clone 中途断掉，CLI 读不到 SKILL.md，于是统一报：

```text
No valid skills found. Skills require a SKILL.md with name and description.
```

这个报错**不是仓库没有 SKILL.md**，而是网络没拉下来。绕法（已验证可用）：

```bash
# 1) 稀疏克隆：只取文本，跳过 mp4/png/gif/ttf/zip 等大文件
git clone --depth 1 --filter=blob:none --no-checkout https://github.com/<owner>/<repo>.git
cd <repo>
git sparse-checkout init --no-cone
git sparse-checkout set '*' '!*.mp4' '!*.mov' '!*.gif' '!*.png' '!*.jpg' '!*.webp' '!*.mp3' '!*.wav' '!*.flac' '!*.ttf' '!*.otf' '!*.zip' '!*.pdf'
git checkout
# 2) 从本地目录装
npx -y skills@latest add ./<repo> -g --all -y
```

- 稀疏克隆后 `git status` 里被排除的媒体会显示成 `D`（deleted），**正常现象**，文本文件是好的。
- 列全量文件清单用 jsdelivr 的 data API（比 raw 快，且不占 GitHub 速率）：
  `https://data.jsdelivr.com/v1/package/gh/<owner>/<repo>@main/flat`
- 单个文件下载用 `https://raw.githubusercontent.com/<owner>/<repo>/main/<path>`，逐文件 curl 反而比整包 clone 快。
- 装完立刻生效：`~/.agents/skills/` 就是 agent 读取的目录，不用重启。
- 输出里 `Eve` / `PromptScript` 两条 `does not support global skill installation` 是**正常噪音**，忽略即可。

## 7.6 用 Skill 的三条经验

1. **先读 SKILL.md**：判断它是"提示词模板"还是"带代码的脚手架"，两者用法完全不同。
2. **别直接跑在正式仓库里**：新建 `sandbox/` 或临时目录试，确认产出可接受再搬进 `src/`。
3. **把改动落成自己的代码**：Skill 产出的组件要按本仓库约定重写（纯函数层 / 视图层 / 适配层），否则下次它生成的代码和你的仓库是两套风格。

> ⚠️ 第三方 Skill 本质是**给 AI 的一段指令**，装之前扫一眼有没有奇怪的网络请求或写文件操作；来源不明的不要直接 `-g` 全局安装。

---

# 08 音效与音乐

## 8.1 建立自己的音效库

分类建议（目录即分类，找起来最快）：

```
public/sfx/
├── ui/         # 咔哒、弹出、滑动、whoosh
├── transition/ # 转场、镜头推拉、闪白
├── impact/     # 重音、鼓点、玻璃碎
└── ambience/   # 环境底噪、纸张翻动、键盘
```

免费音源：Freesound（CC 授权，注意署名要求）、Pixabay / Mixkit（免授权但条款会变）、YouTube Audio Library。**下载时就把授权文件一起存**，别等要用的时候找不到出处。

## 8.2 卡点：先把 BPM 换算成帧

> 每拍帧数 = fps × 60 ÷ BPM

30fps 下：120 BPM → 15 帧/拍，100 BPM → 18 帧/拍。把关键帧全部对齐到拍的整数倍，观感会立刻"专业"一个档次。

## 8.3 代码里的音频

```tsx
import { Audio, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion'

// 片段：从第 60 帧开始，播 2 秒，音量固定
<Sequence from={60} durationInFrames={60}>
  <Audio src={staticFile('sfx/ui/pop.wav')} volume={0.6} />
</Sequence>

// 整段 BGM：首尾各 15 帧淡入淡出
const frame = useCurrentFrame()
const volume = interpolate(frame, [0, 15, 255, 270], [0, 0.35, 0.35, 0], {
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
})
<Audio src={staticFile('bgm/loop.mp3')} volume={volume} />
```

- 音频文件一律放 `public/`，用 `staticFile()` 引用。
- 想做"音效跟着动画走"，把音效放进 `Sequence`，`from` 与动画起始帧共用同一个常量，改一处两边同步。
- 长 BGM 记得 `loop` 或裁到片长，否则片长之外的部分不渲染却会拖慢合成。

---

# 09 工程化：把动画做成长久资产

## 9.1 本仓库的三层拆分（可测性的地基）

| 层         | 文件                               | 职责                                              | 可测性                         |
| ---------- | ---------------------------------- | ------------------------------------------------- | ------------------------------ |
| 动画纯函数 | `src/animations/mgTitle.ts`        | 只吃 `{ frame, fps, durationInFrames }`，返回数值 | ✅ Node 里直接断言             |
| 视图层     | `src/compositions/MGTitleView.tsx` | 只吃 props，渲染 DOM                              | ✅ Testing Library / Storybook |
| 适配层     | `src/compositions/MGTitle.tsx`     | 读 Hook → 调纯函数 → 传 props                     | 只验接线                       |

好处：帧相关的 bug 不用靠肉眼盯 Studio；代价是多一个文件 —— 非常划算。

## 9.2 设计令牌

颜色、字号、间距、缓动曲线集中在 `src/styles/tokens.less`；帧率、分辨率、字体栈以 `src/config/video.ts` 为唯一事实来源。改品牌色 = 改一行，而不是全仓库搜索替换。

## 9.3 版本与产物

- `pnpm upgrade` 一键对齐所有 `remotion` / `@remotion/*` 版本（版本不一致是渲染报错的常见根因）。
- `out/`、`build/`、`coverage/`、`storybook-static/` 全部 gitignore；成片走网盘/对象存储，仓库只留代码和素材。
- 大素材（>10MB）考虑 Git LFS，或放 CDN 用绝对路径（但要接受"渲染依赖网络"的风险）。

---

# 10 常见坑

| 现象                       | 原因                               | 解法                                                       |
| -------------------------- | ---------------------------------- | ---------------------------------------------------------- |
| 每帧画面都在抖/闪          | 组件里用了 Math.random / Date.now  | 改用 `random('seed')`，一切从 frame 推导                   |
| 数值越界后画面飞走         | interpolate 没加 extrapolate clamp | 永远显式加 clamp                                           |
| 渲染出的字体和预览不一样   | 字体没在渲染前加载完               | 用 @remotion/google-fonts 或 @remotion/fonts + delayRender |
| 图片/音频 404              | 用了相对路径或外链                 | 全部 `staticFile()`，文件放 `public/`                      |
| Module not found: @/xxx    | tsconfig paths 没同步到 webpack    | 本仓库已用 tsconfig-paths-webpack-plugin 统一，别绕开 `@/` |
| 单测里 styles is undefined | Vitest 没处理 CSS Modules          | `css.modules.classNameStrategy = 'non-scoped'`（已配）     |
| 报 Found multiple elements | Testing Library 没自动 cleanup     | `vitest.setup.ts` 里显式 `afterEach(cleanup)`              |
| 首次渲染卡很久             | 正在下载无头 Chrome                | 正常，缓存在 node_modules/.remotion，CI 用 cache           |
| 透明背景导出是一片黑       | H.264 不支持 alpha                 | 导 WebM / ProRes 4444 / PNG 序列                           |

---

# 11 术语表

| 术语                 | 含义                                                                |
| -------------------- | ------------------------------------------------------------------- |
| Composition          | 一个可渲染的"片子/分镜"，带 id、尺寸、帧率、时长，注册在 `Root.tsx` |
| Frame / fps          | 帧号与每秒帧数；本项目 30fps，1 秒 = 30 帧                          |
| `useCurrentFrame()`  | 取当前帧号，所有动画的输入                                          |
| `interpolate()`      | 把帧号线性/缓动映射到任意数值区间                                   |
| `spring()`           | 物理弹簧，做"有弹性的入场"最自然                                    |
| `Sequence`           | 在时间轴上延迟/裁剪一个子片段                                       |
| `AbsoluteFill`       | 铺满画布的定位容器（相当于绝对定位满屏）                            |
| `staticFile()`       | 引用 `public/` 下的静态资源                                         |
| MG                   | Motion Graphics，动态图形；介于平面设计与动画之间                   |
| Ken Burns            | 静态图缓慢推拉摇移的镜头运动手法                                    |
| Kinetic Typography   | 动态排版，文字本身承担运动与节奏                                    |
| SRT                  | 字幕文件格式，含时间码与文本                                        |
| Whiteboard Animation | 白板手绘讲解动画                                                    |

---

# 附录 A：速查卡

```text
# 安装
npx remotion skills add          # 官方 Agent Skills → .agents/skills
npx -y skills@latest add <owner/repo> -g -y

# 日常
pnpm dev                         # Studio 预览（拖时间轴）
pnpm build:still                 # 抽一帧 PNG 验样式
pnpm bundle                      # 只验打包链路，最快
pnpm check                       # lint + typecheck + test
pnpm build                       # 出成片 out/main.mp4

# 渲染细节
npx remotion render src/index.ts <CompositionId> out/x.mp4 --concurrency=8 --scale=0.5

# 帧换算
每拍帧数 = fps × 60 ÷ BPM        # 120 BPM @30fps = 15 帧/拍
总帧数   = 时长(秒) × fps
```

## 附录 B：待补充清单

- [ ] 一次完整项目的真实耗时记录（脚本/配音/实现/渲染各占多少）
- [ ] 模型与 Agent 的实测对比（见 02 节）
- [ ] 高德地图 API 接入实录（见 06 节）
- [ ] 自己的转场库 / 文字板式库（做满 10 个再整理）
- [ ] 音效库授权清单的整理方式
- [ ] 视频号/小红书竖屏输出参数模板（1080×1920、时长上限、首帧封面）
