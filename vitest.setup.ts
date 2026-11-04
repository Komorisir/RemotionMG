import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

/**
 * vitest 关闭了 globals（保持显式 import，避免全局污染），
 * 因此 Testing Library 不会自动注册 cleanup —— 必须手动卸载，
 * 否则同一个测试文件里的上一次 render 会残留在 document 上，
 * 导致 getByTestId / getByRole 命中多个元素而报错。
 */
afterEach(() => {
  cleanup()
})
