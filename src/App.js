import React, { Component } from 'react';
import { css } from 'glamor'
import DanmakuHime from './DanmakuHime'
import localForage from 'localforage'

const mainCss = css({
  paddingBottom: '2em'
})

const footerCss = css({
  height: '1.5em',
  fontSize: '.75em',
  textAlign: 'center',
  display: 'block',
  position: 'fixed',
  bottom: 0,
  left: 0,
  width: '100%',
  padding: '.25em 0',
  '> a': {
    margin: '0 1ch'
  }
})

const headerCss = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
})

const stateIndicatorCss = css({
  textAlign: 'center',
  padding: '.25em 36px',
  marginLeft: -36,
  width: '100%',
  '> .connection-state': {
    marginRight: '3ch'
  }
})

const ConnectionIndicator = ({room, connectionState}) => (
  <span className="state-indicator" {...stateIndicatorCss}>
    <span className="connection-state">
      { !room && <span className="tag error">未连接</span> }
      { room && connectionState !== 'opened' && <span className="tag warn">连接中</span> }
      { room && connectionState === 'opened' && <span className="tag success">已连接</span> }
    </span>

    <span className="room">
      <span className="label"></span>
      { !room && <span className="room-id">-</span> }
      { room && <span className="room-id">{room}</span> }
    </span>

    <span className="rtt">
    </span>
  </span>
)

class App extends Component {
  constructor() {
    super()

    const hash = window.location.hash
    const hashRoomId = hash && parseInt(hash.slice(1), 10)
    const storedSummary = localForage.getItem('blo_summary') || []

    this.state = {
      roomId: hashRoomId || null,
      danmakuConnectionState: 'close',
      userSummary: storedSummary,
    }

    this._boundOnHashChange = this.onHashChange.bind(this)
  }

  onDanmakuOpen() {
    this.setState({ danmakuConnectionState: 'opened' })
  }

  onDanmakuClose() {
    this.setState({ danmakuConnectionState: 'closed' })
  }

  onDanmakuMessage(jsonStr) {
    try {
      const json = JSON.parse(jsonStr)
      if (json.cmd === 'SEND_GIFT') {
        this.handleGiftDanmaku(json.data)
      }
    } catch (e) {
      console.error(`invalid json: ${jsonStr}`)
    }
  }

  handleGiftDanmaku(gift) {
    console.log(gift)
  }

  onHashChange() {
    const hash = window.location.hash
    const hashRoomId = hash && parseInt(hash.slice(1), 10)
    this.setState({ roomId: hashRoomId })
  }

  componentDidMount() {
    window.addEventListener('hashchange', this._boundOnHashChange)
  }

  componentWillUnmount() {
    window.removeEventListener('hashchange', this._boundOnHashChange)
  }

  render() {
    const {
      roomId,
      danmakuConnectionState,
    } = this.state

    return (
      <div style={{ minHeight: '100vh' }} className="App">
        <header {...headerCss}>
          <img src="/icon.png" alt="logo" style={{ width: 24, margin: '3px 6px' }}/>
          <ConnectionIndicator room={roomId} connectionState={danmakuConnectionState} />
        </header>

        <main {...mainCss}>

          <DanmakuHime
            roomId={ roomId }
            onOpen={ this.onDanmakuOpen.bind(this) }
            onClose={ this.onDanmakuClose.bind(this) }
            onDanmaku={ this.onDanmakuMessage.bind(this) }
          />

        </main>
        <footer {...footerCss}>
          <a className="gh-link" href="https://github.com/wacky6/hikaru" rel="noopener noreferrer" target="_blank"><span role="img" aria-label="star">🌟</span>hikaru project</a>
          /
          <a className="hikari" href="https://space.bilibili.com/25806515/" rel="nofollow noopener noreferrer" target="_blank">君は私の光</a>
        </footer>
      </div>
    );
  }
}

export default App
