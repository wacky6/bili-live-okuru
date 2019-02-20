import React, { Component } from 'react';
import { css } from 'glamor'
import { format as formatTimeAgo, register as registerTimeAgo } from 'timeago.js'
import "./checkbox.css"
import "./button.css"

const timeAgoFunc = (number, index, total_sec) => {
  // number: the timeago / timein number;
  // index: the index of array below;
  // total_sec: total seconds between date to be formatted and today's date;
  return [
    ['刚刚', '片刻后'],
    ['刚刚', '片刻后'],
    ['1 分钟前', '1 分钟后'],
    ['%s 分钟前', '%s 分钟后'],
    ['1 小时前', '1 小时后'],
    ['%s 小时前', '%s 小时后'],
    ['1 天前', '1 天后'],
    ['%s 天前', '%s 天后'],
    ['1 周前', '1 周后'],
    ['%s 周前', '%s 周后'],
    ['1 个月前', '1 个月后'],
    ['%s 个月前', '%s 个月后'],
    ['1 年前', '1 年后'],
    ['%s 年前', '%s 年后']
  ][index];
};

registerTimeAgo('custom', timeAgoFunc)

const giftRecordCss = css({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'flex-start',
  padding: '.25em 1ch',
  '> .gift-info': {
    flex: '1 1',
    padding: '.25em 1ch',
  },
  '> .user-info': {
    flex: '1.3 1',
    padding: '.25em 1ch',
  },
  '> .checkbox': {
    width: 40,
    flex: '0 0'
  },
  ' .time': {
    marginTop: '.2em',
    fontSize: '80%',
    color: '#333'
  },
  ' .badge': {
    margin: '0 1ch',
    color: '#777',
    fontSize: '80%',
    verticalAlign: 'middle',
    '::before': {
      content: "["
    },
    '::after': {
      content: "]"
    },
  }
})

const Checkbox = ({
  checked = false,
  onChange = () => null
}) => (
  <span className="checkbox-container">
    <input type="checkbox" checked={checked} onChange={onChange} />
    <span className="checkmark"></span>
  </span>
)

class UserInfo extends Component {
  render() {
    const {
      name,
      guard,
      time
    } = this.props

    return (
      <div className='user-info'>
        <div>
          <span className="name">{name}</span>
          {
              guard === 3 ? <span className="badge guard-3">舰长</span>
            : guard === 2 ? <span className="badge guard-2">提督</span>
            : guard === 1 ? <span className="badge guard-1">总督</span>
            : null
          }
        </div>
        <div className="time">{formatTimeAgo(time, 'custom')}</div>
      </div>
    )
  }

  componentDidMount() {
    this._interval = setInterval(_ => this.forceUpdate(), 60*1000)
  }

  componentWillUnmount() {
    clearInterval(this._interval)
  }
}

const GiftRecord = (props) => {
  const {
    key,
    giftName = 'GIFT',
    // giftId = 0,
    num = 1,
    // coinType = 'gold',
    // cnyCost = 0.1,
    // userId = 0,
    userName = 'UNAME',
    guardLevel = 3,
    time = Date.now(),
    ack = false,
    onAck = () => null,
  } = props

  return (
    <label
      key={key}
      className={`gift-record checkbox-wrap ${ack ? 'ack' : ''}`}
      {...giftRecordCss}
    >
      <div className="gift-info">
        <div className="gift-name">{ giftName }</div>
        <div className="num">× { num }</div>
      </div>
      <UserInfo name={userName} guard={guardLevel} time={time} />
      <Checkbox checked={ack} onChange={ev => onAck(ev.target.checked)} />
    </label>
  )
}

class GiftHistory extends Component {
  render() {
    const list = this.props.list

    const handleChange = (record, ack) => {
      this.props.onAck && this.props.onAck(record, ack)
    }

    const handleClear = () => {
      this.props.onClearButton && this.props.onClearButton()
    }

    return (
      <div className="gift-list">
        { list.map(record => GiftRecord({
            ...record,
            onAck: ack => handleChange(record, ack)
          }))
        }
        <div
          className="no-more"
          style={{
            color: '#333',
            fontSize: '80%',
            margin: '2em auto 2em auto',
            textAlign: 'center'
          }}
        >
          <span style={{padding: '.25em 2ch', borderTop: '1px solid #777'}}>翻到底了...</span>
        </div>

        <button
          className="el-button el-button--small el-button--danger"
          onClick={handleClear}
          style={{
            display: 'block',
            margin: '2em auto',
          }}
        >清空</button>
      </div>
    )
  }
}

export default GiftHistory