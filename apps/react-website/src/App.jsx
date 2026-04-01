import {Route, BrowserRouter, Routes} from 'react-router-dom';
import {useState, useEffect} from 'react'
import {ethers} from 'ethers'
import './index.css'

import LoginPage from "./pages/LoginPage"
import HomePage from "./pages/HomePage"
import AddJobsPage from "./pages/AddJobsPage"
import JobsPage from "./pages/JobsPage"
import ProfilePage from "./pages/ProfilePage"
import JobDetailsPage from "./pages/JobDetailsPage"
import ContractorsPage from "./pages/ContractorsPage"
import AboutPage from "./pages/AboutPage"

import MainLayout from './layouts/MainLayout'

const App = () => {

  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [signerAddress, setSignerAddress] = useState("");

  const [user, setUser] = useState(null);
  const API_URL = "https://smart-escrow-base-testing.onrender.com";


  useEffect (() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.ok && data.user) {
          setUser(data.user);
        }
      }
      catch (err) {
        console.error("Not logged in");
      }
    };
    checkAuth();
  }, []);


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
      if (err.code === 4001) {
        // Silently ignore 4001 User rejected the request
        return;
      }
      console.log("Error Connecting Wallet")
      console.error(err);
    }
  };


  

  return (
    <BrowserRouter>
      <Routes>
        <Route path ='/' element={<MainLayout connectWallet={connectWallet} signerAddress={signerAddress} user={user} setUser={setUser} />}>
          <Route index element={<HomePage user={user} />} />
          <Route path="/about" element={<AboutPage user={user}/> } />
          <Route path='/login' element={<LoginPage setUser={setUser} initialIsRegistering={false} />} />
          <Route path='/register' element={<LoginPage setUser={setUser} initialIsRegistering={true} />} />
          <Route path='/profile' element={<ProfilePage user={user} signerAddress={signerAddress} connectWallet={connectWallet} />} />
          <Route path='/contractors' element={<ContractorsPage/>} />
          <Route path='/addjobs' element={<AddJobsPage user={user} />} />
          <Route path='/jobs' element={<JobsPage user={user} />} />
          <Route path='/jobs/:id' element={<JobDetailsPage user={user} />} />

        </Route>

      </Routes>
    </BrowserRouter>
  )




}

export default App


  