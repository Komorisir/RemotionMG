// Less 不是 TS 能理解的模块，必须补环境声明，否则 tsc 报 TS2307
declare module '*.module.less' {
  const classes: Readonly<Record<string, string>>
  export default classes
}

declare module '*.less'
