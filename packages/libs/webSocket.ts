const useWebSocket = (handleOpen, handleClose, handleError, handleMessage, userInfo, wsUrl) => {
  // const wsInfo = userInfo.WsInfo
  // 协议
  // const wsProt = location.protocol === 'http:' ? 'ws://' : 'wss://'
  // 端口
  // const wsProt = window.location.port ? ':' + window.location.port : ''
  // ws地址
  // const wsUrl = wsUrls ? wsUrls : wsProt + location.hostname + wsProt + wsInfo.Path

  if (typeof wsUrl !== 'string' || wsUrl.search(/ws:\/\/|wss:\/\//) !== 0) {
    console.warn('WebSocket 无效的URL！')
    return false
  }
  const options = {
    url: wsUrl,
    userId: userInfo.UserID,
    password: userInfo.Passowrd,
    sessionId: userInfo.tokenSN,
    keepalive: userInfo.HeartbeatInterval * 1000
  }

  if (!options.password || !options.userId || !options.url || isNaN(options.keepalive)) {
    console.warn(
      'WebSocket 参数 Passowrd、SessionID、UserID、url、HeartbeatInterval 都必须有值，并且 HeartbeatInterval 必须是数字！'
    )
    return false
  }

  const protocols = undefined // 协议 暂时不知道干啥的

  // 实例化WebSocket
  try {
    const ws = new WebSocket(wsUrl, protocols)
    ws.addEventListener('open', handleOpen, false)
    ws.addEventListener('close', handleClose, false)
    ws.addEventListener('error', handleError, false)
    ws.addEventListener('message', handleMessage, false)
    return ws
  } catch (error) {
    if (error === 'SECURITY_ERR') {
      console.error('WebSocket 试图连接的端口被屏蔽！')
    } else {
      console.error(error)
    }
  }
}

export default useWebSocket
