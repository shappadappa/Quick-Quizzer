const mongoose = require("mongoose")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")

const quizModel = require("../models/quizModel")
const userModel = require("../models/userModel")
const quizResponseModel = require("../models/quizResponseModel")

const getQuizResponses = async(req, res) =>{
    if(!mongoose.Types.ObjectId.isValid(req.params.id)){
        return res.status(400).json({error: "Invalid ID"})
    }

    // determining whether to get quiz response through quiz id or user id
    let quizResponse
    if(req.headers.getbyquizid === "true"){
        const quiz = await quizModel.findById(req.params.id)

        if(!quiz){
            return res.status(404).json({error: "Quiz was not found"})
        }

        quizResponse = await quizResponseModel.find({quizId: req.params.id})
    } else if(req.headers.getbyquizid === "false"){
        const user = await userModel.findById(req.params.id)

        if(!user){
            return res.status(404).json({error: "User not found"})
        }

        quizResponse = await quizResponseModel.find({userId: req.params.id})
    } else{
        return res.status(401).json({error: "Boolean value required for GetByQuizId"})
    }

    return res.status(200).json(quizResponse)
}

const addQuizResponse = async(req, res) =>{
    const {userId, quizId, timeTaken, submittedAnswers, password} = req.body

    // validating inputs

    let _id
    try{
        _id = jwt.verify(req.headers.authorization.split(" ") [1], process.env.SECRET)._id
    } catch(error){
        return res.status(401).json({error: error.message})
    }

    if(userId != _id){
        return res.status(401).json({error: "Cannot send quiz response from other user"})
    }

    if(!userId){
        return res.status(400).json({error: "User ID required"})
    }

    if(!quizId){
        return res.status(400).json({error: "Quiz ID required"})
    }

    if(!mongoose.Types.ObjectId.isValid(userId)){
        return res.status(400).json({error: "Invalid user ID"})
    }

    if(!mongoose.Types.ObjectId.isValid(quizId)){
        return res.status(400).json({error: "Invalid quiz ID"})
    }

    const user = await userModel.findById(userId)

    if(!user){
        return res.status(404).json({error: "User not found"})
    }

    const quiz = await quizModel.findById(quizId)

    if(!quiz){
        return res.status(404).json({error: "Quiz was not found"})
    }

    if(quiz.options.timed && timeTaken > quiz.options.maxTime){
        return res.status(400).json({error: "Time limit exceeded"})
    }

    if(quiz.password && password){
        const match = await bcrypt.compare(password, quiz.password)
        
        if(!match){
            return res.status(400).json({error: "Incorrect password"})
        }
    }



    let mark = 0, correctQuestions = [], correctAnswers = {}
    submittedAnswers.forEach((submittedAnswer, index) =>{
        if(submittedAnswer.toLowerCase() == quiz.answers [index].toLowerCase()){
            correctQuestions.push(index)

            if(quiz.options.markedQuiz){
                mark += quiz.marks [index]
            }
        } else{
            correctAnswers [index] = quiz.answers [index]
        }
    })

    let quizResponse

    if(quiz.options.markedQuiz){
        quizResponse = await quizResponseModel.create({userId, quizId, correctQuestions, mark, timeTaken})
    } else{
        quizResponse = await quizResponseModel.create({userId, quizId, correctQuestions, timeTaken})
    }

    return res.status(200).json({...quizResponse._doc, correctAnswers})
}

const deleteQuizResponse = async(req, res) =>{
    if(!mongoose.Types.ObjectId.isValid(req.params.id)){
        return res.status(400).json({error: "Invalid ID"})
    }
    
    let quizResponse = await quizResponseModel.findById(req.params.id)

    if(!quizResponse){
        return res.status(404).json({error: "Quiz response not found"})
    }

    const quiz = await quizModel.findById(quizResponse.quizId)

    if(quiz.ownerId != req.user._id){
        return res.status(401).json({error: "Cannot delete quiz response from quiz that you do not own"})
    }

    quizResponse = await quizResponseModel.findByIdAndDelete(req.params.id)

    return res.status(200).json(quizResponse)
}

module.exports = {getQuizResponses, addQuizResponse, deleteQuizResponse}