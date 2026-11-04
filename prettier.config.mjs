/** @type {import('prettier').Config} */
export default {
  tabWidth: 2, // 使用 2 个空格缩进
  semi: false, // 行尾不需要有分号
  singleQuote: true, // 使用单引号
  printWidth: 120, // 一行最多 120 字符
  endOfLine: 'lf', // 换行符使用 lf
  arrowParens: 'avoid', // 箭头函数，能省略括号的时候就省略
  jsxSingleQuote: true, // jsx 不使用单引号，而使用双引号
  bracketSpacing: true, // 大括号内的首尾需要空格
  proseWrap: 'preserve', // 使用默认的折行标准
  htmlWhitespaceSensitivity: 'css', // 根据显示样式决定 html 要不要折行
  quoteProps: 'as-needed', // 对象的 key 仅在必要时用引号
  trailingComma: 'all', // 末尾需要有逗号
  bracketSameLine: false, // 标签的反尖括号需要换行
  rangeStart: 0, // 每个文件格式化的范围是文件的全部内容
  rangeEnd: Infinity,
  requirePragma: false, // 不需要写文件开头的 @prettier
  insertPragma: false, // 不需要自动在文件开头插入 @prettier
  embeddedLanguageFormatting: 'auto', // 格式化嵌入的内容
  overrides: [
    {
      files: ['*.less'],
      options: { singleQuote: false },
    },
  ],
}
