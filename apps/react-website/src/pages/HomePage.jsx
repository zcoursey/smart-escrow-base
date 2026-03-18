import React from 'react'
import HomeCards from '../components/HomeCards'
import OwnerOnlineUsers from '../components/OwnerOnlineUsers'

const HomePage = ({ user }) => {
  return (
    <>
      <HomeCards user={user} />
      {user?.role === "owner" && <OwnerOnlineUsers />}
    </>
  )
}

export default HomePage
