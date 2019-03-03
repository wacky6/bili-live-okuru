import React, { Component } from 'react'
import { css } from 'glamor'
import { render as renderTimeAgo, cancel as cancelTimeAgo } from 'timeago.js'
import "./checkbox.css"
import "./button.css"
import UserBadge from './UserBadge'

const giftSummaryCss = css({
  padding: '.25em 2ch',
  '> .primary': {
    fontSize: '133%',
    '> .name': {
      display: 'inline-block',
      width: '10ch'
    },
    '> .sum': {
      margin: '0 1ch',
    }
  }
})

const recentGiftCss = css({
  fontSize: '80%',
  color: '#777',
  margin: '.25em 0',
  whiteSpace: 'nowrap',
  overflowX: 'hidden',
  textOverflow: 'ellipsis',
  '> .time': {
    display: 'inline-block',
    minWidth: '10ch',
    '::after': {
      content: "："
    },
  },
  '> .user-info': {
    color: '#aaa',
    ' .badge': {
      margin: '0 .25ch',
      wordBreak: 'keep-all',
      '::before': {
        content: "["
      },
      '::after': {
        content: "]"
      },
    },
    ':not(:last-child)::after': {
      content: '，',
      color: '#aaa',
    },
    ' .num': {
      color: '#aaa',
      '::before': {
        content: "("
      },
      '::after': {
        content: ")"
      },
    }
  }
})

class RecentGift extends Component {
  constructor(props) {
    super(props)
    this.refTimeago = React.createRef()
  }

  render() {
    const { list } = this.props
    if (!list.length) return null

    const { time } = list[0]

    return (
      <div className="recent-gift" {...recentGiftCss}>
        <span className="time" ref={this.refTimeago} dateTime={time}></span>
        {
          list.slice(0, 5).map(record => (
            <span className="user-info" key={record.key}>
              <span className="name">{record.userName}</span>
              <UserBadge guardLevel={record.guardLevel} />
              <span className="num">×{record.num}</span>
            </span>
          ))
        }
      </div>
    )
  }

  componentDidMount() {
    renderTimeAgo(this.refTimeago.current, 'zh_CN')
  }

  componentWillUnmount() {
    cancelTimeAgo(this.refTimeago.current)
  }

  componentDidUpdate(prevProps) {
    if (prevProps.time !== this.props.time) {
      cancelTimeAgo(this.refTimeago.current)
      renderTimeAgo(this.refTimeago.current, 'zh_CN')
    }
  }
}

const GiftSummaryEntry = (props) => {
  const {
    id,
    name = 'GIFT',
    sum = 1,
    recent = [],
  } = props

  return (
    <div
      key={id}
      className="gift-summary-entry"
      {...giftSummaryCss}
    >
      <div className="primary">
        <span className="name">{name}</span>
        <span className="sum">×<span className="num">{sum}</span></span>
      </div>
      <RecentGift list={recent} />
    </div>
  )
}

class GiftSummary extends Component {
  render() {
    const list = this.props.list

    const handleClear = () => {
      this.props.onClearButton && this.props.onClearButton()
    }

    return (
      <div className="gift-summary" style={{maxWidth: 480}}>
        { list.map(entry => GiftSummaryEntry({
            ...entry,
          }))
        }

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

export default GiftSummary