import {Route, createBrowserRouter, createRoutesFromElements, RouterProvider,} from 'react-router-dom';
import {useState, useEffect} from 'react'
import {ethers} from 'ethers'
import './index.css'

import LoginPage from "./pages/LoginPage"
import HomePage from "./pages/HomePage"
import AddJobsPage from "./pages/AddJobsPage"
import JobsPage from "./pages/JobsPage"
import MainLayout from './layouts/MainLayout';

const App = () => {

  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [signerAddress, setSignerAddress] = useState("");

  useEffect(() => {
    if (window.ethereum) {
      setProvider(new ethers.BrowserProvider(window.ethereum))
    }
  }, []);

  const connectWallet = async () => {
    if (!provider) return alert("Wallet not connected. Please install MetaMask")
    try{
        await window.ethereum.request({method:"wallet_requestPermissions", params: [{eth_accounts: {} }] })
        await provider.send ("eth_requestAccounts", [])
        const newSigner = await provider.getSigner()
        setSigner(newSigner)
        setSignerAddress(await newSigner.getAddress())
    }
    catch(err){
      console.log("Error Connecting Wallet")
      console.error(err);
    }
  };


  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path='/' element={<MainLayout connectWallet={connectWallet} signerAddress={signerAddress}/>}>
        <Route index element={<HomePage />} />
        <Route path='/login' element={< LoginPage />} />
        <Route path='/addjobs' element={< AddJobsPage />} />
        <Route path='/jobs' element={< JobsPage />} />
      </Route>
    )
  );



  return <RouterProvider router = {router} />
}

export default App


  