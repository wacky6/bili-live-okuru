import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const div = document.createElement('div')

describe('hash -> roomId', () => {
  afterEach(done => {
    ReactDOM.unmountComponentAtNode(div)
    done()
  })

  it('default to null', async () => {
    const app = ReactDOM.render(<App />, div)
    await sleep(1)
    expect(app.state.roomId).toBeNull()
  }, 5)

  // TODO: find out a way to disable websocket
  //       then test for roomId parsing

  afterAll(done => {
    window.location.hash = ''
    done()
  })
})

describe('process danmaku', () => {
  let app
  beforeAll(done => {
    app = ReactDOM.render(<App />, div)
    done()
  })
  afterAll(done => {
    ReactDOM.unmountComponentAtNode(div)
    done()
  })

  it('ignores message danmaku', async () => {
    app.onDanmakuMessage(`{"cmd": "DANMU_MSG", "info":[[0,1,25,14893055,1550586196,1550586171,0,"a983b2ab",0,0,0],"dmk_text",[123,"uname",0,0,0,10000,1,""],[12,"badge", "badge_up",797308,10512625,""],[26,0,5805790,">50000"],["title-170-1", "title-170-1"],0,3,null]}`)
    await sleep(5)
    expect(app.state.giftHistory.length).toEqual(0)
  })

  it('ignores silver coin gift', async () => {
    app.onDanmakuMessage(`{"cmd": "SEND_GIFT", "data":{"giftName": "辣条", "num":1000,"uname": "uname", "face": "", "guard_level":0,"rcost":4100409,"uid":123,"top_list":[],"timestamp":1550591410,"giftId":1,"giftType":0,"action": "喂食", "super":0,"super_gift_num":0,"price":100,"rnd": "1550591410", "newMedal":0,"newTitle":0,"medal":[],"title": "", "beatId": "0", "biz_source": "live", "metadata": "", "remain":0,"gold":0,"silver":0,"eventScore":0,"eventNum":0,"smalltv_msg":[],"specialGift":null,"notice_msg":[],"capsule":null,"addFollow":0,"effect_block":1,"coin_type": "silver", "total_coin":100000,"effect":0,"tag_image": "", "user_count":0}}`)
    await sleep(5)
    expect(app.state.giftHistory.length).toEqual(0)
  })

  it('ignores cheap gold coin gift', async () => {
    app.onDanmakuMessage(`{"cmd": "SEND_GIFT", "data":{"giftName": "么么哒", "num":1,"uname": "uname", "face": "", "guard_level":3,"rcost":4094383,"uid":27497789,"top_list":[],"timestamp":1550496118,"giftId":30090,"giftType":0,"action": "赠送", "super":0,"super_gift_num":2,"price":2000,"rnd": "1886325390", "newMedal":0,"newTitle":0,"medal":[],"title": "", "beatId": "", "biz_source": "live", "metadata": "", "remain":0,"gold":3812,"silver":13313,"eventScore":0,"eventNum":0,"smalltv_msg":[],"specialGift":null,"notice_msg":[],"capsule":null,"addFollow":0,"effect_block":0,"coin_type": "gold", "total_coin":2000,"effect":0,"tag_image": "", "user_count":0}}`)
    await sleep(5)
    expect(app.state.giftHistory.length).toEqual(0)
  })

  it('shows expensive gold coin gift', async () => {
    app.onDanmakuMessage(`{"cmd": "SEND_GIFT", "data":{"giftName": "小电视飞船", "num":1,"uname": "weaky菌", "face": "http://i1.hdslb.com/bfs/face/2d0853c88fa5e24447cf31c9aeec41aa546b4870.gif", "guard_level":3,"rcost":3997915,"uid":1399121,"top_list":[],"timestamp":1549296196,"giftId":25,"giftType":0,"action": "赠送", "super":1,"super_gift_num":1,"price":1245000,"rnd": "1549296057", "newMedal":0,"newTitle":0,"medal":[],"title": "", "beatId": "0", "biz_source": "live", "metadata": "", "remain":0,"gold":101308,"silver":77624,"eventScore":0,"eventNum":0,"smalltv_msg":[{"cmd": "SYS_MSG", "msg": "weaky菌:?送给:?小焦儿w:?1个小电视飞船，点击前往TA的房间去抽奖吧", "msg_text": "weaky菌:?送给:?小焦儿w:?1个小电视飞船，点击前往TA的房间去抽奖吧", "msg_common": "全区广播：<%weaky菌%>送给<%小焦儿w%>1个小电视飞船，点击前往TA的房间去抽奖吧", "msg_self": "全区广播：<%weaky菌%>送给<%小焦儿w%>1个小电视飞船，快来抽奖吧", "rep":1,"styleType":2,"url": "http://live.bilibili.com/709", "roomid":709,"real_roomid":922045,"rnd":1549296057,"broadcast_type":1}],"specialGift":null,"notice_msg":[],"capsule":null,"addFollow":0,"effect_block":0,"coin_type": "gold", "total_coin":1245000,"effect":2,"combo_send":{"uid":1399121,"uname": "weaky菌", "combo_num":1,"gift_id":25,"gift_name": "小电视飞船", "action": "赠送", "combo_id": "gift:combo_id:1399121:25806515:25:1549296196.2923"},"tag_image": "", "user_count":0}}`)
    await sleep(5)
    expect(app.state.giftHistory.length).toEqual(1)
    expect(app.state.giftHistory[0].ack).toBeFalsy()
    expect(app.state.giftHistory[0].cnyCost).toEqual(1245)
  })

  it('shows guard buy', async () => {
    app.onDanmakuMessage(`{"cmd": "GUARD_BUY", "data":{"uid":123,"username": "uname", "guard_level":3,"num":12,"price":198000,"gift_id":10003,"gift_name": "舰长", "start_time":1549809323,"end_time":1549809323}}`)
    await sleep(5)
    expect(app.state.giftHistory.length).toEqual(2)
    expect(app.state.giftHistory[1].ack).toBeFalsy()
    expect(app.state.giftHistory[1].cnyCost).toEqual(198 * 12)
  })

  it('can be ack', async () => {
    app.ackGift(app.state.giftHistory[0], true)
    await sleep(5)
    expect(app.state.giftHistory[0]).toBeTruthy()
  })
})