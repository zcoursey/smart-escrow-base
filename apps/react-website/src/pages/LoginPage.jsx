import {useState} from 'react'
import {useNavigate} from 'react-router-dom'


const LoginPage = ({setUser}) => {
    const [username, setUsername] = useState('');
    const [password,setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    const submitForm = async (e) => {
        e.preventDefault()
        setError('')
        setIsLoading(true);

        const endpoint = isRegistering
            ? "https://smart-escrow-base-testing.onrender.com/auth/register"
            : "https://smart-escrow-base-testing.onrender.com/auth/login";

        try {
            const response = await fetch (endpoint, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({username, password}),
                credentials: "include",
            });

            const data = await response.json();

            if(!response.ok){
                throw new Error(data.error || "Authentication failed");
            }

            setUser(data.user);
            navigate('/');
        }
        catch (err) {
            setError(err.message);
        }
        finally{
            setIsLoading(false);
        }
    };



  return (
    <section className="bg-indigo-50 min-h-screen">
      <div className="container m-auto max-w-2xl py-24">
        <div
          className="bg-white px-6 py-8 mb-4 shadow-md rounded-md border m-4 md:m-0"
        >
            <form onSubmit={submitForm}>
                <h2 className="text-3xl text-center font-semibold mb-6">
                    {isRegistering ? "Create an Account" : "Welcome Back"}
                </h2>

                {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center">{error}</div>}

                <div>
                    <label
                        htmlFor='username' 
                        className='block text-gray-700 font-bold mb-2'
                    >
                        Username
                    </label>
                    <input
                        type= 'text'
                        id= 'username'
                   
                        className='border rounded w-full py-2 px-3 focus:outline-none focus:border-indigo-500'
                        placeholder= 'Enter your Username'
                        value ={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label
                        htmlFor='password'
                        className='block text-gray-700 font-bold mb-2'
                    >
                        Password
                    </label>
                    <input
                        type= 'password'
                        id= 'password'
                    
                        className='border rounded w-full py-2 px-3'
                        placeholder='Enter your Password'
                        value ={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <button
                        className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-4 rounded-full w-full focus:outline-none focus:shadow-outline transition-colors disabled:opacity-50"
                        type="submit"
                        disabled ={isLoading}
                    >
                        {isLoading ? "Processing..." : (isRegistering ? "Register" : "Login")}
                    </button>
                </div>

                <div className= "mt-4 text-center">
                    <button
                        type="button"
                        onClick={()=> setIsRegistering(!isRegistering)}
                        className= "text-indigor-500 hover:text-indigo-700 font-semibold text-sm"
                        >
                        {isRegistering ? "Already have an account? Login here." : "Don't have an account? Register here."}
                    </button>
                </div>
            </form>
        </div>
      </div>
    </section>
  )
}

export default LoginPage