import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'

const MainLayout = ( {connectWallet, signerAddress, user, setUser} ) => {
  return (
    <>
        < Navbar connectWallet={connectWallet} signerAddress={signerAddress} user={user} setUser={setUser} />
        < Outlet />
    </>
  )
}

export default MainLayout;