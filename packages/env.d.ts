/*
 * @Author: WangLi
 * @Date: 2026-04-02 10:09:35
 * @LastEditors: WangLi
 * @LastEditTime: 2026-04-02 10:09:46
 */
/// <reference types="vite/client" />
interface Window {
  [key: string]: any
  mapv: any
}
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<any, any, any>
  export default component
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
declare global {
  /** 是否是开发环境 */
  const __DEV__: boolean
}
