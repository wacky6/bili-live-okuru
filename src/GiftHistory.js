import React, { Component } from 'react';
import { css } from 'glamor'
import { render as renderTimeAgo, cancel as cancelTimeAgo } from 'timeago.js'
import UserBadge from './UserBadge'
import "./checkbox.css"
import "./button.css"

const giftRecordCss = css({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'flex-start',
  padding: '.25em 1ch',
  maxWidth: 480,
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
    wordBreak: 'keep-all',
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
  constructor(props) {
    super(props)
    this.refTimeago = React.createRef()
  }
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
          <UserBadge guardLevel={guard} />
        </div>
        <div className="time" ref={this.refTimeago} dateTime={time}></div>
      </div>
    )
  }

  componentDidMount() {
    renderTimeAgo(this.refTimeago.current, navigator.language)
  }

  componentWillUnmount() {
    cancelTimeAgo(this.refTimeago.current)
  }

  componentDidUpdate(prevProps) {
    if (prevProps.time !== this.props.time) {
      cancelTimeAgo(this.refTimeago.current)
      renderTimeAgo(this.refTimeago.current, navigator.language)
    }
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
      <div className="gift-history" style={{maxWidth: 480}}>
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