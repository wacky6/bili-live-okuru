import React from 'react'

const UserBadge = ({guardLevel}) => (
    guardLevel === 3 ? <span className="badge guard-3">舰长</span>
  : guardLevel === 2 ? <span className="badge guard-2">提督</span>
  : guardLevel === 1 ? <span className="badge guard-1">总督</span>
  : null
)

export default UserBadge