import React, { Component } from 'react';
import { css } from 'glamor'
import localForage from 'localforage'
import DanmakuHime from './DanmakuHime'
import GiftHistory from './GiftHistory'
import shortid from 'shortid'
import GiftSummary from './GiftSummary';
import DanmakuReadback from './DanmakuReadback'

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
  boxSizing: 'border-box',
  paddingTop: 40,
  paddingBottom: '1.5em',
  minHeight: '100vh',
  maxHeight: '100vh',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  alignItems: 'center',
  ' .gift-history, .gift-summary, .gift-readback': {
    display: 'none',    // hide by default, show it in active page
    overflowY: 'scroll',
    width: '100%',
    flex: '360 0 100%'
  },
  '.active-history .gift-history,.active-summary .gift-summary,.active-readback .gift-readback': {
    display: 'block !important',
  },
  ' .active-page-selection': {
    minHeight: '2em',
    maxHeight: '2em',
  },
  '@media (min-width: 1200px)': {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'stretch',
    ' .active-page-selection': {
      display: 'none'
    },
    ' .gift-history, .gift-summary, .gift-readback': {
      display: 'block !important',
      flex: '360 0 360px',
      margin: '0 10px',
    },
  }
})

const activePageSelectionCss = css({
  lineHeight: '1.6em',
  ' .tab': {
    padding: '0 0.75ch 0.1em 0.75ch',
    margin: '0 1ch',
  },
  ' .active': {
    color: 'hsl(210, 100%, 63%)',
    borderBottom: '2px solid hsl(210, 100%, 63%)'
  }
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
const GIFT_SUMMARY_KEY = 'gift_summary'
const APP_PAGE_KEY = 'active_page'

const getHashRoomId = () => parseInt(window.location.hash.slice(1), 10) || null

class App extends Component {
  constructor() {
    super()

    this.state = {
      roomId: null,
      giftHistory: [],
      giftSummary: [],
      danmakuConnectionState: 'closed',
      activePage: 'readback',
      readDanmaku: false,
    }

    this.refReadback = React.createRef()
    this._boundOnHashChange = this.onHashChange.bind(this)
  }

  onDanmakuOpen() {
    this.setState({ danmakuConnectionState: 'opened' })
  }

  onDanmakuClose() {
    this.setState({ danmakuConnectionState: 'closed' })
  }

  onDanmakuMessage(jsonStr) {
    let json
    try {
      json = JSON.parse(jsonStr)
    } catch (e) {
      console.error(`invalid json: ${jsonStr}`)
    }

    if (json.cmd === 'SEND_GIFT') {
      this.handleGiftDanmaku(json.data)
    }
    if (json.cmd === 'GUARD_BUY') {
      this.handleGuardDanmaku(json.data)
    }
    if (json.cmd === 'DANMU_MSG') {
      this.handleChatDanmaku(json.info)
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

    const cnyCost = parseFloat(((totalCoin || price * num) / 1000).toFixed(2))

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

    this.accumulateGift(giftRecord)

    const shouldAckGift = coinType === 'gold' && totalCoin >= GIFT_ACK_THRESHOLD
    if (shouldAckGift || !IS_PRODUCTION) {
      this.addGift(giftRecord)
    }
  }

  handleGuardDanmaku(guard) {
    const {
      gift_name: giftName,
      gift_id: giftId,
      num,
      price,
      uid: userId,
      username: userName,
      guard_level: guardLevel,
      start_time: timestamp,
    } = guard

    const cnyCost = parseFloat((price * num / 1000).toFixed(2))

    const giftRecord = {
      key: shortid(),
      giftName,
      giftId,
      num,
      coinType: 'gold',
      cnyCost,
      userId,
      userName,
      guardLevel,
      time: timestamp * 1000,
      ack: false
    }

    this.addGift(giftRecord)
    this.accumulateGift(giftRecord)
  }

  handleChatDanmaku(dmk) {
    if (!this.refReadback.current)
      return

    // Filter out raffle danmaku.
    if (!dmk[0][5])
      return

    this.refReadback.current.addDanmaku({
      key: shortid(),
      message: dmk[1],
      userName: dmk[2][1],
      guardLevel: dmk[7],
      time: Date.now()
    })
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

  accumulateGift(giftRecord) {
    const { giftSummary } = this.state
    const { key: recordKey, giftId, giftName, num, userId, userName, guardLevel, time } = giftRecord
    const idx = giftSummary.findIndex(summary => summary.id === giftId)
    const sumEntry = giftSummary[idx] || {
      id: giftId,
      name: giftName,
      sum: 0,
      recent: []
    }
    const newSumEntry = {
      ...sumEntry,
      sum: sumEntry.sum + num,
      recent: [
        { key: recordKey, userId, userName, guardLevel, num, time },
        ...sumEntry.recent,
      ].slice(0, 100)
    }
    if (idx === -1) {
      this.setState({
        giftSummary: [...giftSummary, newSumEntry]
      })
    } else {
      this.setState({
        giftSummary: [
          ...giftSummary.slice(0, idx),
          newSumEntry,
          ...giftSummary.slice(idx + 1)
        ]
      })
    }
  }

  clearHistory() {
    this.setState({ giftHistory: [] })
  }

  clearSummary() {
    this.setState({ giftSummary: [] })
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
      localForage.getItem(APP_PAGE_KEY),
      localForage.getItem(GIFT_HISTORY_KEY),
      localForage.getItem(GIFT_SUMMARY_KEY),
    ]).then(
      ([roomId, activePage, giftHistory, giftSummary]) => {
        this.setState({
          roomId: roomId || null,
          activePage: activePage || 'history',
          giftHistory: giftHistory || [],
          giftSummary: giftSummary || [],
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
    if (prevState.giftSummary !== this.state.giftSummary) {
      localForage.setItem(GIFT_SUMMARY_KEY, this.state.giftSummary)
    }
    if (prevState.activePage !== this.state.activePage) {
      localForage.setItem(APP_PAGE_KEY, this.state.activePage)
    }
  }

  render() {
    const {
      roomId,
      giftHistory,
      giftSummary,
      danmakuConnectionState,
      activePage,
    } = this.state

    const setActivePage = (page) => () => this.setState({ activePage: page })

    return (
      <div style={{ minHeight: '100vh' }} className="App">
        <header {...headerCss}>
          <img src="/icon.png" alt="logo" style={{ width: 24, margin: '3px 6px' }}/>
          <ConnectionIndicator room={roomId} connectionState={danmakuConnectionState} />
        </header>

        <main
          {...mainCss}
          className={`active-${activePage}`}
        >

          <DanmakuHime
            roomId={ roomId }
            onOpen={ this.onDanmakuOpen.bind(this) }
            onClose={ this.onDanmakuClose.bind(this) }
            onDanmaku={ this.onDanmakuMessage.bind(this) }
          />

          <div className="active-page-selection tabs" {...activePageSelectionCss}>
            <span className={`tab ${activePage === 'readback' ? 'active' : ''}`} onClick={setActivePage('readback')}>弹幕</span>
            <span className={`tab ${activePage === 'history' ? 'active' : ''}`} onClick={setActivePage('history')}>答谢</span>
            <span className={`tab ${activePage === 'summary' ? 'active' : ''}`} onClick={setActivePage('summary')}>数量</span>
          </div>

          <DanmakuReadback ref={this.refReadback} />
          <GiftHistory list={giftHistory} onAck={this.ackGift.bind(this)} onClearButton={this.clearHistory.bind(this)} />
          <GiftSummary list={giftSummary} onClearButton={this.clearSummary.bind(this)} />

        </main>
        <footer {...footerCss}>
          <a className="gh-link" href="https://github.com/wacky6/hikaru" rel="noopener noreferrer" target="_blank">hikaru project</a>
          <span role="img" aria-label="star"> 🌟 </span>
          <a className="hikari" href="https://space.bilibili.com/25806515/" rel="nofollow noopener noreferrer" target="_blank">君は私の光</a>
        </footer>
      </div>
    );
  }
}

export default App
