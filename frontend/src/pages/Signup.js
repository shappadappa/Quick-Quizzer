import { useState } from "react"
import { Navigate, Link } from "react-router-dom"

import { useAuthContext } from "../hooks/useAuthContext"
import PasswordInput from "../components/PasswordInput"

const Signup = () => {
    const [redirect, setRedirect] = useState(false)
    const [error, setError] = useState(false)
    const [email, setEmail] = useState("")
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [revealedPassword, setRevealedPassword] = useState(false)

    const {dispatch} = useAuthContext()

    const handleSignup = async (e) =>{
        e.preventDefault()

        const res = await fetch("/api/user/signup", {
            method: "POST",
            body: JSON.stringify({email, username, password}),
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
        <form className="login-form" onSubmit={e => handleSignup(e)}>
            {redirect && <Navigate to="/" />}
            {error && <div className="error">{error}</div>}

            <Link to="/login">Already have an account? Log in!</Link>

            <div className="email-container">
                <label htmlFor="email">Email:</label>
                <input required value={email} onChange={e => setEmail(e.target.value)} id="email" type="email" />
            </div>

            <div className="username-container">
                <label htmlFor="username">Username:</label>
                <input required maxlength="32" value={username} onChange={e => setUsername(e.target.value)} id="username" type="text" />
            </div>

            <PasswordInput password={password} changePassword={setPassword} revealedPassword={revealedPassword} setRevealedPassword={setRevealedPassword} />

            <input type="submit" className="login" value="Sign Up" />
        </form>
    )
}
 
export default Signup;