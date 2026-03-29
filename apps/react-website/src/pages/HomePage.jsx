import React from 'react'
import Navbar from '../components/Navbar'
import HomeCards from '../components/HomeCards'

const HomePage = ({user}) => {
  return (
    <>
        < HomeCards user={user}/>
    </>
   
  )
}

export default HomePage

