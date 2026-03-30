import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Waves from '../components/Waves'

const MainLayout = ( {connectWallet, signerAddress, user, setUser} ) => {
  return (
    <>
        <div className="fixed inset-0 -z-10 w-screen h-screen">
          <Waves
            lineColor="#3101f2ff"
            backgroundColor="#000000ff"
            waveSpeedX={0.055}
            waveSpeedY={0.055}
            waveAmpX={55}
            waveAmpY={20}
            friction={0.77}
            tension={0.01}
            maxCursorMove={120}
            xGap={12}
            yGap={26}
          />
        </div>
        < Navbar connectWallet={connectWallet} signerAddress={signerAddress} user={user} setUser={setUser} />
        < Outlet />
    </>
  )
}

export default MainLayout;