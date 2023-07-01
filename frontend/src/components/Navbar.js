import { useState } from "react";
import { Link } from "react-router-dom";

import { useAuthContext } from "../hooks/useAuthContext";

const Navbar = () => {
    const [opened, setOpened] = useState(false)

    const {user, dispatch} = useAuthContext()

    return (
        <nav className={`${opened ? "opened" : ""}`}>
            <button title={`${!opened ? "Open" : "Close"} menu`} onClick={() => {
                if(!opened){
                    setOpened(true)
                } else{
                    setOpened(false)
                }
            }}><span>V</span></button>

            <ul>
                {!user && <Link to="/login"><li className="login">Login</li></Link>}
                {user &&
                    <>
                        <Link to="/"><li>Home</li></Link>
                        <Link to="/add"><li>Add Quiz</li></Link>
                        <Link to={`/profile/${user.user._id}`}><li className="profile">My Profile</li></Link>
                        <Link onClick={() => {
                            localStorage.removeItem("user")
                            dispatch({type: "LOGOUT"})
                        }}><li className="logout">Logout</li></Link>
                    </>
                }
            </ul>
            
        </nav>
    );
}
 
export default Navbar;