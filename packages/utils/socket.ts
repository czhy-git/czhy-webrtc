import useWebSocket from '../libs/webSocket'

const tokenSN = 'MMDS-CSS-001-2018CP2001'
let id = 0,
  ws: any = null,
  user: any = null,
  state = 0,
  sessionId = '',
  jsonrpc = ''

/* 初始化WebSocket */
export const initWebSocket = (userInfo: any = null, wsUrl = null) => {
  if (state !== 0) return console.warn('重复创建socket连接!')
  if (userInfo)
    user = {
      tokenSN: tokenSN,
      sessionid: '',
      HeartbeatInterval: 30,
      UserID: userInfo.account,
      Passowrd: userInfo.password
    }
  console.log('WebSocket 开始初始化', user)
  ws = useWebSocket(handleOpen, handleClose, handleError, handleMessage, user, wsUrl)
}

// 发送消息
export const send = (data) => {
  if (!data || state === 0) {
    let msg = 'WebSocket '
    if (!data) msg += '参数 data 不能为空!'
    if (state === 0) msg += '连接已关闭!'
    console.warn(msg)
    return false
  }

  try {
    data.id = id += 1
    data.jsonrpc = '1.0'
    ws.send(JSON.stringify(data))
    return true
  } catch (error) {
    if (error === 'INVALID_STATE_ERR') {
      console.warn('WebSocket 当前连接的状态不是OPEN！')
    } else if (error === 'SYNTAX_ERR') {
      console.warn('WebSocket 数据是一个包含unpaired surrogates的字符串！')
    }
  }
  return false
}
// 关闭WebSocket
export const close = (code, reason) => {
  if (ws && state !== 0) {
    try {
      ws.close(code, reason)
      state = 0
      ws = null
      id = 0
    } catch (error) {
      if (error === 'INVALID_ACCESS_ERR') {
        console.warn('close: 选定了无效的code！')
      } else if (error === 'SYNTAX_ERR') {
        console.warn('close: reason 字符串太长或者含有unpaired surrogates！')
      }
    }
  } else {
    console.warn('close: 连接已经关闭')
  }
}

// 监听连接
const handleOpen = () => {
  console.log('WebSocket 连接成功。')
  state = 1
  const { account, password } = user
  // const loginInfo = {
  //   method: 'login',
  //   params: { tokenSN: tokenSN, userId: account, password: password },
  // }
  const loginInfo = { method: 'SDKLogin', params: { tokenSN } }
  // { method: "SDKLogin", params: { tokenSN } }
  // {jsonrpc:"1.0",id:1212,method:"SDKLogin",params:{tokenSN:"MMDS-CSS-001-2018CP2001"}}
  try {
    console.log('loginInfo', loginInfo)
    send(loginInfo)
  } catch (error) {
    console.warn('WebSocket 登录失败，可能是连接被关闭，错误：看下一行')
    console.warn(error)
  }
}
// 监听关闭
const handleClose = (e) => {
  id = 0
  ws = null
  state = 0
  console.warn('WebSocket 关闭', e)
}
// 监听错误
const handleError = (e) => {
  console.warn('WebSocket 错误', e)
  if (ws.readyState === 3) {
    id = 0
    state = 0
    ws = null
    initWebSocket()
    console.warn('连接已经断开并尝试重新连接登录！')
  }
}
// 监听消息
const handleMessage = (e) => {
  if (!e.data) return
  const data = JSON.parse(e.data)
  data.error
    ? messageError(data.error) // 处理错误消息
    : messageSuccess(data) // 处理正确消息
}

// 错误消息处理
const messageError = (error) => {
  const { code, message } = error
  console.warn('WebSocket 错误码:' + code + ';' + '错误:' + message)
  if (code === -10001) {
    console.warn('WebSocket 密码错误！')
  } else if (code === -10002) {
    console.warn('WebSocket HTTP session超期或者不存在！')
  } else if (code === -10003) {
    console.warn('WebSocket HTTP session没有绑定！')
  }
}
// 正确消息处理
const messageSuccess = (data) => {
  // 登录消息处理
  if (state == 1) loginScoket(data)
  // 其他消息处理
  if (state == 2) msgFilter(data)
}

// 登录成功处理
const loginScoket = (data) => {
  if (!data) return console.warn('WebSocket 登录没有有效参数！')
  if (!data.result) return
  state = 2
  jsonrpc = data.jsonrpc
  sessionId = data.result.sessionId

  let id = 0
  // 心跳
  const circulateId = setInterval(() => {
    id += 1
    const data = { jsonrpc, id, method: 'heartbeat', params: { sessionId } }
    if (!send(data)) clearInterval(circulateId)
  }, user.HeartbeatInterval * 1000 * 0.8)

  console.log('WebSocket 登录成功!')
}
// 消息处理
const msgFilter = (data) => {
  const { method, params } = data
  if (method !== 'event' || !params) return

  const { content, subEvent } = params
  if (!content) return
  console.log(subEvent, content)

  // 旧事件
  if (subEvent === 'esl.old') {
    const newContent: any = {}
    const { eventName, parameters } = content
    newContent.Event = eventName
    for (const key in parameters) {
      newContent[key] = parameters[key]
    }
    // eslOldMonitorHandle(parameters)
    // console.log('esl.old', parameters);
  }

  // 多媒体调度-地图实时轨迹
  if (subEvent === 'user.location') {
    // userLocationMonitorHandle(content)
    // console.log('user.location', content);
  }

  // 分机状态
  if (subEvent === 'peer.status') {
    // peerStatusMonitorHandle(content)
    // console.log('peer.status', content);
  }

  // 用户登录
  if (subEvent === 'user.state') {
    // userStateMonitorHandle(content)
    // console.log('user.status', content);
  }

  // 短信息
  if (subEvent === 'chat.p2p.message') {
    // chatP2pMessageMonitorHandle(content)
    // console.log('chat.p2p.message', content);
  }

  // 群聊事件
  if (subEvent === 'chat.group.message') {
    // chatGroupMessageMonitorHandle(content)
    // console.log('chat.group.message', content);
  }

  // 群组事件
  if (subEvent === 'chat.group.manage') {
    // console.log('WebSocket 群组事件', content)
    // chatGroupManageMonitorHandle(content)
    // console.log('chat.group.manage', content)
  }
}
