import { useState, useEffect } from "react";
import { Navigate  } from "react-router-dom";

import { useAuthContext } from "../hooks/useAuthContext";
import PasswordInput from "../components/PasswordInput";

const AddQuiz = () => {
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [questions, setQuestions] = useState([""])
    const [marks, setMarks] = useState([0])
    const [marksTotal, setMarksTotal] = useState(0)
    const [questionTypes, setQuestionTypes] = useState([""])
    const [answers, setAnswers] = useState([""])
    const [wrongAnswers, setWrongAnswers] = useState([""])
    const [passMark, setPassMark] = useState(0)
    const [completionMessage, setCompletionMessage] = useState("")
    const [passMessage, setPassMessage] = useState("")
    const [failMessage, setFailMessage] = useState("")
    const [password, setPassword] = useState("")
    const [options, setOptions] = useState({
        markedQuiz: false,
        public: false,
        timed: false
    })

    const [newTag, setNewTag] = useState("")
    const [hours, setHours] = useState(0)
    const [minutes, setMinutes] = useState(0)
    const [seconds, setSeconds] = useState(0)

    const [redirect, setRedirect] = useState(false)
    const [error, setError] = useState("")

    const {user} = useAuthContext()

    const addAnswer = (e, index) =>{
        let answersCopy = [...answers]
        answersCopy.splice(index, 1, e.target.value)
        setAnswers(answersCopy)
    }

    const changeOption = (option, newValue) =>{
        let optionsCopy = {...options}
        optionsCopy [option] = newValue

        if(option === "public" && newValue){
            optionsCopy.tags = []
        } else if(option === "public" && !newValue){
            delete optionsCopy.tags
        }

        setOptions(optionsCopy)
    }

    const handleDelete = (e, index) =>{
        e.preventDefault()
        let questionsCopy = [...questions]
        questionsCopy.splice(index, 1)
        setQuestions(questionsCopy)

        let marksCopy =[...marks]
        marksCopy.splice(index, 1)
        setMarks(marksCopy)

        let questionTypesCopy = [...questionTypes]
        questionTypesCopy.splice(index, 1)
        setQuestionTypes(questionTypesCopy)

        let answersCopy = [...answers]
        answersCopy.splice(index, 1)
        setAnswers(answersCopy)

        let wrongAnswersCopy = [...wrongAnswers]
        wrongAnswersCopy.splice(index, 1)
        setWrongAnswers(wrongAnswersCopy)
    }

    const switchTwoQuestions = (e, switchingWithAbove, index) =>{
        e.preventDefault()
        let indexOffset = 1

        if(switchingWithAbove){
            indexOffset = -1
        }

        let questionsCopy = [...questions]
        questionsCopy.splice(index + indexOffset, 1, questionsCopy [index])
        questionsCopy.splice(index, 1, questions [index + indexOffset])
        setQuestions(questionsCopy)

        let marksCopy = [...marks]
        marksCopy.splice(index + indexOffset, 1, marksCopy [index])
        marksCopy.splice(index, 1, marks [index + indexOffset])
        setMarks(marksCopy)

        let questionTypesCopy = [...questionTypes]
        questionTypesCopy.splice(index + indexOffset, 1, questionTypesCopy [index])
        questionTypesCopy.splice(index, 1, questionTypes [index + indexOffset])
        setQuestionTypes(questionTypesCopy)

        let answersCopy = [...answers]
        answersCopy.splice(index + indexOffset, 1, answersCopy [index])
        answersCopy.splice(index, 1, answers [index + indexOffset])
        setAnswers(answersCopy)

        let wrongAnswersCopy = [...wrongAnswers]
        wrongAnswersCopy.splice(index + indexOffset, 1, wrongAnswersCopy [index])
        wrongAnswersCopy.splice(index, 1, wrongAnswers [index + indexOffset])
        setWrongAnswers(wrongAnswersCopy)
    }

    const handleSubmit = async(e) =>{
        e.preventDefault()

        let quiz = {
            title: title.trim(), 
            description: description.trim(),
            questions: questions.map(question => question.trim()), 
            questionTypes,
            answers: answers.map(answer => answer.trim()),
            wrongAnswers: wrongAnswers.map(wrongAnswerCollection => wrongAnswerCollection.split(",").map(wrongAnswer => wrongAnswer.trim())),
            completionMessage: completionMessage.trim(),
            passMessage: passMessage.trim(),
            failMessage: failMessage.trim(),
            password,
            options
        }

        if(options.markedQuiz){
            quiz.marks = marks
            quiz.passMark = passMark
        }

        if(quiz.options.timed){
            quiz.options.maxTime = (hours * 3600) + (minutes * 60) + parseInt(seconds)
        }
        
        const res = await fetch("/api/quiz", {
            method: "POST",
            body: JSON.stringify(quiz),
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${user.token}`
            }
        })

        const json = await res.json()

        if(res.ok){
            setRedirect(true)
        } else{
            setError(json.error)
        }
    }

    useEffect(() => {
      let sum = 0

      for(const mark of marks){
        sum += mark
      }

      setMarksTotal(sum)
    }, [marks])

    return (
        <form className="add-quiz-form" onSubmit={e => { handleSubmit(e) }}>
            {redirect && <Navigate to="/" />}

            <div className="input-title-container">
                <h2>First, let's give your quiz a title:</h2>
                <div className="input-title">
                    <label>Give your quiz a title: </label>
                    <input maxLength="32" type="text" value={title} onChange={e =>{ setTitle(e.target.value)}}required/>
                </div>
            </div>



            <div className="questions-container">
                <h2>Now you can enter the questions for your quiz:</h2>

                <div className="sub-container marks-toggle">
                    <input type="checkbox" onChange={() => changeOption("markedQuiz", !options.markedQuiz)} name="marks-toggle" id="marks-toggle" />
                    <label htmlFor="marks-toggle">Marked Quiz</label>
                </div>

                {questions.map((_element, index) =>(
                    <div className="question" key={index}>
                        <div className="arrows">
                            {index !== 0 &&
                                <button className="arrow up" onClick={e => switchTwoQuestions(e, true, index)}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                        <path fillRule="evenodd" d="M8 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L7.5 2.707V14.5a.5.5 0 0 0 .5.5z"/>
                                    </svg>
                                </button>
                            }
                            {index !== questions.length - 1 &&
                                <button className="arrow down" onClick={e => switchTwoQuestions(e, false, index)}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                        <path fillRule="evenodd" d="M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5A.5.5 0 0 1 8 1z"/>
                                    </svg>
                                </button>
                            }
                        </div>

                        <div className="input-container">
                            <label htmlFor="question-type">Select the question type: </label>
                            <select required value={questionTypes[index]} name="question-types" id="question-type" onChange={e => {
                                let questionTypesCopy = [...questionTypes]
                                questionTypesCopy.splice(index, 1, e.target.value)
                                setQuestionTypes(questionTypesCopy)
                            }}>
                                <option disabled defaultValue></option>
                                <option value="true-or-false">True or False</option>
                                <option value="question-and-answer">Question and Answer</option>
                                <option value="multiple-choice">Multiple Choice</option>
                            </select>
                        </div>

                        {questionTypes [index].length !== 0 && 
                            <>
                            <div className="input-container">
                                <label htmlFor="question">Enter question {index + 1}:</label>
                                <input required maxLength="32" value={questions[index]} type="text" id="question" onChange={e => {
                                    let questionsCopy = [...questions]
                                    questionsCopy.splice(index, 1, e.target.value)
                                    setQuestions(questionsCopy)
                                }} />
                            </div>
                            {options.markedQuiz &&
                                <div className="input-container">
                                    <label htmlFor="mark">Enter the marks for this question:</label>
                                    <input required step=".1" type="number" min="0" value={marks [index]} onInput={e => {
                                        let marksCopy = [...marks]
                                        marksCopy.splice(index, 1, Math.abs(Math.floor(e.target.value * 10) / 10))
                                        setMarks(marksCopy)
                                    }}/>
                                </div>
                            }
                            </>
                        }

                        {questionTypes[index] === "true-or-false" &&
                            <div className="input-container">
                                <label>Is this statement true or false?</label>
                                
                                <select value={answers [index]} onChange={e => addAnswer(e, index)} name={`true-or-false-${index}`} id={`true-or-false-${index}`}>
                                    <option>True</option>
                                    <option>False</option>
                                </select>
                            </div>
                        }
                        
                        {questionTypes[index] === "question-and-answer" &&
                            <div className="input-container">
                                <label htmlFor="answer">Enter the answer to question {index + 1}:</label>
                                <input required maxLength="32" type="text" id="answer" onChange={ e => addAnswer(e, index)} value={answers [index]}/>
                            </div>
                        }
                        
                        {questionTypes[index] === "multiple-choice" &&
                            <>
                            <div className="input-container">
                                <label htmlFor="wrong-answers">Enter all wrong answers (comma seperated):</label>
                                <input required maxLength="256" type="text" id="wrong-answers" onChange={ e => {
                                    let wrongAnswersCopy = [...wrongAnswers]
                                    wrongAnswersCopy.splice(index, 1, e.target.value)
                                    setWrongAnswers(wrongAnswersCopy)
                                }} />
                            </div>

                            <div className="input-container">
                                <label htmlFor="correct-answer">Enter the correct answer separately:</label>
                                <input required maxLength="32" type="text" id="correct-answer" onChange={e => addAnswer(e, index)} value={answers [index]}/>
                            </div>
                            </>
                        }
                    
                        <button className="delete-question" onClick={e => handleDelete(e, index)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                            </svg>
                        </button>
                    </div>
                ))}
            </div>

            <button type="button" className="add-btn" onClick={e => {
                e.preventDefault() 
                setQuestions([...questions, ""])
                setMarks([...marks, 0])
                setQuestionTypes([...questionTypes, ""])
                setAnswers([...answers, ""])
                setWrongAnswers([...wrongAnswers, ""])
            }}>Add new question</button>

            {options.markedQuiz && 
                <div className="marks-total">
                    Total Marks: {marksTotal}
                </div>
            }

            <h2>Additional information about your quiz:</h2>
            <div className="additional-information-container">
                <div className="sub-container description">
                    <label htmlFor="description">Add a description (optional): </label>
                    <textarea maxLength="200" name="description" id="description" cols="120" rows="3" value={description} onInput={e => setDescription(e.target.value)}></textarea>
                </div>

                {options.markedQuiz &&
                    <div className="sub-container pass-mark">
                        <label htmlFor="pass-mark">Pass mark:</label>
                        <input type="number" min="0" id="pass-mark" name="pass-mark" required step=".1" value={passMark} onInput={e => setPassMark(Math.abs(Math.floor(e.target.value * 10) / 10))}/>
                    </div>
                }

                <div className="sub-container completion-msg">
                    <label htmlFor="completion-msg">Add a message for when the quiz is completed (optional):</label>
                    <input maxLength="100" type="text" name="completion-msg" id="pass-msg" value={completionMessage} onChange={e => setCompletionMessage(e.target.value)} />
                </div>

                {options.markedQuiz && 
                    <>
                        <div className="sub-container pass-msg">
                            <label htmlFor="pass-msg">Add a message for those who pass the quiz (optional):</label>
                            <input maxLength="100" type="text" name="pass-msg" id="pass-msg" value={passMessage} onChange={e => setPassMessage(e.target.value)} />
                        </div>

                        <div className="sub-container fail-msg">
                            <label htmlFor="fail-msg">Add a message for those who fail the quiz (optional):</label>
                            <input maxLength="100" type="text" name="fail-msg" id="fail-msg" value={failMessage} onChange={e => setFailMessage(e.target.value)} />
                        </div>
                    </>
                }

                <PasswordInput className="sub-container password" labelMsg="Add a password for other to access the quiz (optional)" password={password} changePassword={setPassword}/>
            </div>

            <h2>Options about the quiz:</h2>
            <div className="options-container">
                <div className="sub-container public-quiz">
                    <input type="checkbox" name="public-quiz" id="public-quiz" onChange={() => changeOption("public", !options.public)}/>
                    <label htmlFor="public-quiz">Quiz is publicly accessible</label>
                </div>

                {options.public && 
                    <div className="sub-container quiz-tags">
                        <label htmlFor="quiz-tag">Enter new tag (these help others find your quiz): </label>
                        <input name="quiz-tag" id="quiz-tag" value={newTag} onChange={e => setNewTag(e.target.value)}/>
                        <input type="submit" onClick={e => {
                            e.preventDefault()

                            if(newTag.trim().length > 0){
                                if(options.tags.length >= 10){
                                    setError("Max 10 tags")
                                } else if(options.tags.includes(newTag)){
                                    setError("Tag already added")
                                } else {
                                    setError("")
                                    changeOption("tags", [...options.tags, newTag.trim()])
                                } 
                            }
                        }} value="+" />

                        {options.tags.length > 0 ?
                            <ul>
                                <h4>Current quiz tags:</h4>
                                {options.tags.map((tag, index) =>(
                                    <li key={index}>
                                        {tag}
                                        <button className="delete" onClick={e => {
                                            e.preventDefault()
                                            changeOption("tags", options.tags.filter((tag, tagIndex) => tagIndex !== index))
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
                            <h4>(No quiz tags added)</h4>    
                        } 
                    </div>
                }

                <div className="sub-container timed-quiz">
                    <input type="checkbox" name="timed-quiz" id="timed-quiz" onChange={() => changeOption("timed", !options.timed)}/>
                    <label htmlFor="timed-quiz">Quiz has time limit</label>
                </div>

                {options.timed &&
                    <div className="sub-container max-time">
                        <label htmlFor="max-time">Quiz time limit (hours, minutes, seconds): </label>
                        <select value={hours} onChange={e => setHours(e.target.value)}>
                            {Array.from(Array(24)).map((_element, index) =>(
                                <option key={index}>{index}</option>
                            ))}
                        </select> hours,

                        <select value={minutes} onChange={e => setMinutes(e.target.value)}>
                            {Array.from(Array(60)).map((_element, index) =>(
                                <option key={index}>{index}</option>
                            ))}
                        </select> minutes,

                        <select value={seconds} onChange={e => setSeconds(e.target.value)}>
                            {Array.from(Array(60)).map((_element, index) =>(
                                <option key={index}>{index}</option>
                            ))}
                        </select> seconds
                    </div>
                }
            </div>

            <div className="submit-container">
                <h2>When you have finished, make sure to submit the quiz:</h2>
                <input maxLength="32" type="submit" className="submit-btn" value="Submit Quiz"/>
            </div>

            {error && <div className="error">{error}</div>}
        </form>
    );
}
 
export default AddQuiz;