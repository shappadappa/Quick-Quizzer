import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"

import { useAuthContext } from "../hooks/useAuthContext"
import Modal from "../components/Modal"
import PasswordInput from "../components/PasswordInput"

const AnswerQuiz = () => {
    const {id} = useParams()

    const [quizDetails, setQuizDetails] = useState()
    const [correctAnswers, setCorrectAnswers] = useState([])
    const [ownerUsername, setOwnerUsername] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState("")
    const [startedQuiz, setStartedQuiz] = useState(false)

    const [questionIndex, setQuestionIndex] = useState(0)
    const [submittedAnswers, setSubmittedAnswers] = useState([])
    const [flaggedQuestions, setFlaggedQuestions] = useState([])
    const [correctQuestions, setCorrectQuestions] = useState([])
    const [elapsedTime, setElapsedTime] = useState(0)
    const [finalMark, setFinalMark] = useState(0)
    const [finishedQuiz, setFinishedQuiz] = useState(false)

    const [modalMsg, setModalMsg] = useState("")
    const [openedModal, setOpenedModal] = useState(false)
    const [password, setPassword] = useState("")
    const [passwordCorrect, setPasswordCorrect] = useState(false)

    const {user} = useAuthContext()
    
    const setAnswer = (index, newAnswer) =>{
        let newSubmittedAnswers = [...submittedAnswers]
        newSubmittedAnswers [index] = newAnswer
        setSubmittedAnswers(newSubmittedAnswers)
    }

    const submitAnswers = async() =>{
        setIsLoading(true)
        setStartedQuiz(false)

        let quizResponse = {quizId: id, userId: user.user._id, timeTaken: Math.floor(elapsedTime / 1000)}

        const res = await fetch("/api/quizresponse", {
            method: "POST",
            body: JSON.stringify({...quizResponse, submittedAnswers, password}),
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${user.token}`
            }
        })

        const json = await res.json()

        if(res.ok){
            setOpenedModal(false)
            setFinishedQuiz(true)
            setFinalMark(json.mark)
            setCorrectQuestions(json.correctQuestions)
            setCorrectAnswers(json.correctAnswers)
        } else{
            setError(json.error)
        }

        setIsLoading(false)
    }

    const fetchQuiz = async() => {
        setIsLoading(true)
        setError("")
        
        const quizRes = await fetch(`/api/quiz/${id}`, {
            headers: {
                "Authorization": `Bearer ${user.token}`,
                "Password": password
            }
        })

        const quizJson = await quizRes.json()

        if(quizRes.ok){
            if(quizJson.quiz.options.timed){
                quizJson.quiz.time = {}
                quizJson.quiz.time.hours = Math.floor(quizJson.quiz.options.maxTime / 3600 % 60)
                quizJson.quiz.time.minutes = Math.floor(quizJson.quiz.options.maxTime / 60 % 60)
                quizJson.quiz.time.seconds = Math.floor(quizJson.quiz.options.maxTime % 60)
            }

            setPasswordCorrect(quizJson.passwordCorrect)

            // getting username from quiz' ownerId
            const userRes = await fetch(`/api/user/${quizJson.quiz.ownerId}`)

            const userJson = await userRes.json()

            if(userRes.ok){
                setOwnerUsername(userJson.username)
            } else{
                setError(userJson.error)
            }

            if(quizJson.quiz.questions){
                setSubmittedAnswers(quizJson.quiz.questions.map(question => "")) // one answer for each question
                setQuizDetails(quizJson.quiz)
            }

            setError("")
        } else{
            setError(quizJson.error)
        }

        setIsLoading(false)
    }

    useEffect(() =>{
        fetchQuiz()
    }, [])

    useEffect(() =>{
        // adapted from https://www.geeksforgeeks.org/create-a-stop-watch-using-reactjs/
        
        let interval = null

        if(startedQuiz){
            interval = setInterval(() =>{
                setElapsedTime(elapsedTime => elapsedTime + 1000)
            }, 1000)
        } else{
            clearInterval(interval)
        }

        return () =>{
            clearInterval(interval)
        }
    }, [startedQuiz])


    useEffect(() => {
        if(!isLoading){
            if(quizDetails.options.timed && elapsedTime / 1000 > quizDetails.options.maxTime){
                setError("Time limit has been reached, answers have been submitted")
                submitAnswers()
            } else if(quizDetails.options.timed && (quizDetails.options.maxTime - elapsedTime / 1000) === 300){
                setError("5 minutes left")
            } else if(quizDetails.options.timed && (quizDetails.options.maxTime - elapsedTime / 1000) === 60){
                setError("1 minute left")
            }
        }
    }, [elapsedTime])
    


    return (
        <div className="answering-quiz">
            {error && <div className={`error ${error.includes("minute") || error.includes("Time") ? "time" : ""}`}>{error}</div>}

            {openedModal && <Modal confirmFunction={submitAnswers} closeFunction={setOpenedModal} modalMsg={modalMsg} buttonMsg="Submit Answers" />}

            {isLoading && !error && <div className="loader"></div>}

            {!isLoading && !passwordCorrect &&
                <form onSubmit={e => {
                    e.preventDefault()
                    fetchQuiz()
                }}>
                    <label>Enter Quiz Password: </label>
                    <PasswordInput password={password} changePassword={setPassword} />
                    <input type="submit" value="Enter" />
                </form>
            }

            {!isLoading && passwordCorrect &&
            <>
                <h2>{quizDetails.title}</h2>
                {quizDetails.description && <p className="description">Quiz Description: {quizDetails.description}</p>}
                <p>Made by <Link to={`/profile/${quizDetails.ownerId}`}>{ownerUsername}</Link></p>

                {quizDetails.options.timed && 
                    <p>Time limit of 
                        {quizDetails.options.maxTime > 3600 ? ` ${quizDetails.time.hours} hour${quizDetails.time.hours === 1 ? "" : "s"}, `: ""}
                        {quizDetails.options.maxTime > 60 ? ` ${quizDetails.time.minutes} minute${quizDetails.time.minutes === 1 ? "" : "s"} and `: ""}
                        {quizDetails.time.seconds} second{quizDetails.time.seconds === 1 ? "" : "s"}
                    </p>
                }

                <div>Elapsed Time: {("" + Math.floor((elapsedTime / 3600000) % 60)).padStart(2, "0")}:{("" + Math.floor((elapsedTime / 60000) % 60)).padStart(2, "0")}:{("" + Math.floor((elapsedTime / 1000) % 60)).padStart(2, "0")}</div>

                {quizDetails.questions.length > 0 && !finishedQuiz &&
                    <>
                        {!startedQuiz ? 
                            <button className="start-quiz" onClick={() => setStartedQuiz(true)}>Start Quiz</button>
                        :
                            <>
                                <div className={`answer-space ${flaggedQuestions.includes(questionIndex) ? "flagged" : ""}`}>
                                    <div className="progress-bar-container">
                                        <div className="flags-container">
                                            {quizDetails.questions.map((question, index) => (
                                                <>{flaggedQuestions.includes(index) ? 
                                                    <div style={{"left": (index + 1) / quizDetails.questions.length * 100 + "%"}} className="flag">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                            <path d="M14.778.085A.5.5 0 0 1 15 .5V8a.5.5 0 0 1-.314.464L14.5 8l.186.464-.003.001-.006.003-.023.009a12.435 12.435 0 0 1-.397.15c-.264.095-.631.223-1.047.35-.816.252-1.879.523-2.71.523-.847 0-1.548-.28-2.158-.525l-.028-.01C7.68 8.71 7.14 8.5 6.5 8.5c-.7 0-1.638.23-2.437.477A19.626 19.626 0 0 0 3 9.342V15.5a.5.5 0 0 1-1 0V.5a.5.5 0 0 1 1 0v.282c.226-.079.496-.17.79-.26C4.606.272 5.67 0 6.5 0c.84 0 1.524.277 2.121.519l.043.018C9.286.788 9.828 1 10.5 1c.7 0 1.638-.23 2.437-.477a19.587 19.587 0 0 0 1.349-.476l.019-.007.004-.002h.001"/>
                                                        </svg>
                                                    </div>
                                                : <div></div>}</>
                                            ))}
                                        </div>
                                        <div className="indicators-container">
                                            {quizDetails.questions.map((question, index) => (
                                                <div key={index} style={{"left": (index + 1) / quizDetails.questions.length * 100 + "%"}} className="indicator" onClick={() => setQuestionIndex(index)} />
                                            ))}
                                        </div>
                                        <div style={{"width": (questionIndex + 1) / quizDetails.questions.length * 100 + "%"}} className="progress-bar"></div>
                                    </div>

                                    <span className="question">Question {questionIndex + 1}. {quizDetails.questions [questionIndex]}</span>

                                    {quizDetails.options.markedQuiz &&
                                        <span className="marks">(
                                            {quizDetails.marks [questionIndex]}
                                            {quizDetails.marks [questionIndex] === 1 ? " mark" : " marks"}
                                        )</span>
                                    }
                                    
                                    <div className="answer-input-container">
                                        {quizDetails.questionTypes [questionIndex] === "question-and-answer" && 
                                            <input value={submittedAnswers [questionIndex]} onChange={e => setAnswer(questionIndex, e.target.value)} placeholder="Answer here"></input>
                                        }

                                        {quizDetails.questionTypes [questionIndex] === "true-or-false" &&
                                            <>
                                                <div className="true-container">
                                                    <input checked={submittedAnswers [questionIndex] === "True"} onChange={() => setAnswer(questionIndex, "True")} type="radio" name={`true-or-false-${questionIndex}`} id="true" />
                                                    <label htmlFor="true">True</label>
                                                </div>

                                                <div className="false-container">
                                                    <input checked={submittedAnswers [questionIndex] === "False"} onChange={() => setAnswer(questionIndex, "False")} type="radio" name={`true-or-false-${questionIndex}`} id="false" />
                                                    <label htmlFor="false">False</label>
                                                </div>
                                            </>
                                        }

                                        {quizDetails.questionTypes [questionIndex] === "multiple-choice" && 
                                            <>
                                                {quizDetails.combinedAnswers [questionIndex].map((answer, combinedAnswerIndex) =>(
                                                    <div key={combinedAnswerIndex} className="answer">
                                                        <input checked={submittedAnswers [questionIndex] === quizDetails.combinedAnswers [questionIndex] [combinedAnswerIndex]} onChange={() => setAnswer(questionIndex, quizDetails.combinedAnswers [questionIndex] [combinedAnswerIndex])} type="radio" name={`answers ${questionIndex}`} id={`answer ${questionIndex} ${combinedAnswerIndex}`} />
                                                        <label htmlFor={`answer ${questionIndex} ${combinedAnswerIndex}`}>{quizDetails.combinedAnswers [questionIndex] [combinedAnswerIndex]}</label>
                                                    </div>
                                                ))}
                                            </>
                                        }
                                    </div>

                                    <div className="question-selector">
                                        {<button disabled={questionIndex === 0} onClick={() => setQuestionIndex(questionIndex - 1)}>Previous Question</button>}
                                        
                                        {!flaggedQuestions.includes(questionIndex) ?
                                            <button className="flagger" onClick={() => setFlaggedQuestions([...flaggedQuestions, questionIndex])}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                    <path d="M14.778.085A.5.5 0 0 1 15 .5V8a.5.5 0 0 1-.314.464L14.5 8l.186.464-.003.001-.006.003-.023.009a12.435 12.435 0 0 1-.397.15c-.264.095-.631.223-1.047.35-.816.252-1.879.523-2.71.523-.847 0-1.548-.28-2.158-.525l-.028-.01C7.68 8.71 7.14 8.5 6.5 8.5c-.7 0-1.638.23-2.437.477A19.626 19.626 0 0 0 3 9.342V15.5a.5.5 0 0 1-1 0V.5a.5.5 0 0 1 1 0v.282c.226-.079.496-.17.79-.26C4.606.272 5.67 0 6.5 0c.84 0 1.524.277 2.121.519l.043.018C9.286.788 9.828 1 10.5 1c.7 0 1.638-.23 2.437-.477a19.587 19.587 0 0 0 1.349-.476l.019-.007.004-.002h.001M14 1.221c-.22.078-.48.167-.766.255-.81.252-1.872.523-2.734.523-.886 0-1.592-.286-2.203-.534l-.008-.003C7.662 1.21 7.139 1 6.5 1c-.669 0-1.606.229-2.415.478A21.294 21.294 0 0 0 3 1.845v6.433c.22-.078.48-.167.766-.255C4.576 7.77 5.638 7.5 6.5 7.5c.847 0 1.548.28 2.158.525l.028.01C9.32 8.29 9.86 8.5 10.5 8.5c.668 0 1.606-.229 2.415-.478A21.317 21.317 0 0 0 14 7.655V1.222z"/>
                                                </svg>
                                            </button>
                                        :
                                            <button className="flagger" onClick={() => {
                                                let newFlaggedQuestions = [...flaggedQuestions]
                                                newFlaggedQuestions.splice(newFlaggedQuestions.indexOf(questionIndex), 1)
                                                setFlaggedQuestions(newFlaggedQuestions)
                                            }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                    <path d="M14.778.085A.5.5 0 0 1 15 .5V8a.5.5 0 0 1-.314.464L14.5 8l.186.464-.003.001-.006.003-.023.009a12.435 12.435 0 0 1-.397.15c-.264.095-.631.223-1.047.35-.816.252-1.879.523-2.71.523-.847 0-1.548-.28-2.158-.525l-.028-.01C7.68 8.71 7.14 8.5 6.5 8.5c-.7 0-1.638.23-2.437.477A19.626 19.626 0 0 0 3 9.342V15.5a.5.5 0 0 1-1 0V.5a.5.5 0 0 1 1 0v.282c.226-.079.496-.17.79-.26C4.606.272 5.67 0 6.5 0c.84 0 1.524.277 2.121.519l.043.018C9.286.788 9.828 1 10.5 1c.7 0 1.638-.23 2.437-.477a19.587 19.587 0 0 0 1.349-.476l.019-.007.004-.002h.001"/>
                                                </svg>
                                            </button>
                                        }
                                        
                                        {<button disabled={questionIndex === quizDetails.questions.length - 1} onClick={() => setQuestionIndex(questionIndex + 1)}>Next Question</button>}
                                    </div>
                                </div>
                                
                                <button className="submit-answers" onClick={() => {
                                    let emptyAnswersIndexes = submittedAnswers.map((answer, index) => index + 1).filter(index => submittedAnswers [index - 1] === "")
                                    
                                    if(emptyAnswersIndexes.length > 0 && flaggedQuestions.length > 0){
                                        setModalMsg(`Are you sure you would still like to submit your answers? 
                                            Question${flaggedQuestions.length !== 1 ? "s" : ""} ${flaggedQuestions.sort().map(flaggedQuestionIndex => ++flaggedQuestionIndex).join(", ")} ${flaggedQuestions.length !== 1 ? "are" : "is"} still flagged and 
                                            question${emptyAnswersIndexes.length !== 1 ? "s" : ""} ${emptyAnswersIndexes.join(", ")} ${emptyAnswersIndexes.length !== 1 ? "have" : "has"} still not been answered
                                        `)
                                        setOpenedModal(true)
                                    } else if(emptyAnswersIndexes.length > 0){
                                        setModalMsg(`Are you sure you would still like to submit your answers? 
                                            Question${emptyAnswersIndexes.length !== 1 ? "s" : ""} ${emptyAnswersIndexes.join(", ")} ${emptyAnswersIndexes.length !== 1 ? "have" : "has"} still not been answered
                                        `)
                                    } else if(flaggedQuestions.length > 0){
                                        setModalMsg(`Are you sure you would still like to submit your answers? 
                                            Question${flaggedQuestions.length !== 1 ? "s" : ""} ${flaggedQuestions.sort().map(flaggedQuestionIndex => ++flaggedQuestionIndex).join(", ")} ${flaggedQuestions.length !== 1 ? "are" : "is"} still flagged
                                        `)
                                    } else{
                                        setModalMsg("Are you sure you would like to submit your answers?")
                                    }

                                    setOpenedModal(true)
                                }}>Submit Answers</button>
                            </>
                        }
                    </>
                }

                {finishedQuiz &&
                    <div className="feedback">
                        {quizDetails.options.markedQuiz && 
                            <>
                                <div>You finished the quiz with a mark of {finalMark} out of {quizDetails.marks.reduce((partialSum, a) => partialSum + a, 0)}</div>
                                <div>The pass mark was {quizDetails.passMark}</div>
                            </>
                        }
                        <b>Quiz response has been recorded</b>

                        {quizDetails.completionMessage && 
                            <div>Message from <Link to={`/profile/${quizDetails.ownerId}`}>{ownerUsername}</Link>: {quizDetails.completionMessage}. {`${finalMark >= quizDetails.passMark ? quizDetails.passMessage : quizDetails.failMessage}`}</div>
                        }
                        
                        {quizDetails.questions.length !== correctQuestions.length &&
                            <>
                                <p>Wrong answers:</p>
                                {quizDetails.questions.map((question, questionIndex) =>(
                                    <>
                                        {!correctQuestions.includes(questionIndex) &&
                                            <div className="wrong-answer-details" key={questionIndex}>
                                                <h4>Question {questionIndex + 1}: {question}</h4>

                                                {submittedAnswers [questionIndex] ? 
                                                    <p>Given answer: {submittedAnswers [questionIndex]}</p>
                                                :
                                                    <p>No given answer</p>
                                                }
                                                
                                                <p>Correct answer: {correctAnswers [questionIndex]}</p>
                                            </div>
                                        }
                                    </>
                                ))}
                            </>
                        }
                        
                        {!quizDetails.options.markedQuiz && quizDetails.questions.length === correctQuestions.length &&
                            <div>Congrats, you answered all questions correct!</div>
                        }
                    </div>
                }
                {quizDetails.questions.length === 0 &&
                    <div>No questions in quiz. Cannot answer quiz</div>
                }
            </>
            }
        </div>
    );
}
 
export default AnswerQuiz;