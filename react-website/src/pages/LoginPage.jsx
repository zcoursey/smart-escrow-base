import {useState} from 'react'


const LoginPage = () => {
    const [username, setUsername] = useState('')
    const [password,setPassword] = useState('')

    const submitForm =(e) => {
        e.preventDefault()

        console.log(username)
    }



  return (
    <section className="bg-indigo-50">
      <div className="container m-auto max-w-2xl py-24">
        <div
          className="bg-white px-6 py-8 mb-4 shadow-md rounded-md border m-4 md:m-0"
        >
            <form onSubmit={submitForm}>
                <h2 className="text-3xl text-center font-semibold mb-6">Login/Register</h2>

                <div>
                    <label
                        htmlFor='username'
                        className='block text-gray-700 font-bold mb-2'
                    >
                        Email Address
                    </label>
                    <input
                        type= 'email'
                        id= 'username'
                        name = 'username'
                        className='border rounded w-full py-2 px-3'
                        placeholder='Enter your Email Address'
                        value ={username}
                        onChange={(e) => setUsername(e.target.value)}
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
                        type= 'text'
                        id= 'password'
                        name = 'password'
                        className='border rounded w-full py-2 px-3'
                        placeholder='Enter your Password'
                        value ={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <div>
                    <button
                        className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-full w-full focus:outline-none focus:shadow-outline"
                        type="submit"
                    >
                        Login
                    </button>
                </div>
            </form>
        </div>
      </div>
    </section>
  )
}

export default LoginPage