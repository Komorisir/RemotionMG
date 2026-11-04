import { Config } from '@remotion/cli/config'
import type { WebpackConfiguration } from '@remotion/bundler'
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin'

/* ===== 入口与渲染默认值 ===== */
Config.setEntryPoint('src/index.ts')
Config.setVideoImageFormat('jpeg')
Config.setOverwriteOutput(true)

/**
 * Remotion 默认只处理 .css（style-loader + css-loader，modules.auto: true）。
 * .less 不匹配任何内置规则，必须自己补一条，规则与官方 css 规则保持一致：
 *   - 文件名 *.module.less  -> CSS Modules（局部作用域）
 *   - 文件名 *.less         -> 全局样式
 */
type WebpackRules = NonNullable<NonNullable<WebpackConfiguration['module']>['rules']>

const lessRules: WebpackRules = [
  {
    test: /\.less$/i,
    use: [
      'style-loader',
      {
        loader: 'css-loader',
        options: {
          // 与 Remotion 内置 .css 规则对齐：.module.less 自动启用 CSS Modules
          modules: { auto: true, namedExport: false },
          importLoaders: 1,
          sourceMap: false,
        },
      },
      {
        loader: 'less-loader',
        options: {
          lessOptions: {
            javascriptEnabled: false,
            // 变量/混入注入点：需要按品牌做主题切换时在这里加 modifyVars
          },
        },
      },
    ],
    type: 'javascript/auto',
  },
]

Config.overrideWebpackConfig((currentConfiguration: WebpackConfiguration): WebpackConfiguration => {
  const resolvePlugins = [...(currentConfiguration.resolve?.plugins ?? [])]

  return {
    ...currentConfiguration,
    resolve: {
      ...currentConfiguration.resolve,
      // tsconfig.json 的 paths 是唯一事实来源；不加这个插件，@/xxx 在 webpack 里解析不到
      plugins: [...resolvePlugins, new TsconfigPathsPlugin({ extensions: ['.ts', '.tsx', '.js', '.jsx'] })],
    },
    module: {
      ...currentConfiguration.module,
      rules: [...(currentConfiguration.module?.rules ?? []), ...lessRules],
    },
  }
})
