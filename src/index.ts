import { registerRoot } from 'remotion'
import { RemotionRoot } from './Root'
// 全局样式只需在入口引入一次，bundle 载入时由 style-loader 注入 <style>
import './styles/global.less'

registerRoot(RemotionRoot)
