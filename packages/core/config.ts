/*
 * @Author: WangLi
 * @Date: 2022-12-30 06:49:36
 * @LastEditors: WangLi
 * @LastEditTime: 2026-04-07 14:41:10
 */
// 视频会议-成员布局
const meetingLayout = [
  { name: '1x1', value: 1 },
  { name: '2x1', value: 2 },
  { name: '2x2', value: 4 },
  { name: '1Left3Right', value: 4 },
  { name: '3x2', value: 6 },
  { name: '1up_top_left5', value: 6 },
  { name: '3x3', value: 9 },
  { name: '4x4', value: 16 },
  { name: '8x8', value: 64 },
  { name: '1Top6Bottom', value: 7 },
  { name: '2Top6Bottom', value: 8 },
  { name: '3Top6Bottom', value: 9 }
]
const config = {
  prefix: import.meta.env.VITE_APP_PREFIX,
  title: import.meta.env.VITE_APP_TITLE,
  baseApi: import.meta.env.VITE_APP_BASE_API,
  wsJanus: true, // 是否启用websocket连接janus服务器
  janusServer: '/janus', // janus服务器地址
  timeout: 100000,
  messageDuration: 1500,
  sysConfigTime: 59000,
  transterTimeout: 40, // 转接弹窗等待时间 40s
  smsAction: import.meta.env.VITE_APP_SMS_ACTION, //HisenseSMS：运营商短信-海信 SifaSMS：运营商短信-沈阳司法
  maxErrorTimes: 3, //验证码输入错误禁止登录的最大次数
  browserLogin: true, //是否支持浏览器账号密码登录
  defaultPage: '/webrtc', //默认路由
  meetingLayout
}

export default config

export { config }
