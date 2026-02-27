import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'

const MainLayout = ( {connectWallet, signerAddress} ) => {
  return (
    <>
        < Navbar connectWallet={connectWallet} signerAddress={signerAddress}/>
        < Outlet />
    </>
  )
}

export default MainLayout;