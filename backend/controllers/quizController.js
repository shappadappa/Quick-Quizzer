const mongoose = require("mongoose")
const bcrypt = require("bcrypt")

const quizModel = require("../models/quizModel")

const getQuizzes = async(req, res) =>{
    const privateQuizzes = await quizModel.find({ownerId: req.user._id})
    
    const publicQuizzes = await quizModel.find({"options.public": true})

    return res.status(200)
                .json({privateQuizzes: privateQuizzes.map(quiz => {
                        return {title: quiz.title, createdAt: quiz.createdAt, _id: quiz._id}
                    }), 
                    publicQuizzes: publicQuizzes.filter(quiz => quiz.ownerId != req.user._id && quiz.questions.length !== 0).map(quiz => {
                        return {title: quiz.title, createdAt: quiz.createdAt, _id: quiz._id, tags: quiz.options.tags}
                    })})
}

const getQuiz = async(req, res) =>{
    if(!mongoose.Types.ObjectId.isValid(req.params.id)){
        return res.status(400).json({error: "Invalid ID"})
    }

    if(req.headers.getbyuserid === "true"){
        const quizzes = await quizModel.find({"options.public": true, ownerId: req.params.id})

        return res.status(200).json(quizzes.map(quiz => {
            return {title: quiz.title, createdAt: quiz.createdAt, _id: quiz._id}
        }))
    }
    
    let quiz = await quizModel.findById(req.params.id)

    if(quiz){
        let combinedAnswers = quiz.wrongAnswers.map(wrongAnswersCollection => [...wrongAnswersCollection])

        quiz.questionTypes.forEach((questionType, questionIndex) =>{
            if(questionType === "multiple-choice"){
                // placing the correct answer in a random index among the wrong answers
                const randomIndex = Math.floor(Math.random() * (quiz.wrongAnswers [questionIndex].length + 1))
                combinedAnswers [questionIndex].splice(randomIndex, 0, quiz.answers [questionIndex])
            }
        })

        const isOwner = quiz.ownerId == req.user._id
        
        if(isOwner){
            return res.status(200).json({quiz: {...quiz._doc, combinedAnswers}, isOwner, passwordCorrect: true})
        } else{
            quiz.answers = undefined
            quiz.wrongAnswers = undefined
            quiz.password = undefined

            if(quiz.password && !req.headers.password){
                return res.status(200).json({quiz: {title: quiz.title, createdAt: quiz.createdAt, _id: quiz._id, options: quiz.options, ownerId: quiz.ownerId }, isOwner, passwordCorrect: false})
            } else if(quiz.password && req.headers.password){
                const match = await bcrypt.compare(req.headers.password, quiz.password)

                if(match){
                    return res.status(200).json({quiz: {...quiz._doc, combinedAnswers}, isOwner, passwordCorrect: match})
                } else{
                    return res.status(400).json({error: "Incorrect password"})
                }
            } else if(!quiz.password){
                return res.status(200).json({quiz: {...quiz._doc, combinedAnswers}, isOwner, passwordCorrect: true})
            }
        }
    } else{
        return res.status(404).json({error: "Quiz was not found"})
    }
}

const createQuiz = async(req, res) =>{
    try{
        let quiz

        if(req.body.password){
            const salt = await bcrypt.genSalt(10)
            const hash = await bcrypt.hash(req.body.password, salt)

            quiz = await quizModel.create({...req.body, password: hash, ownerId: req.user._id})
        } else{
            quiz = await quizModel.create({...req.body, ownerId: req.user._id})
        }

        return res.status(200).json(quiz)
    } catch(error){
        return res.status(400).json({error: error.message})
    }
}

const updateQuiz = async(req, res) =>{
    if(!mongoose.Types.ObjectId.isValid(req.params.id)){
        return res.status(400).json({error: "Invalid ID"})
    }

    let quiz = await quizModel.findById(req.params.id)

    if(quiz){
        if(quiz.ownerId == req.user._id){
            quiz = await quizModel.findOneAndReplace({_id: req.params.id}, {...req.body}, {returnDocument: "after"})

            return res.status(200).json(quiz)
        } else{
            return res.status(401).json({error: "Unauthorised access to modify quiz"})
        }
    } else{
        return res.status(404).json({error: "Quiz was not found"})
    }
}

const deleteQuiz = async(req, res) =>{
    if(!mongoose.Types.ObjectId.isValid(req.params.id)){
        return res.status(400).json({error: "Invalid ID"})
    }

    let quiz = await quizModel.findById(req.params.id)

    if(quiz){
        if(quiz.ownerId == req.user._id){
            quiz = await quizModel.findByIdAndDelete(req.params.id)

            return res.status(200).json(quiz)
        } else{
            return res.status(401).json({error: "Unauthorised access to delete quiz"})
        }
    } else{
        return res.status(404).json({error: "Quiz was not found"})
    }
}

module.exports = {getQuizzes, getQuiz, createQuiz, updateQuiz, deleteQuiz}