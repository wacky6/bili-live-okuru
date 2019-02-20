import { Component } from 'react';
import { DanmakuStream } from './dmk'

class DanmakuHime extends Component {
  render() {
    return null
  }

  startDanmakuStream(canonicalRoomId) {
    if (this._dmk) {
      this._dmk.off('close', this._autoReconnect)
      this._dmk.close(1000)
    }

    if (!this.props.roomId) return

    this._autoReconnect = () => {
      console.log('auto reconnect')
      this.startDanmakuStream(canonicalRoomId)
    }

    this._dmk = new DanmakuStream('broadcastlv.chat.bilibili.com')
    this._dmk.connect()
    this._dmk
      .on('open', () => {
        this.props.onOpen && this.props.onOpen()
        this._dmk.joinChannel(canonicalRoomId)
      })
      .on('close', () => this.props.onClose && this.props.onClose())
      .on('close', this._autoReconnect)
      .on('danmaku', (danmakuStr) => {
        this.props.onDanmaku && this.props.onDanmaku(danmakuStr)
      })
      .on('heartbeat', (rtt) => this.props.onHeartbeat && this.props.onHeartbeat(rtt))
  }

  componentDidMount() {
    if (this.props.roomId) {
      this.startDanmakuStream(this.props.roomId)
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.roomId !== prevProps.roomId) {
      this.startDanmakuStream(this.props.roomId)
    }
  }
}

export default DanmakuHime