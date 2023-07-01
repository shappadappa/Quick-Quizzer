/* eslint no-whitespace-before-property: "off" */

import { useEffect, useState } from "react"
import { useParams, Navigate, Link } from "react-router-dom"
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { format, formatDistanceToNow } from "date-fns"

import { useAuthContext } from "../hooks/useAuthContext"
import Modal from "../components/Modal"

const Quiz = () => {
    const {id} = useParams()

    const [isQuizLoading, setIsQuizLoading] = useState(true)
    const [isQuizResponsesLoading, setIsQuizResponsesLoading] = useState(true)
    const [editing, setEditing] = useState(false)
    const [quizDetails, setQuizDetails] = useState({marks: [], wrongAnswers: [[]], questionTypes: [], combinedAnswers: [[]], options: {markedQuiz: null}})
    const [viewerState, setViewerState] = useState("creator")
    const [unsavedChanges, setUnsavedChanges] = useState(false)
    const [error, setError] = useState("")
    const [openedModal, setOpenedModal] = useState(false)
    const [redirect, setRedirect] = useState("")
    const [usernamesById, setUsernamesById] = useState({})
    const [quizResponses, setQuizResponses] = useState([])
    const [averageMark, setAverageMark] = useState(0)

    const [isOwner, setIsOwner] = useState()

    const {user} = useAuthContext()

    const handleEditBtnClick = () =>{
        if(!editing){
            setEditing(true)
        } else{
            setEditing(false)
        }

        setViewerState("creator")
    }

    const handleQuizDelete = async() =>{
        const res = await fetch(`/api/quiz/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${user.token}`
            }
        })

        const json = await res.json()

        if(res.ok){
            setRedirect("/")
        } else{
            setError(json.error)
        }
    }

    const handleQuestionDelete = (e, index) =>{
        e.preventDefault()
        setUnsavedChanges(true)
        
        let newQuizDetails = {...quizDetails}
        for(const quizDetail in newQuizDetails){
            if(Array.isArray(newQuizDetails [quizDetail]) && newQuizDetails [quizDetail].length > 0){
                newQuizDetails [quizDetail] = newQuizDetails [quizDetail].filter((_, detailIndex) => detailIndex !== index)
            }
        }

        setQuizDetails(newQuizDetails)
    }

    const handleQuizResDelete = async(index) =>{
        const res = await fetch(`/api/quizresponse/${quizResponses [index]._id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${user.token}`
            }
        })

        const json = await res.json()

        if(res.ok){
            let newQuizResponses = [...quizResponses]
            newQuizResponses.splice(index, 1)
            setQuizResponses(newQuizResponses)
        } else{
            setError(json.error)
        }
    }

    const handleSave = async() =>{
        // trimming all string attributes within array
        let quiz = {}

        for(const quizDetail in quizDetails){
            if(typeof quizDetails [quizDetail] === "string"){
                quiz [quizDetail] = quizDetails [quizDetail].trim()
            } else if(Array.isArray(quizDetails [quizDetail])){
                if(typeof quizDetails [quizDetail] [0] === "string"){
                    quiz [quizDetail] = []
                    
                    for(const element of quizDetails [quizDetail]){
                        quiz [quizDetail].push(element.trim())
                    }
                } else if(quizDetail === "wrongAnswers"){
                    quiz.wrongAnswers = []

                    for(let i = 0; i < quizDetails.wrongAnswers.length; i++){
                        quiz.wrongAnswers [i] = []
                        for(let z = 0; z < quizDetails.wrongAnswers [i].length; z++){
                            quiz.wrongAnswers [i].push(quizDetails.wrongAnswers[i] [z].trim())
                        }
                    }
                } else{
                    quiz [quizDetail] = quizDetails [quizDetail]
                }
            } else{
                quiz [quizDetail] = quizDetails [quizDetail]
            }
        }

        if(quiz.options.timed){
            quiz.options.maxTime = quiz.time.hours * 3600 + quiz.time.minutes * 60 + parseInt(quiz.time.seconds)
        }

        const res = await fetch(`/api/quiz/${id}`, {
            method: "PATCH",
            body: JSON.stringify(quiz),
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${user.token}`
            }
        })

        const json = await res.json()

        if(res.ok){
            alert("The changes were saved successfully")
            setUnsavedChanges(false)
            setQuizDetails(quiz)
            setError("")
        } else{
            setError(json.error)
        }
    }

    const changeOuterAttribute = (attribute, newValue) =>{
        let newQuizDetails = {...quizDetails}
        newQuizDetails [attribute] = newValue
        setQuizDetails(newQuizDetails)
        setUnsavedChanges(true)
        setError("")
    }

    const changeInnerAttribute = (attribute, newValue, index) =>{
        let newQuizDetails = {...quizDetails}
        newQuizDetails [attribute] [index] = newValue
        setQuizDetails(newQuizDetails)
        setUnsavedChanges(true)
        setError("")
    }

    const changeOption = (option, newValue) =>{
        let newQuizDetails = {...quizDetails}

        if(option === "markedQuiz" && !newValue){
            delete newQuizDetails.marks
            delete newQuizDetails.marksTotal
            delete newQuizDetails.passMark
            delete newQuizDetails.passMessage
            delete newQuizDetails.failMessage
        } else if(option === "markedQuiz" && newValue){
            newQuizDetails.marks = newQuizDetails.answers.map(answer => 0)
        } else if(option === "timed" && !newValue){
            delete newQuizDetails.options.maxTime
            delete newQuizDetails.time
        } else if(option === "timed" && newValue){
            newQuizDetails.options.maxTime = 0
            newQuizDetails.time = {}
            newQuizDetails.time.hours = 0
            newQuizDetails.time.minutes = 0
            newQuizDetails.time.seconds = 0
        }

        newQuizDetails.options [option] = newValue
        setQuizDetails(newQuizDetails)
        setUnsavedChanges(true)
        setError("")
    }

    const changeTime = (timeAttribute, newValue) =>{
        let newQuizDetails = {...quizDetails}
        newQuizDetails.time [timeAttribute] = newValue
        setQuizDetails(newQuizDetails)
        setUnsavedChanges(true)
    }

    const switchTwoQuestions = (switchingWithAbove, index) =>{
        let indexOffset = 1, newQuizDetails = {...quizDetails}
        setUnsavedChanges(true)

        if(switchingWithAbove){
            indexOffset = -1
        }

        const switchFunc = array =>{
            let arrayCopy = [...array]
            let elementCopy = array [index + indexOffset]
            arrayCopy.splice(index + indexOffset, 1, array [index])
            arrayCopy.splice(index, 1, elementCopy)
            return arrayCopy
        }

        for(const quizDetail in newQuizDetails){
            if(Array.isArray(newQuizDetails [quizDetail]) && newQuizDetails [quizDetail].length > 0){
                newQuizDetails [quizDetail] = switchFunc(newQuizDetails [quizDetail])
            }
        }

        setQuizDetails(newQuizDetails)
    }

    useEffect(() =>{
        const fetchQuiz = async() => {
            const res = await fetch(`/api/quiz/${id}`, {
                headers: {
                    "Authorization": `Bearer ${user.token}`
                }
            })

            const json = await res.json()

            if(res.ok){
                if(json.quiz.options.timed){
                    json.quiz.time = {}
                    json.quiz.time.hours = Math.floor(json.quiz.options.maxTime / 3600 % 60)
                    json.quiz.time.minutes = Math.floor(json.quiz.options.maxTime / 60 % 60)
                    json.quiz.time.seconds = Math.floor(json.quiz.options.maxTime % 60)
                }

                fetchQuizResponses()
                setQuizDetails(json.quiz)
                setIsOwner(json.isOwner)
                setIsQuizLoading(false)
            } else{
                setError(json.error)
            }
        }

        const getUsernamesById = async(quizResponses) =>{
            let newUsernamesById = {...usernamesById}
    
            for(const response of quizResponses){
                if(!Object.keys(newUsernamesById).includes(response.userId)){
                    const res = await fetch(`/api/user/${response.userId}`)
        
                    const json = await res.json()
    
                    newUsernamesById [response.userId] = json.username
                }
            }
    
            setUsernamesById(newUsernamesById)
            setIsQuizResponsesLoading(false)
        }

        const fetchQuizResponses = async() =>{
            const res = await fetch(`/api/quizresponse/${id}`, {
                headers: {
                    "Authorization": `Bearer ${user.token}`,
                    "GetByQuizId": true
                }
            })

            const json = await res.json()

            if(res.ok){
                if(json.length > 0 && json [0].mark){
                    let sum = 0

                    for(const quizResponse of json){
                        sum += quizResponse.mark
                    }

                    setAverageMark(Math.floor(sum / json.length * 100) / 100)
                }
                setQuizResponses(json)
                getUsernamesById(json)
            } else{
                setError(json.error)
            }
        }

        fetchQuiz()
    }, [])

    useEffect(() =>{
        let newQuizDetails = {...quizDetails}
        newQuizDetails.combinedAnswers = newQuizDetails.wrongAnswers.map(wrongAnswersCollection => [...wrongAnswersCollection])

        newQuizDetails.questionTypes.forEach((questionType, questionIndex) =>{
            if(questionType === "multiple-choice"){
                // placing the correct answer in a random index among the wrong answers
                const randomIndex = Math.floor(Math.random() * (newQuizDetails.wrongAnswers [questionIndex].length + 1))
                newQuizDetails.combinedAnswers [questionIndex].splice(randomIndex, 0, newQuizDetails.answers [questionIndex])
            }
        })

        let sum = 0
  
        if(newQuizDetails.options.markedQuiz){
            for(const mark of newQuizDetails.marks){
                sum += mark
            }
    
            newQuizDetails.marksTotal = Math.floor(sum * 10) / 10
        }

        setQuizDetails(newQuizDetails)
    }, [quizDetails.wrongAnswers, JSON.stringify(quizDetails.wrongAnswers), quizDetails.answers, JSON.stringify(quizDetails.answers), quizDetails.marks, JSON.stringify(quizDetails.marks)])
    


    return (
        <section className={editing ? "editing" : ""}>
            {redirect && <Navigate to={`${redirect}`} />}
            
            {error && <div className="error">{error}</div>}

            {openedModal && <Modal confirmFunction={handleQuizDelete} closeFunction={setOpenedModal} modalMsg="Are you sure you would like to delete the quiz? (this action is permanent!" buttonMsg="Delete Quiz" />}
            
            {!isQuizLoading && isOwner &&
            <>
                <div className="modify-btns">
                    <button onClick={() => handleEditBtnClick()} className="edit">
                        {!editing ?
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
                            </svg>
                        :
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M3 14.5A1.5 1.5 0 0 1 1.5 13V3A1.5 1.5 0 0 1 3 1.5h8a.5.5 0 0 1 0 1H3a.5.5 0 0 0-.5.5v10a.5.5 0 0 0 .5.5h10a.5.5 0 0 0 .5-.5V8a.5.5 0 0 1 1 0v5a1.5 1.5 0 0 1-1.5 1.5H3z"/>
                                <path d="m8.354 10.354 7-7a.5.5 0 0 0-.708-.708L8 9.293 5.354 6.646a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0z"/>
                            </svg>
                        }
                    </button>

                    <button onClick={() => setOpenedModal(true)} className="delete">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z"/>
                            <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z"/>
                        </svg>
                    </button>
                </div>

                {!editing ?
                    <h2>{quizDetails.title}</h2>
                : 
                    <input maxLength="32" className="input-title" type="text" value={quizDetails.title} onChange={e => changeOuterAttribute("title", e.target.value)} />
                }
                <p>Created {formatDistanceToNow(new Date(quizDetails.createdAt), {addSuffix: true})}</p>

                <p>Share with others using this code:
                    <span className="quiz-code"> {quizDetails._id}
                        <CopyToClipboard text={quizDetails._id}>
                            <button className="copy-to-clipboard">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                                    <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                                </svg>
                            </button>
                        </CopyToClipboard>
                    </span>
                </p>

                <div className={`viewer ${viewerState}`}>
                    {!editing && 
                        <div className="selector view">
                            <input checked={viewerState === "creator"} type="radio" name="view-selecter" id="creator-view" value="creator" onChange={() => setViewerState("creator")}/>
                            <label htmlFor="creator-view">Creator View</label>

                            <input checked={viewerState === "student"} type="radio" name="view-selecter" id="student-view" value="student" onChange={() => setViewerState("student")} />
                            <label htmlFor="student-view">Student View</label>
                        </div>
                    }

                    {editing &&
                        <>
                            <button disabled={!unsavedChanges} onClick={() => handleSave()} className={`save ${!unsavedChanges ? "disabled" : ""}`}>Save Changes</button>
                            <div className="selector marked">
                                <input checked={quizDetails.options.markedQuiz} type="radio" name="marked-quiz-selector" id="marked" value="marked" onChange={e => changeOption("markedQuiz", true)}/>
                                <label htmlFor="marked">Marked Quiz</label>

                                <input checked={!quizDetails.options.markedQuiz} type="radio" name="marked-quiz-selector" id="unmarked" value="unmarked" onChange={e => changeOption("markedQuiz", false)}/>
                                <label htmlFor="unmarked">Unmarked Quiz</label>
                            </div>
                        </>
                    }

                    {quizDetails.options.markedQuiz && <b>Total marks: {quizDetails.marksTotal}</b>}

                    <div className="questions-container">
                        {quizDetails.questions.length === 0 && <b>No questions added to quiz</b>}

                        {quizDetails.questions.length > 0 && quizDetails.questions.map((_question, questionIndex) =>(
                            <div className="question-container" key={questionIndex}>
                                {editing && 
                                    <div className="arrows">
                                        {questionIndex !== 0 &&
                                            <button className="arrow up" onClick={() => switchTwoQuestions(true, questionIndex)}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                    <path fillRule="evenodd" d="M8 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L7.5 2.707V14.5a.5.5 0 0 0 .5.5z"/>
                                                </svg>
                                            </button>
                                        }
                                        {questionIndex !== quizDetails.questions.length - 1 &&
                                            <button className="arrow down" onClick={() => switchTwoQuestions(false, questionIndex)}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                    <path fillRule="evenodd" d="M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5A.5.5 0 0 1 8 1z"/>
                                                </svg>
                                            </button>
                                        }
                                    </div>
                                }

                                <div className="question">
                                    <span>Question {questionIndex + 1}: 
                                        {!editing && <> {quizDetails.questions [questionIndex]}</>}
                                        {editing && <input value={quizDetails.questions [questionIndex]} onChange={e => changeInnerAttribute("questions", e.target.value, questionIndex)}/>}
                                    </span>
                                    {quizDetails.options.markedQuiz &&
                                        <span className="marks">(
                                            {!editing && <>{quizDetails.marks [questionIndex]}</>}
                                            {editing &&
                                                <input type="number" min="0" value={quizDetails.marks [questionIndex]} onInput={e => changeInnerAttribute("marks", Math.abs(Math.floor(e.target.value * 10) / 10), questionIndex)}/>
                                            }
                                            {quizDetails.marks [questionIndex] === 1 ? " mark" : " marks"}
                                        )</span>
                                    }
                                    {editing && 
                                        <div className="additional-question-modifiers">
                                            <select className="question-type-dropdown" value={quizDetails.questionTypes [questionIndex]} onChange={e => {
                                                if(e.target.value === "true-or-false"){
                                                    changeInnerAttribute("answers", "True", questionIndex)
                                                }

                                                changeInnerAttribute("questionTypes", e.target.value, questionIndex)
                                            }}>
                                                <option disabled defaultValue></option>
                                                <option value="true-or-false">True or False</option>
                                                <option value="question-and-answer">Question and Answer</option>
                                                <option value="multiple-choice">Multiple Choice</option>
                                            </select>

                                            <button className="delete" onClick={e => handleQuestionDelete(e, questionIndex)}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z"/>
                                                    <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z"/>
                                                </svg>
                                            </button>
                                        </div>
                                    }
                                </div>

                                {viewerState !== "student" && 
                                <>
                                    <div className="answer">
                                        {quizDetails.questionTypes [questionIndex] && <>
                                            Answer:
                                            {!editing && <b> {quizDetails.answers [questionIndex]}</b>}
                                            {editing && quizDetails.questionTypes [questionIndex] === "true-or-false" &&
                                                <select value={quizDetails.answers [questionIndex]} name={`true-or-false-${questionIndex}`} id={`true-or-false-${questionIndex}`} onChange={e => changeInnerAttribute("answers", e.target.value, questionIndex)}>
                                                    <option value="True">True</option>
                                                    <option value="False">False</option>
                                                </select>
                                            }
                                            {editing && quizDetails.questionTypes [questionIndex] !== "true-or-false" && <input value={quizDetails.answers [questionIndex]} onChange={e => changeInnerAttribute("answers", e.target.value, questionIndex)} />}
                                        </>}
                                        {!quizDetails.questionTypes [questionIndex] && editing && <span>Please select the question type</span>}
                                    </div>

                                    {quizDetails.questionTypes[questionIndex] === "multiple-choice" && 
                                        <div className="wrong-answers">
                                            <p>Incorrect answers:</p>
                                            <ul>
                                            {quizDetails.wrongAnswers [questionIndex].map((_element, wrongAnswerIndex) =>(
                                                <li className="wrong-answer" key={wrongAnswerIndex}>
                                                    {!editing && <>{quizDetails.wrongAnswers [questionIndex] [wrongAnswerIndex]}</>}
                                                    {editing && 
                                                    <>
                                                        <input value={quizDetails.wrongAnswers [questionIndex] [wrongAnswerIndex]} onChange={e =>{
                                                            let newQuizDetails = {...quizDetails}
                                                            setUnsavedChanges(true)
                                                            let wrongAnswersCollection = newQuizDetails.wrongAnswers [questionIndex]
                                                            wrongAnswersCollection [wrongAnswerIndex] = e.target.value
                                                            newQuizDetails.wrongAnswers [questionIndex] = wrongAnswersCollection
                                                            setQuizDetails(newQuizDetails)
                                                        }}/>
                                                        <button className="delete-wrong-answer" onClick={() => {
                                                            let newQuizDetails = {...quizDetails}
                                                            setUnsavedChanges(true)
                                                            newQuizDetails.wrongAnswers [questionIndex].splice(wrongAnswerIndex, 1)
                                                            setQuizDetails(newQuizDetails)
                                                        }}>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z"/>
                                                                <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z"/>
                                                            </svg>
                                                        </button>
                                                    </>
                                                    }
                                                </li>
                                            ))}
                                            {editing && 
                                                <button className="add-answer" onClick={() => {
                                                    let newQuizDetails = {...quizDetails}
                                                    setUnsavedChanges(true)
                                                    newQuizDetails.wrongAnswers [questionIndex].push("")
                                                    setQuizDetails(newQuizDetails)
                                                }}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                                                        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                                                    </svg>
                                                    <span>Add Incorrect Answer</span>
                                                </button>
                                                }
                                            </ul>
                                        </div>
                                    }
                                </>}
                                

                                {viewerState === "student" && <>
                                    {quizDetails.questionTypes [questionIndex] === "question-and-answer" && 
                                        <input placeholder="Student answers here" disabled></input>
                                    }
                                    
                                    {quizDetails.questionTypes [questionIndex] === "true-or-false" &&
                                    <>
                                        <div className="true-container">
                                            <input disabled type="radio" name="true-or-false" id="true" />
                                            <label htmlFor="true">True</label>
                                        </div>
                                        <div className="false-container">
                                            <input disabled type="radio" name="true-or-false" id="false" />
                                            <label htmlFor="false">False</label>
                                        </div>
                                    </>
                                    }

                                    {quizDetails.questionTypes [questionIndex] === "multiple-choice" && 
                                    <>
                                        {quizDetails.combinedAnswers [questionIndex].map((answer, combinedAnswerIndex) =>(
                                            <div key={combinedAnswerIndex} className="answer">
                                                <input disabled type="radio" name={`answer ${questionIndex}`} id={`answer ${questionIndex} ${combinedAnswerIndex}`} />
                                                <label htmlFor={`answer ${questionIndex} ${combinedAnswerIndex}`}>{quizDetails.combinedAnswers [questionIndex] [combinedAnswerIndex]}</label>
                                            </div>
                                        ))}
                                    </>
                                    }
                                </>}
                            </div>
                        ))}

                        {editing &&
                            <div className="add-question" onClick={() => {
                                let newQuizDetails = {...quizDetails}
                                setUnsavedChanges(true)
                                
                                for(const quizDetail in newQuizDetails){
                                    if(Array.isArray(newQuizDetails [quizDetail])){
                                        if(quizDetail === "wrongAnswers" || quizDetail === "combinedAnswers"){
                                            newQuizDetails [quizDetail].push([""])
                                        } else if(quizDetail === "marks" && quizDetails.options.markedQuiz){
                                            newQuizDetails.marks.push(0)
                                        } else{
                                            newQuizDetails [quizDetail].push("")
                                        }
                                    }
                                }

                                setQuizDetails(newQuizDetails)
                            }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                                    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                                </svg>
                                <span>Add Question</span>
                            </div>
                        }

                        {viewerState !== "student" &&
                            <ul className="additional-information">
                                <h4>Additional Information about the Quiz:</h4>

                                <li>
                                    {quizDetails.description && !editing &&
                                        <div>
                                            Quiz description:
                                            <div className="description">{quizDetails.description}</div>
                                        </div>
                                    }
                                    {!quizDetails.description && !editing &&
                                        <div>No quiz description</div>
                                    }
                                    {editing &&
                                        <div>
                                            <label htmlFor="description">Quiz description: </label>
                                            <textarea maxLength="200" name="description" id="description" cols="120" rows="3" value={quizDetails.description} onInput={e => changeOuterAttribute("description", e.target.value)}></textarea>
                                        </div>
                                    }
                                </li>

                                <li>
                                    {quizDetails.completionMessage && !editing &&
                                        <div>Completion message: "{quizDetails.completionMessage}"</div>
                                    }
                                    {!quizDetails.completionMessage && !editing &&
                                        <div>No completion message</div>
                                    }
                                    {editing &&
                                        <div>
                                            <label htmlFor="completion-message">Completion message: </label>
                                            <input maxLength="100" value={quizDetails.completionMessage} onChange={e => changeOuterAttribute("completionMessage", e.target.value)} type="text" id="completion-message" name="completion-message"/>
                                        </div>
                                    }
                                </li>
                                
                                {quizDetails.options.markedQuiz &&
                                    <>
                                        <li>
                                            {quizDetails.passMessage && !editing &&
                                                <div>Pass message: "{quizDetails.passMessage}"</div>
                                            }
                                            {!quizDetails.passMessage && !editing &&
                                                <div>No pass message</div>
                                            }
                                            {editing &&
                                                    <div>
                                                        <label htmlFor="pass-message">Pass message: </label>
                                                        <input maxLength="100" value={quizDetails.passMessage} onChange={e => changeOuterAttribute("passMessage", e.target.value)} type="text" id="pass-message" name="pass-message" />
                                                    </div>
                                            }
                                        </li>

                                        <li>
                                            {quizDetails.failMessage && !editing &&
                                                <div>Fail message: "{quizDetails.failMessage}"</div>
                                            }
                                            {!quizDetails.failMessage && !editing &&
                                                <div>No fail message</div>
                                            }
                                            {editing &&
                                                <div>
                                                    <label htmlFor="fail-message">Fail message: </label>
                                                    <input maxLength="100" value={quizDetails.failMessage} onChange={e => changeOuterAttribute("failMessage", e.target.value)} type="text" id="fail-message" name="fail-message" />
                                                </div>
                                            }
                                        </li>
                                    </>
                                }

                                {quizDetails.options.markedQuiz &&
                                    <li className={error.toLowerCase().includes("pass mark") ? "error" : ""}>
                                        {!editing && <div>Pass mark: {quizDetails.passMark}</div>}
                                        {editing &&
                                            <div>
                                                <label htmlFor="pass-mark">Pass mark: </label>
                                                <input value={quizDetails.passMark} onChange={e => changeOuterAttribute("passMark", Math.abs(Math.floor(e.target.value * 10) / 10))} type="number" name="pass-mark" id="pass-mark" />
                                            </div>
                                        }
                                    </li>
                                }

                                <li>
                                    {quizDetails.password && !editing &&
                                        <div>Quiz requires password to begin</div>
                                    }
                                    {!quizDetails.password && !editing &&
                                        <div>Quiz does not require password to begin</div>
                                    }
                                </li>

                                <div className="options">
                                    <li>
                                        {quizDetails.options.public && !editing &&
                                            <div>Quiz is publicly accessible</div>
                                        }
                                        {!quizDetails.options.public && !editing &&
                                            <div>Quiz is not publicly accessible</div>
                                        }
                                        {editing &&
                                            <div>
                                                <input checked={quizDetails.options.public} onChange={() => changeOption("public", !quizDetails.options.public)} type="checkbox" name="public-quiz" id="public-quiz" />
                                                <label htmlFor="public-quiz">Quiz is publicly accessible</label>
                                            </div>
                                        }
                                    </li>

                                    {quizDetails.options.public && 
                                        <li>
                                            {!editing && quizDetails.options.tags.length > 0 &&
                                                <>Quiz tags: {quizDetails.options.tags.map((tag, index) => 
                                                    <span className="tag" key={index}>{tag}</span>
                                                )}</>
                                            }
                                            {!editing && quizDetails.options.tags.length === 0 &&
                                                <>No quiz tags</>
                                            }
                                            {editing && 
                                                <>
                                                    {quizDetails.options.tags.length > 0 ?
                                                        <ul>
                                                            Current quiz tags:
                                                            {quizDetails.options.tags.map((_tag, index) =>(
                                                                <li key={index}>
                                                                    <input value={quizDetails.options.tags [index]} onChange={e => {
                                                                        quizDetails.options.tags.splice(index, 1, e.target.value)
                                                                        changeOption("tags", quizDetails.options.tags)
                                                                    }}/>
                                                                    <button className="delete" onClick={e => {
                                                                        e.preventDefault()
                                                                        changeOption("tags", quizDetails.options.tags.filter((tag, tagIndex) => tagIndex !== index))
                                                                    }}>
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                                                            <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                                                                        </svg>
                                                                    </button>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    :
                                                        <div>No quiz tags added</div>    
                                                    } 

                                                    <button className="add-tag" onClick={() => {
                                                        if(quizDetails.options.tags.length < 10){
                                                            changeOption("tags", [...quizDetails.options.tags, ""])
                                                        } else{
                                                            setError("Up to 10 tags are allowed")
                                                        }
                                                    }}>Add Tag</button>
                                                </>
                                            }
                                        </li>
                                    }

                                    <li>
                                        {quizDetails.options.timed && !editing &&
                                            <div>Quiz has a time limit of 
                                                {quizDetails.time.hours >= 1 ? ` ${quizDetails.time.hours} hour${quizDetails.time.hours == 1 ? "" : "s"}`: ""}
                                                {quizDetails.time.minutes >= 1 ? ` ${quizDetails.time.minutes} minute${quizDetails.time.minutes == 1 ? "" : "s"}`: ""}
                                                {quizDetails.time.seconds >= 1 ? ` ${quizDetails.time.seconds} second${quizDetails.time.seconds == 1 ? "" : "s"}` : ""}
                                            </div>
                                        }
                                        {!quizDetails.options.timed && !editing &&
                                            <div>Quiz is not timed</div>
                                        }
                                        {editing &&
                                            <div>
                                                <input checked={quizDetails.options.timed} onChange={() => changeOption("timed", !quizDetails.options.timed)} type="checkbox" name="timed-quiz" id="timed-quiz" />
                                                <label htmlFor="timed-quiz">Quiz has time limit</label>
                                            </div>
                                        }
                                    </li>

                                    {quizDetails.options.timed && editing &&
                                        <li>
                                            <div>
                                                <label>Quiz time limit (hours, minutes, seconds):</label>
                                                
                                                <select value={quizDetails.time.hours} onChange={e => changeTime("hours", e.target.value)}>
                                                    {Array.from(Array(24)).map((_element, index) =>(
                                                        <option key={index}>{index}</option>
                                                    ))}
                                                </select>

                                                <select value={quizDetails.time.minutes} onChange={e => changeTime("minutes", e.target.value)}>
                                                    {Array.from(Array(60)).map((_element, index) =>(
                                                        <option key={index}>{index}</option>
                                                    ))}
                                                </select>

                                                <select value={quizDetails.time.seconds} onChange={e => changeTime("seconds", e.target.value)}>
                                                    {Array.from(Array(60)).map((_element, index) =>(
                                                        <option key={index}>{index}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </li>
                                    }
                                </div>
                            </ul>
                        }

                        {viewerState !== "student" && !editing && !isQuizResponsesLoading && 
                            <ul className="statistics">
                                <h4>Statistics about the Quiz:</h4>

                                {quizResponses.length > 0 ? 
                                    <>
                                        <li>{quizResponses.length} quiz response{quizResponses.length !== 1 ? "s" : ""}:
                                        <ul className="quiz-responses">
                                            {quizResponses.map((quizResponse, quizResponseIndex) =>(
                                                <li key={quizResponse._id}>
                                                    <span>{`${format(new Date(quizResponse.createdAt), ["dd/MM/yyyy"])} at ${format(new Date(quizResponse.createdAt), ["HH:mm:ss"])}`} by <Link to={`/profile/${quizResponse.userId}`}>{usernamesById [quizResponse.userId]}</Link></span>
                                                    <span> in
                                                        {(Math.floor(quizResponse.timeTaken / 3600) % 60) > 0 ? ` ${Math.floor(quizResponse.timeTaken / 3600) % 60} hour${Math.floor(quizResponse.timeTaken / 3600) % 60 === 1 ? "" : "s"}` : ""} 
                                                        {(Math.floor(quizResponse.timeTaken / 60 % 60)) > 0 ? ` ${Math.floor(quizResponse.timeTaken / 60 % 60)} minute${Math.floor(quizResponse.timeTaken / 60) % 60 === 1 ? "" : "s"}`: ""} 
                                                        {(Math.floor(quizResponse.timeTaken % 60)) > 0 ? ` ${quizResponse.timeTaken % 60} second${Math.floor(quizResponse.timeTaken % 60) === 1 ? "" : "s"}` : ""}
                                                    </span>
                                                    {quizResponse.mark !== undefined && <span> - {quizResponse.mark} {quizResponse.mark === 1 ? "mark" : "marks"}</span>}
                                                
                                                    <button title="Delete Response" onClick={() => handleQuizResDelete(quizResponseIndex)} className="delete-quiz-response">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z"/>
                                                            <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z"/>
                                                        </svg>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                        </li>
                                    </>
                                :
                                    <li>No quiz responses</li>
                            }

                                {quizDetails.options.markedQuiz && <li>Average mark: {averageMark}</li>}
                                
                            </ul>
                        }
                    </div>
                </div>
            </>
            }

            {!isQuizLoading && !isOwner &&
                <Navigate to={`/takequiz/${quizDetails._id}`} />
            }
        </section>
    );
}
 
export default Quiz;