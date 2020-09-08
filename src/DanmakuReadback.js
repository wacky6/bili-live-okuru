import React, { Component } from 'react';
import { css } from 'glamor'
import { render as renderTimeAgo, cancel as cancelTimeAgo } from 'timeago.js'
import UserBadge from './UserBadge'
import "./checkbox.css"
import "./button.css"

const emoticons = {
  ':D': '笑脸',
  '(⌒▽⌒)': '开心',
  '（￣▽￣）': '笑嘻嘻',
  '(=・ω・=)': '喵喵～',
  '(｀・ω・´)': '快乐',
  '(〜￣△￣)〜': '你听我说嘛',
  '(･∀･)': '笑',
  '(°∀°)ﾉ': '笑',
  '(￣3￣)': '嘟嘴',
  '╮(￣▽￣)╭': '好耶',
  '_(:3」∠)_': '趴',
  '( ´_ゝ｀)': '',
  '←_←': '左斜眼',
  '→_→': '右斜眼',
  '(<_<)': '不要嘛',
  '(>_>)': '不要嘛',
  '(;¬_¬)': '切～',
  '("▔□▔)/': '啊，这！',
  '(ﾟДﾟ≡ﾟдﾟ)!?': '呐泥？',
  'Σ(ﾟдﾟ;)': '震惊',
  'Σ( ￣□￣||)': '吐血',
  '(´；ω；`)': 'emm',
  '（/TДT)/': '大哭',
  '(^・ω・^ )': '害羞',
  '(｡･ω･｡)': '害羞',
  '(●￣(ｴ)￣●)': '熊熊',
  'ε=ε=(ノ≧∇≦)ノ': '溜了溜了',
  '(´･_･`)': '啊咧？',
  '(-_-#)': '一时语塞',
  '（￣へ￣）': '撇嘴',
  '(￣ε(#￣) Σ': '被打',
  'ヽ(`Д´)ﾉ': 'rua～',
  '（#-_-)┯━┯': '摆好小板凳',
  '(╯°口°)╯(┴—┴': '掀桌',
  '←◡←': '滑稽',
  '( ♥д♥)': '星星眼',
  'Σ>―(〃°ω°〃)♡→': '怦然心动',
  '⁄(⁄ ⁄•⁄ω⁄•⁄ ⁄)⁄': '囧',
  '(╬ﾟдﾟ)▄︻┻┳═一': '哒哒哒哒哒～',
  '･*･:≡(　ε:)': '',
  '(汗)': '汗',
  '(苦笑)': '苦笑'
}

function eliminateSymbols(text) {
  return text.replace(/[_-]/g, '')
}

function refineMessageText(text) {
  text = text.replace(/1/g, '一')
  text = text.replace(/2/g, '二')
  text = text.replace(/3/g, '三')
  text = text.replace(/4/g, '四')
  text = text.replace(/5/g, '五')
  text = text.replace(/6/g, '六')
  text = text.replace(/7/g, '七')
  text = text.replace(/8/g, '八')
  text = text.replace(/9/g, '九')
  text = text.replace(/0/g, '零')
  text = text.replace(/www+$/g, '啊啊啊啊啊')
  text = text.replace(/hhh+$/g, '呵呵呵呵呵呵')
  for (const emoticon in emoticons)
    text = text.replaceAll(emoticon, `（${emoticons[emoticon] || '颜文字'})`)

  return text
}

function refineUserName(name) {
  if (/^bili[_-].+$/.test(name))
    return '一位B站用户'

  return eliminateSymbols(name)
}

const giftReadbackCss = css({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'flex-start',
  padding: '.25em 1ch',
  maxWidth: 480,
  '> .options': {
    textAlign: 'center'
  },
  '> .options > div':{
    margin: '.5em auto'
  },
  '> .danmaku-message': {
    flex: '1 1',
    padding: '.25em 1ch',
  },
  "> .list": {
    listStyle: 'none',
    paddingLeft: 0,
  },
  '> .list > *': {
    padding: '.5em 0'
  },
  ' .time': {
    marginTop: '.2em',
    fontSize: '80%',
    color: '#888',
  },
  ' .user-name': {
    color: '#888',
  },
  ' .badge': {
    margin: '0 1ch',
    color: '#aaa',
    fontSize: '80%',
    verticalAlign: 'middle',
    wordBreak: 'keep-all',
    '::before': {
      content: "["
    },
    '::after': {
      content: "]"
    },
  }
})

const DanmakuMessage = ({
  key = Date.now(),
  message = '',
  userName = '',
  guardLevel = 3,
}) => (
  <li key={key} className='danmaku-message'>
    <span className="user-name">{ userName }</span>
    <UserBadge guardLevel={ guardLevel } />
    <span className="colon">：</span>
    <span className="message">{ message }</span>
  </li>
)

class DanmakuReadback extends Component {
  constructor() {
    super()

    this.state = {
      list: [],
      activeVoice: '_loading',
      voices: [],
      voicesLoaded: false,
      volume: 0.5,
      lastActiveTime: null,
    }

    this.readQueue = []
    this.refSpeakBtn = React.createRef()
    this.refTimeago = React.createRef()
  }

  addDanmaku({
    key = Date.now(),
    message = '',
    userName = 'UNAME',
    guardLevel = 3,
    time = Date.now(),
  }) {
    const record = { key, message, userName, guardLevel, time }
    this.setState({
      list: [
        record,
        ...this.state.list.slice(0, 9),
      ],
      lastActiveTime: Date.now(),
    })

    this.readQueue.push(record)
    this.triggerSpeech()
  }

  triggerSpeech() {
    if (this.refSpeakBtn.current)
      this.refSpeakBtn.current.click()
  }

  updateVoiceList() {
    if (!window.speechSynthesis) {
      this.setState({
        voices: [],
        voicesLoaded: true,
        activeVoice: '_empty'
      })
      return
    }

    const acceptableLanguages = new Set([
      ...navigator.languages,
      'zh-CN', 'zh-TW',' zh-HK', 'en'    // Always include primary languages
    ])

    const shortlist = window.speechSynthesis.getVoices().filter(
      voice => acceptableLanguages.has(voice.lang) || voice.default
    )

    const sortCompare = (a, b) => {
      const priority = {
        'zh-CN': 12,
        'zh-HK': 11,
        'zh-TW': 10,
        'en': 1,
      }

      let scoreA = (a.default ? 1<<8 : 0) + (priority[a.lang] || 0)
      let scoreB = (b.default ? 1<<8 : 0) + (priority[b.lang] || 0)

      return scoreB - scoreA    // Higher score gives lower index
    }

    this.setState({
      voices: shortlist.sort(sortCompare),
      voicesLoaded: true,
      activeVoice: shortlist[0].voiceURI
    })
  }

  handleVoiceSelect(ev) {
    this.setState({ activeVoice: ev.target.value })
  }

  handleStartButtonClick(ev) {
    if (ev && ev.isTrusted) {
      // User triggered event, we should have user activation now.
      // Inject the queue, and speak.
      this.readQueue.unshift({ message: '卟噜卟噜～干杯～', userName: '复读姬', guardLevel: 3, time: Date.now() })
    }

    const record = this.readQueue.shift()
    if (record)
      this.synthesizeAndSpeak(record)
  }

  synthesizeAndSpeak(record) {
    if (!window.speechSynthesis)
      return

    const voice = this.state.voices.find(voice => voice.voiceURI === this.state.activeVoice)
    if (!voice)
      return

    const user = refineUserName(record.userName)
    const message = refineMessageText(record.message)
    const utter = new SpeechSynthesisUtterance(`${user}说：${message}`)
    utter.voice = voice
    utter.volume = this.state.volume
    window.speechSynthesis.speak(utter)
  }

  componentDidMount() {
    if (window.speechSynthesis && window.speechSynthesis.onvoiceschanged !== undefined) {
      // On Chrome, voice list is populated asynchronously. Wait for event.
      window.speechSynthesis.onvoiceschanged = _ => this.updateVoiceList()
    } else {
      this.updateVoiceList()
    }

    renderTimeAgo(this.refTimeago.current, navigator.language)
  }

  componentWillUnmount() {
    cancelTimeAgo(this.refTimeago.current)
  }

  componentDidUpdate(prevProps) {
    if (prevProps.lastActiveTime !== this.state.lastActiveTime) {
      cancelTimeAgo(this.refTimeago.current)
      renderTimeAgo(this.refTimeago.current, navigator.language)
    }
  }

  render() {
    const { list, voices, voicesLoaded, lastActiveTime } = this.state

    return (
      <div className="gift-readback" {...giftReadbackCss}>
        <div className="options">
          <div className="voice-picker">
            <label>
              <span>语音：</span>
              <select
                onChange={ this.handleVoiceSelect.bind(this) }
                disabled={ !voices.length }
                value={ this.state.activeVoice }
              >
                { !voicesLoaded ? <option value="_loading" >[载入中]</option> : null }
                { voicesLoaded && !voices.length ? <option value="_empty" >[无可用语音]</option> : null }
                { voicesLoaded && voices.length ? <option value="_null" >[关]</option> : null }
                { voices.map(voice => <option key={voice.voiceURI} value={voice.voiceURI}>{voice.lang} - { voice.name }</option>) }
              </select>
            </label>
          </div>

          <div className="user-activation-hint">
            {/* Ask user activation to work around iOS Safari restriction */}
            <button ref={ this.refSpeakBtn } onClick={ this.handleStartButtonClick.bind(this) } disabled={voicesLoaded && !voices.length}>开始复读</button>
          </div>
        </div>

        <div className="time">↓ 最新弹幕：<span ref={ this.refTimeago } dateTime={ lastActiveTime }></span></div>
        <ol className="list"> { list.map(record => DanmakuMessage({...record})) } </ol>
      </div>
    )
  }
}

export default DanmakuReadback