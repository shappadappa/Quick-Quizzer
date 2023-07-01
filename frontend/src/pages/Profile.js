import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns"
import { useParams } from "react-router-dom";

import { useAuthContext } from "../hooks/useAuthContext";
import Modal from "../components/Modal"
import PasswordInput from "../components/PasswordInput";
import QuizDetails from "../components/QuizDetails"

const Profile = () => {
    const {id} = useParams()
    const {user, dispatch} = useAuthContext()

    const [isLoading, setIsLoading] = useState(true)

    const [userDetails, setUserDetails] = useState()
    const [userQuizzes, setUserQuizzes] = useState([])
    const [error, setError] = useState()
    const [openedModal, setOpenedModal] = useState(false)

    const [editing, setEditing] = useState(false)
    const [changingPassword, setChangingPassword] = useState(false)
    const [oldPassword, setOldPassword] = useState("")
    const [revealedOldPassword, setRevealedOldPassword] = useState(false)
    const [newPassword, setNewPassword] = useState("")
    const [revealedNewPassword, setRevealedNewPassword] = useState(false)
    
    const handleDelete = async() =>{
        const res = await fetch(`/api/user/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${user.token}`
            }
        })

        const json = await res.json()

        if(res.ok){
            dispatch({type: "LOGOUT"})
        } else{
            setError(json.error)
        }
    }

    const handleSave = async(e) =>{
        e.preventDefault()

        let newPasswordCopy

        if(changingPassword){
            newPasswordCopy = newPassword
        } else{
            newPasswordCopy = oldPassword
        }

        const res = await fetch(`/api/user/${userDetails._id}`, {
            method: "PATCH",
            body: JSON.stringify({email: userDetails.email, username: userDetails.username, oldPassword, newPassword: newPasswordCopy}),
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${user.token}`
            }
        })

        const json = await res.json()

        if(res.ok){
            alert("The changes were successfully saved")
            setError("")
        } else{
            setError(json.error)
        }
    }

    const changeDetail = (detail, newValue) =>{
        let newUserDetails = {...userDetails}
        newUserDetails [detail] = newValue
        setUserDetails(newUserDetails)
    }

    useEffect(() =>{
        const fetchUserDetails = async() =>{
            const res = await fetch(`/api/user/${id}`)

            const json = await res.json()

            if(res.ok){
                fetchUserQuizzes()
                setUserDetails(json)
                setError("")
            } else{
                setError(json.error)
            }
        }

        const fetchUserQuizzes = async() =>{
            const res = await fetch(`/api/quiz/${id}`, {
                headers: {
                    "Authorization": `Bearer ${user.token}`,
                    "GetByUserId": true
                }
            })

            const json = await res.json()

            if(res.ok){
                setIsLoading(false)
                setUserQuizzes(json)
            } else{
                setError(json.error)
            }
        }

        fetchUserDetails()
    }, [])

    return (
        <article className="profile">
            {error && <div className="error">{error}</div>}

            {!isLoading &&
                <>
                    {openedModal && <Modal confirmFunction={handleDelete} closeFunction={setOpenedModal} modalMsg="Are you sure you would like to delete your profile? (this action is permanent!)" buttonMsg="Delete Profile" />}

                    <span>User {userDetails._id}</span>

                    <ul className={editing ? "editing" : ""}>
                        <li>
                            <h4>Username:
                                {!editing ? 
                                    <> {userDetails.username}</>
                                :
                                    <input maxlength="32" type="text" value={userDetails.username} onChange={e => changeDetail("username", e.target.value)} />
                                }
                            </h4>
                        </li>
                        <li>
                            Email:
                            {!editing ? 
                                <> {userDetails.email}</>
                            :
                                <input type="email" value={userDetails.email} onChange={e => changeDetail("email", e.target.value)} />
                            }
                        </li>
                        <li>Joined {formatDistanceToNow(new Date(userDetails.createdAt), {addSuffix: true})}</li>
                    </ul>

                    {user.user._id === userDetails._id ?
                        <>
                            <button className="delete-profile" onClick={() => setOpenedModal(true)}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z"/>
                                    <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z"/>
                                </svg>
                            </button>
                            <button onClick={() => setEditing(!editing)} className="edit-profile">Edit Profile</button>

                            {editing &&
                                <>
                                    <div className="password-modifier">
                                        <label htmlFor="change-password">Change Password? </label>
                                        <input type="checkbox" name="change-password" id="change-password" checked={changingPassword} onChange={() => setChangingPassword(!changingPassword)} />

                                        <PasswordInput labelMsg={changingPassword ? "Old Password:" : "Password required to save changes:"} inputId="old-password" password={oldPassword} changePassword={setOldPassword} revealedPassword={revealedOldPassword} setRevealedPassword={setRevealedOldPassword} />
                                        {changingPassword && <PasswordInput labelMsg="New Password:" inputId="new-password" password={newPassword} changePassword={setNewPassword} revealedPassword={revealedNewPassword} setRevealedPassword={setRevealedNewPassword} />}
                                    </div>
                                    <button disabled={oldPassword.length === 0} className="save-changes" onClick={e => handleSave(e)}>Save Changes</button>
                                </>
                            }
                        </>
                    :
                        <ul>
                            {userQuizzes.length > 0 ? 
                                <div className="public-quizzes">
                                    <b>User's public quizzes:</b>
                                    {userQuizzes.map(quiz =>(
                                        <li key={quiz._id}><QuizDetails quiz={quiz} /></li>
                                    ))}
                                </div>
                            :
                                <li>No public quizzes by user</li>
                            }
                        </ul>
                    }
                </>
            }
        </article>
    );
}
 
export default Profile;