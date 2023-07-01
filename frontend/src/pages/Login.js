import { useState } from "react"
import { Navigate, Link } from "react-router-dom"

import { useAuthContext } from "../hooks/useAuthContext"
import PasswordInput from "../components/PasswordInput"

const Login = () => {
    const [redirect, setRedirect] = useState(false)
    const [error, setError] = useState(false)
    const [revealedPassword, setRevealedPassword] = useState(false)
    const [emailOrUsername, setEmailOrUsername] = useState("")
    const [password, setPassword] = useState("")

    const {dispatch} = useAuthContext()

    const handleLogin = async (e) =>{
        e.preventDefault()

        const res = await fetch("/api/user/login", {
            method: "POST",
            body: JSON.stringify({emailOrUsername, password}),
            headers: {
                "Content-Type": "application/json"
            }
        })

        const json = await res.json()

        if(res.ok){
            const userData = {user: {
                username: json.user.username,
                email: json.user.email,
                createdAt: json.user.createdAt,
                _id: json.user._id
            },
            token: json.token}

            localStorage.setItem("user", JSON.stringify(userData))

            dispatch({type: "LOGIN", payload: userData})

            setRedirect(true)
        } else{
            setError(json.error)
        }
    }

    return (
        <form className="login-form" onSubmit={e => handleLogin(e)}>
            {redirect && <Navigate to="/" />}
            {error && <div className="error">{error}</div>}
            <Link to="/signup">Don't have an account? Sign up!</Link>

            <div className="email-or-username-container">
                <label htmlFor="email-or-username">Email/Username:</label>
                <input value={emailOrUsername} onChange={e => setEmailOrUsername(e.target.value)} id="email-or-username" type="text" />
            </div>

            <PasswordInput password={password} changePassword={setPassword} revealedPassword={revealedPassword} setRevealedPassword={setRevealedPassword} />

            <input type="submit" className="login" value="Login" />
        </form>
    )
}
 
export default Login;