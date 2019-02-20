import React, { Component } from 'react';
import { css } from 'glamor'
import localForage from 'localforage'
import DanmakuHime from './DanmakuHime'
import GiftHistory from './GiftHistory'
import shortid from 'shortid'

const headerCss = css({
  position: 'fixed',
  height: 36,
  width: '100%',
  top: 0,
  left: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  backgroundColor: 'hsl(240, 5%, 96%)'
})

const mainCss = css({
  paddingTop: 40,
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
  backgroundColor: 'hsl(240, 5%, 96%)',
  '> a': {
    margin: '0 1ch',
    textDecoration: 'underline'
  },
})

const stateIndicatorCss = css({
  textAlign: 'center',
  padding: '.25em 36px',
  marginLeft: -36,
  width: '100%',
  '> .connection-state': {
    marginRight: '3ch',
  },
  ' .tag.warn': {
    color: 'hsl(36, 77%, 57%)',
  },
  ' .tag.success': {
    color: 'hsl(100, 54%, 49%)',
  },
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

const IS_PRODUCTION = localStorage.getItem('env') !== 'test'
const GIFT_ACK_THRESHOLD = 50 * 1000    // gift >= 50 CNY should be acknowledged
const GIFT_HISTORY_KEY = 'gift_history'

const getHashRoomId = () => parseInt(window.location.hash.slice(1), 10) || null

class App extends Component {
  constructor() {
    super()

    this.state = {
      roomId: null,
      giftHistory: [],
      danmakuConnectionState: 'closed',
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
    const {
      giftName,
      giftId,
      coin_type: coinType,
      num,
      price,
      total_coin: totalCoin,
      uid: userId,
      uname: userName,
      guard_level: guardLevel,
      timestamp,
    } = gift

    if (IS_PRODUCTION && coinType !== 'gold') return

    const cnyCost = parseFloat(((totalCoin || price * num) / 1000).toFixed(2))
    if (IS_PRODUCTION && totalCoin < GIFT_ACK_THRESHOLD) return

    const giftRecord = {
      key: shortid(),
      giftName,
      giftId,
      num,
      coinType,
      cnyCost,
      userId,
      userName,
      guardLevel,
      time: timestamp * 1000,
      ack: false
    }

    this.addGift(giftRecord)
  }

  addGift(giftRecord) {
    this.setState({
      giftHistory: [
        ...(this.state.giftHistory || []),
        giftRecord,
      ].slice(0, 200)
    })
  }

  ackGift(giftRecord, ack = true) {
    const giftHistory = this.state.giftHistory || []
    const index = giftHistory.indexOf(giftRecord)
    if (index === -1) return

    this.setState({
      giftHistory: [
        ...giftHistory.slice(0, index),
        { ...giftHistory[index], ack },
        ...giftHistory.slice(index + 1)
      ]
    })
  }

  clearHistory() {
    this.setState({ giftHistory: [] })
  }

  onHashChange() {
    const hash = window.location.hash
    const hashRoomId = hash && parseInt(hash.slice(1), 10)
    this.setState({ roomId: hashRoomId })
  }

  componentDidMount() {
    window.addEventListener('hashchange', this._boundOnHashChange)

    Promise.all([
      getHashRoomId(),
      localForage.getItem(GIFT_HISTORY_KEY)
    ]).then(
      ([roomId, giftHistory]) => {
        this.setState({
          roomId: roomId || null,
          giftHistory: giftHistory || []
        })
      }
    )
  }

  componentWillUnmount() {
    window.removeEventListener('hashchange', this._boundOnHashChange)
  }

  componentDidUpdate(_, prevState) {
    if (prevState.giftHistory !== this.state.giftHistory) {
      localForage.setItem(GIFT_HISTORY_KEY, this.state.giftHistory)
    }
  }

  render() {
    const {
      roomId,
      giftHistory,
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

          <GiftHistory list={giftHistory} onAck={this.ackGift.bind(this)} onClearButton={this.clearHistory.bind(this)} />

        </main>
        <footer {...footerCss}>
          <span role="img" aria-label="star">🌟</span>
          <a className="gh-link" href="https://github.com/wacky6/hikaru" rel="noopener noreferrer" target="_blank">hikaru project</a>
          /
          <a className="hikari" href="https://space.bilibili.com/25806515/" rel="nofollow noopener noreferrer" target="_blank">君は私の光</a>
        </footer>
      </div>
    );
  }
}

export default App
