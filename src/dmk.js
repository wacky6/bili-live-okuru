import EventEmitter from 'eventemitter3'
import { Buffer } from 'buffer'

/* Danmaku monitor implementation
 * Follow https://github.com/Dawnnnnnn/bilibili-live-tools/blob/master/bilibiliCilent.py
 */

function BinaryFrameParser() {
    /*
     * Reasponse Frame
     * All integers are in BIG endian
     *
     * | Length  | Magic   |   Ver   | Action  |  Param  |
     * |---------|---------|---------|---------|---------|
     * | 4 bytes | 2 bytes | 2 bytes | 4 bytes | 4 bytes |
     */

    let cur = Buffer.alloc(0)

    return function writeData(data) {
        let frames = []    // extracted frames

        cur = cur.length ? Buffer.concat([cur, data]) : data

        while (cur.length >= 16) {
            const len = cur.readInt32BE(0)
            if (cur.length < len) {
                // wait for next segment
                break
            }

            frames.push({
                magic: cur.readInt16BE(4),
                ver: cur.readInt16BE(6),
                action: cur.readInt32BE(8),
                param: cur.readInt32BE(12),
                payload: cur.slice(16, len),
            })

            cur = cur.slice(len)
        }

        return frames
    }
}

const HEARTBEAT_INTERVAL = 30 * 1000
const HEARTBEAT_DEADLINE = 10 * 1000

class DanmakuStream extends EventEmitter{
  constructor(server) {
      super()
      this._server = server
      this._ws = null
      this._heartbeatIntervalDuration = HEARTBEAT_INTERVAL
      this._heartbeatDeadline = HEARTBEAT_DEADLINE
      this._heartbeatInterval = null
      this._heartbeatTimeout = null
      this._parseBinaryFrames = null
  }

  connect() {
      this._ws = new WebSocket(`wss://${this._server}/sub`)

      this._ws.onopen = () => {
        this.emit('open')
        this._parseBinaryFrames = BinaryFrameParser()
        this._heartbeatInterval = setInterval(_ => this.sendHeartbeat(), this._heartbeatIntervalDuration)
        this.sendHeartbeat()
      }

      this._ws.onclose = () => {
        this.emit('close')
        this._ws = null
        clearInterval(this._heartbeatInterval)
        clearTimeout(this._heartbeatTimeout)
      }

      this._ws.onmessage = (msgEv) => {
        const fileReader = new FileReader()
        fileReader.onload = () => {
          this.handleData(Buffer.from(fileReader.result))
        }
        fileReader.readAsArrayBuffer(msgEv.data)
      }

      this._ws.onerror = (err) => {
        console.error(err)
      }

      return this
  }

  // join discussion channel
  // channelId = canonical roomid
  joinChannel(channelId) {
    this.sendAction(16, 1, 7, 1, { uid: 0, roomid: channelId })
  }

  // send heartbeat
  sendHeartbeat() {
    this.sendAction(16, 1, 2, 1, `[object Object]`)

    this._heartbeatSentAt = Date.now()
    this._heartbeatTimeout = setTimeout(_ => {
      this.close(1000)
      this.emit('suicide')
    }, this._heartbeatDeadline)
  }

  sendAction(magic = 16, ver = 1, action = 7, param = 1, jsonOrStr = {}) {
    /* Binary Frame Structure:
      * All integers are in BIG endian
      *
      * | 4 bytes | 2 bytes | 2 bytes | 4 bytes | 4 bytes |
      * |---------|---------|---------|---------|---------|
      * | Length  | Magic   | Ver     | Action  | Param   |
      *
      * At the time:
      *   Magic          16 (0x10)
      *   Ver            01 (0x01)
      *
      * Action / Parameters:
      *   Join Channel         7 (0x07)
      *      Parameter:    1
      *   Heartbeat            2 (0x02)
      *      Parameter:    1;  Payload should be `[object Object]`
      */
    const payloadStr = typeof jsonOrStr === 'object' ? JSON.stringify(jsonOrStr) : jsonOrStr
    const buf = Buffer.alloc(16 + Buffer.byteLength(payloadStr, 'utf-8'))
    buf.writeInt32BE(buf.length, 0)    // length
    buf.writeInt16BE(magic, 4)      // magic
    buf.writeInt16BE(ver, 6)        // ver
    buf.writeInt32BE(action, 8)     // action
    buf.writeInt32BE(param, 12)     // param
    buf.write(payloadStr, 16, 'utf-8')    // payload

    this._ws && this._ws.send(buf, { binary: true }, err => {
      err && console.error('WSS\t' + JSON.stringify({ event: 'error', error: err.message, stack: err.stack }))
    })
  }

  handleData(data) {
    this._parseBinaryFrames(data).forEach(({ magic, ver, action, param, payload }) => {
      if (ver === 1 && action === 8) return // ack to join channel
      if (ver === 1 && action === 3) return this.handleHeartbeat()
      if (ver === 0 && action === 5) return this.handleDanmaku(payload.toString('utf-8'),  { server: this._server, rx_time: Date.now() })
      // TODO: complain unknown version / action
      console.warn(`unhandled frame: magic=${magic}, ver=${ver}, action=${action}, param=${param}, data=${payload.toString('utf-8')}`)
    })
  }

  handleDanmaku(danmakuStr, meta) {
    this.emit('danmaku', danmakuStr, meta)
  }

  handleHeartbeat() {
    clearTimeout(this._heartbeatTimeout)
    const rtt = Date.now() - this._heartbeatSentAt
    this.emit('heartbeat', rtt)
  }

  close(code, reason) {
    this._ws && this._ws.close(code, reason)
  }
}

export { DanmakuStream }