import { useEffect, useState } from "react";
import { useAuthContext } from "../hooks/useAuthContext";
import { Link, Navigate } from "react-router-dom";

import QuizDetails from "../components/QuizDetails";
import PasswordInput from "../components/PasswordInput";

const Dashboard = () => {
    const [privateQuizzes, setPrivateQuizzes] = useState([])
    const [publicQuizzes, setPublicQuizzes] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [code, setCode] = useState("")
    const [password, setPassword] = useState("")
    const [searchedQuiz, setSearchedQuiz] = useState()
    const [isOwner, setIsOwner] = useState(false)
    const [redirect, setRedirect] = useState(false)
    const [error, setError] = useState("")

    const {user} = useAuthContext()

    useEffect(() =>{
        const fetchQuizzes = async() =>{
            const res = await fetch("/api/quiz", {
                headers: {
                    "Authorization": `Bearer ${user.token}`
                }
            })

            const json = await res.json()
            
            if(res.ok){
                setIsLoading(false)
                setPrivateQuizzes(json.privateQuizzes)
                setPublicQuizzes(json.publicQuizzes)
            } else{
                setError(json.error)
            }
        }

        fetchQuizzes()
    }, [])

    const fetchQuiz = async() =>{
        setError("")
        setPassword("")

        const res = await fetch(`/api/quiz/${code}`, {
            headers: {
                "Authorization": `Bearer ${user.token}`,
                "Password": password
            }
        })

        const json = await res.json()

        if(res.ok){
            setSearchedQuiz(json.quiz)
            setIsOwner(json.isOwner)
            setRedirect(true)
        } else{
            setError(json.error)
        }
    }

    return (
        <main className="dashboard">
            {error && <div className="error">{error}</div>}

            {redirect && isOwner && <Navigate to={`/quiz/${searchedQuiz._id}`} />}

            {!isLoading &&
                <>
                    <h1>{user.user.username}'s Quick Quizzer</h1>

                    <form className="enter-code" onSubmit={e =>{
                        e.preventDefault()
                        fetchQuiz()
                    }}>
                        <label htmlFor="quiz-code">Search a quiz by its code: </label>
                        <input value={code} name="quiz-code" id="quiz-code" onChange={e => setCode(e.target.value)} />
                        {error.includes("password") && 
                            <PasswordInput password={password} changePassword={setPassword} />
                        }

                        <button type="submit">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                            </svg>
                        </button>
                    </form>

                    {!isOwner && searchedQuiz &&
                        <div className="searched-quiz">
                            <QuizDetails quiz={{...searchedQuiz, public: true}} />
                        </div>
                    }

                    {privateQuizzes.length > 0 ?
                        <>
                            <h2>My Quizzes:</h2>
                            <div className="quizzes">
                                {privateQuizzes?.map(quiz => (
                                    <QuizDetails key={quiz._id} quiz={quiz} />
                                ))}
                                </div>
                        </>
                    : 
                        <h2>No Quizzes Created. Create one <Link to="/add">here</Link></h2>
                    }

                    <div className="public-quizzes-container">
                        <h2>Public Quizzes:</h2>
                        <div className="quizzes public">
                            {publicQuizzes?.map(quiz => (
                                <QuizDetails key={quiz._id} quiz={{...quiz, public: true}} />
                            ))}
                        </div>
                    </div>
                </>
            }
        </main>
    );
}
 
export default Dashboard;