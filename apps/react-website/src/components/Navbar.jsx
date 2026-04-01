import { NavLink } from 'react-router-dom';
import logo from '../assets/logo.png';

const Navbar = ( { user, setUser} ) => {
  const linkClass = ({ isActive }) =>
    isActive
      ? 'bg-black text-white hover:bg-gray-900 hover:text-white rounded-md px-3 py-2'
      : 'text-white hover:bg-gray-900 hover:text-white rounded-md px-3 py-2';

    const handleLogout = async () => {
      try{
        await fetch("https://smart-escrow-base-testing.onrender.com/auth/logout", {
          method: "POST",
          credentials: "include"
        });
        setUser(null);
      }
      catch (err) {
        console.error("Logout failed", err);
      }
    };

  return (
    <nav className='bg-[#060010]/80 backdrop-blur-md border-b border-indigo-500/30 sticky top-0 z-50'>
      <div className='mx-auto max-w-7xl px-2 sm:px-6 lg:px-8'>
        <div className='flex h-20 items-center justify-between'>
          <div className='flex flex-1 items-center justify-center md:items-stretch md:justify-start'>
            <NavLink className='flex flex-shrink-0 items-center mr-4' to='/'>
              <img className='h-10 w-auto' src={logo} alt='React Jobs' />
              <span className='hidden md:block text-white text-2xl font-bold ml-2'>
                SettleSmart
              </span>
            </NavLink>
            <div className='md:ml-auto'>
              <div className='flex space-x-2'>
                <NavLink to='/' className={linkClass}>
                    Home
                </NavLink>
                <NavLink to='/about' className={linkClass}>
                    About Us
                </NavLink>

                {user && (
                  <NavLink to='/jobs' className={linkClass}>
                      Jobs
                  </NavLink>
                )}
                <NavLink to='/contractors' className ={linkClass}>
                    Contractors 
                </NavLink>
                {user ? (
                  <div className ="flex items-center ml-4 space-x-4">
                    <NavLink to='/profile' className={linkClass}>
                      Profile
                    </NavLink>
                    <button onClick={handleLogout} className="text-white hover:text-red-300 transition-colors text-sm font-semibold">
                      Logout
                    </button>
                  </div>
                ) : (
                  <NavLink to='/login' className={linkClass}>
                    Login/Register
                  </NavLink>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
export default Navbar;