/* eslint-disable */
// import api from './api'
import Janus from '../libs/janus'
import EventBus from './bus'
// import adapter from 'webrtc-adapter'
// import { fabric } from 'fabric-with-erasing'

class Sipcall extends EventBus {
  janus = null // janus实例
  handle = null // janus插件实例
  username = null // 注册用户
  localVideo = null // 本地流
  remoteVideo = null // 远端流
  is_incoming_call = false // 来电状态
  is_call = false // 通话状态
  is_audio = true // 语音状态
  is_video = false // 视频状态
  is_register = false // 注册状态
  jsep = null // 临时jsep
  roomID = null // 会议号码
  localDomv = null // 本地视频DOM
  playVideo = null // 本地播放DOM
  localCanvas = null // 本地画布DOM
  opaqueId = 'siptest-' + Janus.randomString(12) // 随机数字
  // 消息类型
  msgType = {
    registering: '开始注册',
    registered: '注册成功',
    registration_failed: '注册失败',
    calling: '拨号等待',
    incomingcall: '来电提示',
    accepting: '接听电话1',
    info: '信息',
    accepted: '接听电话',
    progress: '呼叫处理',
    updatingcall: '再次收到邀请',
    notify: '通知',
    proceeding: '呼叫进行中',
    transfer: '转拨通话',
    message: '消息',
    missed_call: '未接电话',
    hangingup: '主动挂断',
    hangup: '挂断'
  }

  #gxStream = null // 共享屏幕源
  #xjStream = null // 本地摄像头源
  #bdStream = null // 本地视频
  scratchpad = null // 画布

  audioSend = true // 发送音频
  audioRecv = true // 接收音频
  videoSend = true // 发送视频
  videoRecv = true // 接收视频

  static noop = function () {} // 默认方法

  constructor(options) {
    super()
    // sip头
    this.sip = options.sip || 'sip:'
    // sip服务器地址
    this.sipServer = options.sipServer
    // janus服务器地址
    this.janusServer = options.janusServer
    // 是否用会议功能
    this.is_meetings = options.meeting || options.meeting == undefined
  }

  /** @name 初始化 **/
  init(plugin) {
    const _this = this
    const map = this.eventMap
    return new Promise((resolve) => {
      Janus.init({
        debug: 'all',
        dependencies: Janus.useDefaultDependencies({ adapter }),
        callback: function () {
          if (!Janus.isWebrtcSupported()) {
            console.error('没有WebRTC支持... ')
            resolve(false)
          } else {
            console.log('Janus初始化成功')
            _this.janus = new Janus({
              server: _this.janusServer,
              success: () => {
                console.log('Janus实例化成功')
                _this.janus.attach({
                  opaqueId: _this.opaqueId,
                  plugin: plugin || 'janus.plugin.sip',
                  success: (pluginHandle) => {
                    _this.handle = pluginHandle
                    let getId = pluginHandle.getId(),
                      getPlugin = pluginHandle.getPlugin()
                    resolve(true)
                    console.log(`Janus插件完成,插件类型：${getPlugin}，id: ${getId}`)
                  },
                  error: (error) => {
                    resolve(false)
                    console.error('Janus实例化失败', error)
                  },
                  /** 清理通知，退出 销毁  @return null */
                  oncleanup: _this.#oncleanup.bind(_this),
                  /** ice状态  @return state */
                  iceState: _this.#iceState.bind(_this),
                  /** WebRTC PC状态  @return on */
                  webrtcState: _this.#webrtcState.bind(_this),
                  /** 是否显示提示UI true显示 false 不显示  @return on */
                  consentDialog: _this.#consentDialog.bind(_this),
                  /** 接收消息  @return msg, jsep */
                  onmessage: _this.#onMessage.bind(_this),
                  /** 媒体状态  @return medium, on */
                  mediaState: _this.#mediaState.bind(_this),
                  /** 本地视频流  @return stream */
                  onlocalstream: _this.#onlocalstream.bind(_this),
                  /** 远端视频流  @return stream */
                  onremotestream: _this.#onremotestream.bind(_this)
                })
              },
              error: (error) => {
                resolve(false)
                console.error('Janus建立服务器失败', error)
              },
              destroyed: () => {
                resolve(false)
                console.error('Janus销毁')
              }
            })
          }
        }
      })
    })
  }
  /** @name 注册SIP **/
  register(info) {
    console.log('info', info)
    this.janus.getInfo((params) => {
      console.log('params', params)
    })
    if (this.handle == null) {
      alert('请先初始化Janus')
      console.log('请先初始化Janus')
    } else {
      this.username = info.username || ''
      let { username, password, authuser, displayname } = info
      const register = {
        request: 'register', // 注册信息
        secret: password || '123456', // 密码
        username: this.sip + (username || '5503') + '@' + this.sipServer, // 用户名
        authuser: authuser || '5503', // 验证用户名
        proxy: this.sip + this.sipServer, // 服务器地址
        displayname: displayname || '5503' // 昵称
      }
      console.log('Janus开始注册', register)
      this.handle.send({ message: register })
    }
  }
  // registed(info) {
  //   console.log("info", info);
  // }
  /** @name 注销Janus连接 **/
  destroy() {
    this.janus.destroy()
  }
  /** @name 拨打视频 **/
  doCall(phoneSip, media = 'video') {
    if (this.handle == null) {
      alert('请先初始化Janus')
      console.log('请先初始化Janus')
    } else {
      if (phoneSip) {
        let username = `sip:${phoneSip}@${this.sipServer}`
        this.is_video = media == 'video' ? true : false
        let doVideo = media == 'video' ? true : false
        console.log({
          audioSend: this.audioSend,
          audioRecv: this.audioRecv,
          videoSend: this.videoSend ? doVideo : this.videoSend,
          videoRecv: this.videoRecv ? doVideo : this.videoSend
        })
        if (username.indexOf('sip:') != 0 || username.indexOf('@') < 0) {
          alert('请插入有效的SIP地址 (例如, sip:pluto@example.com)')
        } else {
          this.handle.createOffer({
            media: {
              audioSend: this.audioSend,
              audioRecv: this.audioRecv,
              videoSend: this.videoSend ? doVideo : this.videoSend,
              videoRecv: this.videoRecv ? doVideo : this.videoSend
            },
            success: (jsep) => {
              console.log('拨打电话得到jsep', jsep)
              var sid = sessionStorage.getItem('commonSid') || ''
              var body = {
                request: 'call',
                uri: username,
                headers: { 'X-sid': sid, 'czhy-autoanswer': true }
              }
              console.log('拨打电话body', body)
              this.handle.send({ message: body, jsep: jsep })
            },
            error: (error) => console.error('WebRTC 错误... ' + error)
          })
        }
      } else {
        alert('请输入号码')
      }
    }
  }
  /** @name 接听电话 **/
  doAnswer(offerlessInvite = false) {
    console.log('offerlessInvite', offerlessInvite)
    if (this.handle == null) {
      alert('请先初始化Janus')
      console.log('请先初始化Janus')
    } else {
      const { jsep, is_audio, is_video, handle } = this
      let sipcallAction = offerlessInvite ? handle.createOffer : handle.createAnswer
      sipcallAction({
        jsep: jsep,
        // media: { audio: is_audio, video: is_video },
        media: {
          audioSend: this.audioSend,
          audioRecv: this.audioRecv,
          videoSend: this.videoSend ? is_video : this.videoSend,
          videoRecv: this.videoRecv ? is_video : this.videoRecv
        },
        success: function (jsep) {
          var body = { request: 'accept' }
          handle.send({ message: body, jsep: jsep })
          console.log(`Got SDP ${jsep.type}! audio=${is_audio}, video=${is_video}:`, jsep)
        },
        error: function (error) {
          console.error('WebRTC 错误... ' + error.message)
          // 不要让调用者等待更长的时间，而是使用480而不是默认的486来阐明原因
          var body = { request: 'decline', code: 480 }
          handle.send({ message: body })
        }
      })
    }
  }
  /** @name 挂断电话 **/
  doHangup() {
    console.log('主动挂断', this.handle)
    if (this.handle == null) {
      alert('请先初始化Janus')
      console.log('请先初始化Janus')
    } else {
      console.log('挂断电话:doHangup')
      this.is_incoming_call = false
      this.handle.send({ message: { request: 'hangup' } })
      this.handle.hangup()
      this.#closeOther(5)
    }
  }
  /** @name 挂断来电 **/
  doDecline() {
    if (this.handle == null) {
      alert('请先初始化Janus')
      console.log('请先初始化Janus')
    } else {
      console.log('挂断来电:doDecline')
      this.handle.send({ message: { request: 'decline' } })
      this.handle.hangup()
      this.#closeOther(5)
    }
  }
  /** @name  静音、取消静音 **/
  doMute(val) {
    if (this.handle == null) {
      alert('请先初始化Janus')
      console.log('请先初始化Janus')
    } else {
      val ? this.handle.muteAudio() : this.handle.unmuteAudio()
    }
  }
  /** @name  开启视频、关闭视频 **/
  doCameraval(val) {
    if (this.handle == null) {
      alert('请先初始化Janus')
      console.log('请先初始化Janus')
    } else {
      val ? this.handle.muteVideo() : this.handle.unmuteVideo()
    }
  }
  /** @name  开启音视频流 **/
  attachMediaStream(el, stream) {
    Janus.attachMediaStream(el, stream)
  }
  /** @name  屏幕共享 **/
  screenSharing() {
    if (this.handle == null) {
      alert('请先初始化Janus')
      console.log('请先初始化Janus')
    } else {
      var screenShareConstraints = { video: true, audio: false }
      if (navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices
          .getDisplayMedia(screenShareConstraints)
          .then(
            function (stream) {
              this.#screenSharingSuccess(stream)
            }.bind(this)
          )
          .catch((err) => {
            if (err.message.indexOf('Permission') >= 0) {
              alert('请查看权限')
            }
          })
      } else {
        navigator
          .getDisplayMedia(screenShareConstraints)
          .then(
            function (stream) {
              this.#screenSharingSuccess(stream)
            }.bind(this)
          )
          .catch((err) => {
            if (err.message.indexOf('Permission') >= 0) {
              alert('请查看权限')
            }
          })
      }
    }
  }
  #screenSharingSuccess = function (newStream) {
    let localStream = new MediaStream()
    let handle = this.handle
    let pc = handle.webrtcStuff.pc
    this.#gxStream = newStream
    var newMediaTrack = newStream.getVideoTracks()[0]
    pc.getSenders().forEach(function (RTCRtpSender) {
      if (RTCRtpSender.track && RTCRtpSender.track.kind == 'video') {
        RTCRtpSender.track.stop()
        RTCRtpSender.replaceTrack(newMediaTrack)
        localStream.addTrack(newMediaTrack)
      }
    })
    let localVideo = this.localDomv
    localVideo.srcObject = localStream
    localVideo.onloadedmetadata = function (e) {
      localVideo.play()
    }

    this.#closeOther(1)

    // 设置成员观看
    this.#setPeerCanvas(3)
  }
  /** @name  视频播放 **/
  localBroadcast(file) {
    const input = event.target
    if (input.files.length >= 1) {
      let ResampleSize = 360
      let src = URL.createObjectURL(input.files[0])
      let handle = this.handle

      let newVideo = this.playVideo
      newVideo.src = src
      newVideo.onloadedmetadata = function () {
        var videoObj = newVideo
        var resampleCanvas = document.createElement('canvas')
        var videoWidth = videoObj.videoWidth
        var videoHeight = videoObj.videoHeight
        if (videoWidth >= videoHeight) {
          if (videoHeight > ResampleSize) {
            var p = ResampleSize / videoHeight
            videoHeight = ResampleSize
            videoWidth = videoWidth * p
          }
        } else {
          if (videoWidth > ResampleSize) {
            var p = ResampleSize / videoWidth
            videoWidth = ResampleSize
            videoHeight = videoHeight * p
          }
        }
        resampleCanvas.width = videoWidth
        resampleCanvas.height = videoHeight

        var resampleContext = resampleCanvas.getContext('2d')
        handle.videoResampleInterval = window.setInterval(function () {
          resampleContext.drawImage(videoObj, 0, 0, videoWidth, videoHeight)
        }, 40)
        var videoMediaStream = videoObj.captureStream()
        var resampleVideoMediaStream = resampleCanvas.captureStream(25)
        var videoMediaTrack = resampleVideoMediaStream.getVideoTracks()[0]
        var audioTrackFromVideo = videoMediaStream != null ? videoMediaStream.getAudioTracks()[0] : null

        var pc = handle.webrtcStuff.pc
        pc.getSenders().forEach(
          function (RTCRtpSender) {
            if (RTCRtpSender.track && RTCRtpSender.track.kind == 'video') {
              RTCRtpSender.track.stop()
              RTCRtpSender.replaceTrack(videoMediaTrack)
            }
            if (RTCRtpSender.track && RTCRtpSender.track.kind == 'audio') {
              handle.AudioSourceTrack = RTCRtpSender.track
              var mixedAudioStream = new MediaStream()
              if (audioTrackFromVideo) mixedAudioStream.addTrack(audioTrackFromVideo)
              mixedAudioStream.addTrack(RTCRtpSender.track)
              var mixedAudioTrack = this.#MixAudioStreams(mixedAudioStream).getAudioTracks()[0]
              mixedAudioTrack.IsMixedTrack = true
              RTCRtpSender.replaceTrack(mixedAudioTrack)
            }
          }.bind(this)
        )

        var localVideo = this.localDomv
        localVideo.srcObject = videoMediaStream
        localVideo.onloadedmetadata = function () {
          localVideo.play()
        }
        videoObj.play()
        this.#bdStream = true

        this.#closeOther(2)
        // 设置成员观看
        this.#setPeerCanvas(3)
      }.bind(this)
    }
  }
  /** @name  画板 **/
  localCanvass() {
    console.log(this.scratchpad)
    if (this.scratchpad == null) {
      let handle = this.handle
      let el = this.localCanvas
      let width = el.clientWidth
      let height = el.clientHeight

      var newCanvas = document.createElement('canvas')
      newCanvas.id = 'line-canvas'
      newCanvas.style.display = 'inline-block'
      newCanvas.style.width = '100%'
      newCanvas.style.height = '100%'
      el.appendChild(newCanvas)
      el.style.zIndex = 6
      this.scratchpad = new fabric.Canvas('line-canvas', {
        width,
        height,
        isDrawingMode: true,
        backgroundColor: 'white'
      })
      this.scratchpad.renderAll()
      this.scratchpad.redrawIntrtval = window.setInterval(
        function () {
          this.scratchpad.renderAll()
        }.bind(this),
        1000
      )

      let canvasMediaStream = newCanvas.captureStream(25)
      let canvasMediaTrack = canvasMediaStream.getVideoTracks()[0]
      var pc = handle.webrtcStuff.pc
      pc.getSenders().forEach(function (RTCRtpSender) {
        if (RTCRtpSender.track && RTCRtpSender.track.kind == 'video') {
          RTCRtpSender.track.stop()
          RTCRtpSender.replaceTrack(canvasMediaTrack)
        }
      })
      this.#closeOther(3)
      // 设置成员观看
      this.#setPeerCanvas(3)
      console.log('设置画板成功')
    }
  }
  /** @name  还原 **/
  localCamera() {
    var localStream = new MediaStream()
    var handle = this.handle
    var pc = handle.webrtcStuff.pc
    var screenShareConstraints = { video: true, audio: false }
    navigator.mediaDevices
      .getUserMedia(screenShareConstraints)
      .then(
        function (newStream) {
          this.#xjStream = newStream
          pc.getSenders().forEach(function (RTCRtpSender) {
            if (RTCRtpSender.track && RTCRtpSender.track.kind == 'video') {
              RTCRtpSender.track.stop()
              RTCRtpSender.replaceTrack(newStream.getVideoTracks()[0])
              localStream.addTrack(newStream.getVideoTracks()[0])
            }
          })
          let localVideo = this.localDomv
          localVideo.srcObject = localStream
          localVideo.onloadedmetadata = function (e) {
            localVideo.play()
          }
          this.#closeOther(4)
          // 设置成员观看
          this.#setPeerCanvas(1)
        }.bind(this)
      )
      .catch((error) => {
        console.log('远程失败', error)
      })
  }
  /** @name  擦除画布 **/
  wipeCanvas(el) {
    if (this.scratchpad) {
      if (this.scratchpad.wipe) {
        el.innerText = '擦除'
        this.scratchpad.freeDrawingBrush = this.scratchpad.wipe
        this.scratchpad.wipe = false
      } else {
        el.innerText = '取消擦除'
        this.scratchpad.wipe = this.scratchpad.freeDrawingBrush
        this.scratchpad.freeDrawingBrush = new fabric.EraserBrush(this.scratchpad)
        this.scratchpad.freeDrawingBrush.width = 10
      }
    }
  }
  /** @name  清空画布 **/
  emptyCanvas() {
    if (this.scratchpad) {
      this.scratchpad.clear()
      this.scratchpad.backgroundColor = '#FFF'
    }
  }
  /** @name  设置画笔大小 **/
  brushSize(val) {
    if (this.scratchpad) {
      this.scratchpad.freeDrawingBrush.width = val
    }
  }
  /** @name  关闭 屏幕共享 视频播放 共享画板 摄像头 **/
  closeOther() {
    console.log('关闭')
    this.#closeOther(5)
    this.is_incoming_call = false
  }
  /** @name  关闭 屏幕共享 视频播放 共享画板 摄像头 **/
  #closeOther = function (type) {
    // 共享屏幕
    if (type != 1 && this.#gxStream) {
      this.#gxStream.getTracks().forEach((item) => {
        item.stop()
        this.#gxStream = null
      })
      console.log('关闭屏幕共享')
    }
    // 视频播放
    if (type != 2 && this.#bdStream) {
      let pc = this.handle.webrtcStuff.pc
      if (this.handle.AudioSourceTrack && this.handle.AudioSourceTrack.kind == 'audio') {
        if (pc) {
          pc.getSenders().forEach(
            function (RTCRtpSender) {
              if (RTCRtpSender.track && RTCRtpSender.track.kind == 'audio') {
                RTCRtpSender.replaceTrack(this.handle.AudioSourceTrack)
                  .then(function () {
                    RTCRtpSender.track.enabled = true
                  })
                  .catch(function (e) {
                    console.error(e)
                  })
                this.handle.AudioSourceTrack = null
              }
            }.bind(this)
          )
        }
        this.#bdStream = null
        if (this.handle.videoResampleInterval) {
          this.playVideo.pause()
          this.playVideo.removeAttribute('src')
          this.playVideo.load()
          window.clearInterval(this.handle.videoResampleInterval)
          this.handle.videoResampleInterval = null
        }
      }
      console.log('关闭视频播放')
    }
    // 共享画板
    if (type != 3 && this.scratchpad) {
      window.clearInterval(this.scratchpad.redrawIntrtval)
      this.localCanvas.removeChild(document.querySelector('.canvas-container'))
      // this.localCanvas.style.zIndex = 5
      // this.localCanvas.style.display = 'none'
      this.scratchpad.clear()
      try {
        this.scratchpad.dispose()
      } catch (error) {
        console.log(error)
      }
      this.scratchpad = null
      console.log('关闭共享画板')
    }
    // 还原摄像头
    if (type != 4 && this.#xjStream) {
      this.#xjStream.getTracks().forEach((item) => {
        item.stop()
        this.#xjStream = null
      })
      console.log('关闭摄像头')
    }
    // 设置成员观看
    // this.#setPeerCanvas(1)
  }
  #setPeerCanvas = function (id) {
    setTimeout(
      function () {
        // api.setPeerCanvas(id, this.roomID, this.username).then((res) => {
        //   if (res.Succeed) {
        //     return api.setPeerWatchingCanvasFun(id, this.roomID, 'all')
        //   }
        // })
      }.bind(this),
      100
    )
  }
  /** @name  流操作 **/
  #MixAudioStreams = function (MultiAudioTackStream) {
    // 接收带有任意数量音轨的MediaStream，并将它们混合在一起
    var audioContext = null
    try {
      window.AudioContext = window.AudioContext || window.webkitAudioContext
      audioContext = new AudioContext()
    } catch (e) {
      console.warn('AudioContext()不可用，无法记录')
      return MultiAudioTackStream
    }
    var mixedAudioStream = audioContext.createMediaStreamDestination()
    MultiAudioTackStream.getAudioTracks().forEach(function (audioTrack) {
      var srcStream = new MediaStream()
      srcStream.addTrack(audioTrack)
      var streamSourceNode = audioContext.createMediaStreamSource(srcStream)
      streamSourceNode.connect(mixedAudioStream)
    })
    return mixedAudioStream.stream
  }

  /** @name 回调消息处理 **/
  // 消息
  #onMessage = function (msg, jsep) {
    let result = null,
      event = null
    if (msg && msg.result) result = msg.result
    if (result && result.event) event = result.event
    console.warn(`(${this.msgType[event] || '无'})消息类型：${event}`, msg, jsep)

    if (event === 'calling') this.#calling()
    if (event === 'accepting') this.#accepting()
    if (event === 'declining') this.#declining()
    if (event === 'hangup') this.#hangup(result)
    if (event === 'registered') this.#register(true, result)
    if (event === 'transfer') this.#transfer(result)
    if (event === 'accepted') this.#accepted(result, jsep)
    if (event === 'progress') this.#progress(result, jsep)
    if (event === 'updatingcall') this.#updatingcall(jsep)
    if (event === 'registration_failed') this.#register(false, result)
    if (event === 'incomingcall') this.#incomingcall(msg, jsep, result, event)
    if (event === 'message' || event === 'info' || event === 'notify') this.#onmsg(result, event)
  }
  // 清理通知，退出 销毁
  #oncleanup = function () {
    console.log('清理通知：oncleanup', new Date())
    if (this.is_incoming_call && this.roomID) {
      console.log('会议来电')
      // this.doAnswer(offerlessInvite);
      this.doCall(this.roomID, 'video')
      return
    }
    this.roomID = null
    this.username = null
    this.is_incoming_call = false
    this.is_call = false
    this.is_video = false
    this.localVideo = null
    this.remoteVideo = null
    this.#closeOther()
    this.eventMap['oncleanup'] ? this.emit('oncleanup') : Sipcall.noop
  }
  // ice状态
  #iceState = function (state) {
    console.log('iceState:', state)
    this.eventMap['iceState'] ? this.emit('iceState', state) : Sipcall.noop
  }
  // WebRTC PC状态
  #webrtcState = function (on) {
    console.log('webrtcState:', on)
    this.eventMap['webrtcState'] ? this.emit('webrtcState', on) : Sipcall.noop
  }
  // 是否显示提示UI
  #consentDialog = function (on) {
    this.eventMap['consentDialog'] ? this.emit('consentDialog', on) : Sipcall.noop
  }
  // 媒体状态
  #mediaState = function (medium, on) {
    this.eventMap['mediaState'] ? this.emit('mediaState', { medium, on }) : Sipcall.noop
  }
  // 本地流
  #onlocalstream = function (stream) {
    console.log('本地流', stream)
    this.localVideo = stream
    this.eventMap['onlocalstream'] ? this.emit('onlocalstream', stream) : Sipcall.noop
  }
  // 远端流
  #onremotestream = function (stream) {
    console.log('远端流', stream)
    this.remoteVideo = stream
    this.eventMap['onremotestream'] ? this.emit('onremotestream', stream) : Sipcall.noop
  }
  // 注册事件
  #register = function (isRegisted, result) {
    this.is_register = isRegisted
    console.log(isRegisted ? '注册成功' : '注册失败', result)
    this.eventMap['register'] ? this.emit('register', isRegisted) : Sipcall.noop
    this.eventMap['registed'] ? this.emit('registed', { isRegisted, result }) : Sipcall.noop
  }
  // 拨号等待
  #calling = function () {
    console.log('正在拨号，等待对方接受...')
    this.eventMap['calling'] ? this.emit('calling') : Sipcall.noop
  }
  // 来电提示
  #incomingcall = function (msg, jsep, result, event) {
    this.is_incoming_call = true
    let offerlessInvite = false
    if (this.handle == null) {
      alert('请先初始化Janus')
      console.log('请先初始化Janus')
    } else {
      console.log(result['username'] + '打电话来啦！', result)

      let calId = result['username'].match(/sip:(\S*)@/)[1]
      if (calId.indexOf('conference') > -1) {
        this.roomID = calId.match(/conference(\S*)/)[1]
        console.log('会议来电', this.roomID)
      }

      if (jsep) {
        this.jsep = jsep
        this.is_audio = jsep.sdp.indexOf('m=audio ') > -1
        this.is_video = jsep.sdp.indexOf('m=video ') > -1
        console.log(jsep)
        console.log(this.is_audio && this.is_video ? '音频通话 + 视频通话' : '音频通话')
      } else {
        console.log('这个电话不包含jsep，我们需要自己提供一个')
        offerlessInvite = true
      }
      // 通知用户
      let extra = ''
      if (offerlessInvite) extra = '(没有提供SDP报价)'

      // 这是转移的通话吗?
      let transfer = ''
      let referredBy = result['referred_by']
      if (referredBy) {
        transfer = ' (referred by ' + referredBy + ')'
        transfer = transfer.replace(new RegExp('<', 'g'), '&lt')
        transfer = transfer.replace(new RegExp('>', 'g'), '&gt')
      }

      // 提供安全吗?缺少“srtp”属性意味着纯RTP
      let rtpType = ''
      let srtp = result['srtp']
      if (srtp === 'sdes_optional') rtpType = ' (SDES-SRTP offered)'
      if (srtp === 'sdes_mandatory') rtpType = ' (SDES-SRTP mandatory)'
      // 会议来电自动接听
      if (result.username.includes('conference')) {
        console.log('会议来电')
        // this.doAnswer(offerlessInvite);
        this.doDecline()
        // setTimeout(() => {
        //   const roomID = calId.match(/conference(\S*)/)[1];
        //   this.roomID = roomID;
        //   this.doCall(roomID, "video");
        // }, 500);
      } else if (siteConfig.autoAnswer) {
        this.doAnswer(offerlessInvite)
      }
    }
    this.eventMap['incomingcall']
      ? this.emit('incomingcall', { msg, jsep, result, event, offerlessInvite })
      : Sipcall.noop
  }
  // 接听电话1
  #accepting = function () {
    console.log('接听了电话！')
    this.eventMap['accepting'] ? this.emit('accepting') : Sipcall.noop
  }
  // 接听电话2
  #accepted = function (result, jsep) {
    this.is_incoming_call = false
    if (result.username) {
      let calId = result['username'].match(/sip:(\S*)@/)[1]
      console.log(calId + '接听了我的通话邀请', result.username)
      // this.roomID = calId;
      if (result.username.includes('conference')) {
        this.roomID = calId
      }
    } else {
      console.log('我接听了对方的通话邀请')
    }
    if (jsep) this.handle.handleRemoteJsep({ jsep: jsep, error: this.doHangup })
    this.eventMap['accepted'] ? this.emit('accepted', { result, jsep }) : Sipcall.noop
  }
  // 呼叫处理
  #progress = function (result, jsep) {
    console.log('有来自' + result['username'] + '的早期媒体，渴望调用!', jsep)
    if (jsep) this.handle.handleRemoteJsep({ jsep: jsep, error: this.doHangup })
    this.eventMap['progress'] ? this.emit('progress', { result, jsep }) : Sipcall.noop
  }
  // 再次收到邀请
  #updatingcall = function (jsep) {
    console.log('再次收到邀请')
    let audio = jsep.sdp.indexOf('m=audio ') > -1
    let video = jsep.sdp.indexOf('m=video ') > -1
    this.handle.createAnswer({
      jsep: jsep,
      media: { audio, video },
      success: (jsep) => {
        var body = { request: 'update' }
        this.handle.send({ message: body, jsep: jsep })
        console.log(`Got SDP ${jsep.type}! audio=${audio}, video=${video}:`, jsep)
      },
      error: (error) => console.error('WebRTC 错误:', error)
    })
    this.eventMap['updatingcall'] ? this.emit('updatingcall', jsep) : Sipcall.noop
  }
  // 转拨通话
  #transfer = function (result) {
    let referTo = result['refer_to']
    let referredBy = result['referred_by'] ? result['referred_by'] : 'an unknown party'
    let referId = result['refer_id']
    let replaces = result['replaces']
    let extra = 'referred by ' + referredBy
    if (replaces) extra += ', replaces call-ID ' + replaces
    extra = extra.replace(new RegExp('<', 'g'), '&lt')
    extra = extra.replace(new RegExp('>', 'g'), '&gt')
    console.log('将通话转移至：' + referTo + '? (' + extra + ')', referId)
    this.eventMap['transfer'] ? this.emit('transfer', result) : Sipcall.noop
  }
  // 消息 信息 通知
  #onmsg = function (result, event) {
    // 消息
    if (event === 'message') {
      let sender = result['displayname'] ? result['displayname'] : result['sender']
      let content = result['content']
      content = content.replace(new RegExp('<', 'g'), '&lt')
      content = content.replace(new RegExp('>', 'g'), '&gt')
      console.log('消息：' + sender, content)
    }
    // 信息
    if (event === 'info') {
      let sender = result['displayname'] ? result['displayname'] : result['sender']
      let content = result['content']
      content = content.replace(new RegExp('<', 'g'), '&lt')
      content = content.replace(new RegExp('>', 'g'), '&gt')
      console.log('信息：' + sender, content)
    }
    // 通知
    if (event === 'notify') {
      let notify = result['notify']
      let content = result['content']
      console.log('通知：' + notify, content)
    }
    this.eventMap['onmsg'] ? this.emit('onmsg', { result, event }) : Sipcall.noop
  }
  // 挂断
  #hangup = function (result) {
    // this.doHangup();
    console.log(`电话挂了,原因(code:${result['code']},reason:${result['reason']})`)
    this.eventMap['hangup'] ? this.emit('hangup', result) : Sipcall.noop
  }
  // 挂断来电
  #declining = function (result) {
    console.log('挂断来电：declining', new Date())
  }
  // 监听会议相关事件
  onMeeting = function (result) {
    this.eventMap['meeting'] ? this.emit('meeting', result) : Sipcall.noop
  }
}

export default Sipcall
