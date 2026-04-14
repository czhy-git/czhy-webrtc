/*
 * @Author: WangLi
 * @Date: 2026-03-16 10:10:08
 * @LastEditors: WangLi
 * @LastEditTime: 2026-04-14 15:22:58
 */
import type { App } from 'vue'
import Sipcall from './utils/sipcall.js'
import componentsList from './components'
// components
export * from './components/index'

export interface CzhyWebrtcOptions {
  serve: string
  port: string
  tokenSN: string
  janusServer: string
  websocketServer: string
  apiServer: string
  account: string
  secret: string
}
// global register
const CzhyWebrtc = {
  install: (app: App, options: CzhyWebrtcOptions) => {
    console.log(options)
    const { serve, port, janusServer } = options || {}
    const appProp = app.config.globalProperties

    const sipcall = new Sipcall({
      meeting: true,
      janusServer,
      sipServer: serve + ':' + port
    })
    for (const component of componentsList) {
      const name = component.name!
      app.component(name, component)
    }
    // ak && (appProp.$baiduMapAk = ak)
  },
  version: '__VERSION__'
}
// for umd
export const install = CzhyWebrtc.install
export const version = CzhyWebrtc.version

export default CzhyWebrtc
