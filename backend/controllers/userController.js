require("dotenv").config()

const { mongoose } = require("mongoose")
const jwt = require("jsonwebtoken")

const quizModel = require("../models/quizModel")
const userModel = require("../models/userModel")
const quizResponseModel = require("../models/quizResponseModel")

const createToken = _id =>{
    return jwt.sign({_id}, process.env.SECRET, {expiresIn: "3d"})
}

const getUser = async(req, res) =>{
    if(!mongoose.isValidObjectId(req.params.id)){
        return res.status(400).json({error: "Invalid ID"})
    }

    const user = await userModel.findById(req.params.id).select({email: 1, username: 1, createdAt: 1})

    if(!user){
        return res.status(404).json({error: "User not found"})
    } else{
        return res.status(200).json(user)
    }
}

const signupUser = async(req, res) =>{
    const {email, username, password} = req.body

    try{
        const user = await userModel.signup(email, username, password)

        const token = createToken(user._id)

        return res.status(200).json({user, token})
    } catch(error){
        return res.status(400).json({error: error.message})
    }
}

const loginUser = async(req, res) =>{
    const {emailOrUsername, password} = req.body

    try{
        const user = await userModel.login(emailOrUsername, password)

        const token = createToken(user._id)

        return res.status(200).json({user, token})
    } catch(error){
        return res.status(400).json({error: error.message})
    }
}

const updateUser = async(req, res) =>{
    const {email, username, oldPassword, newPassword} = req.body
    
    try{
        const user = await userModel.updateDetails(req.headers.authorization, email, username, oldPassword, newPassword)

        return res.status(200).json(user)
    } catch(error){
        return res.status(400).json({error: error.message})
    }
}

const deleteUser = async(req, res) =>{
    const {authorization} = req.headers
    let token, _id

    if(authorization){
        token = authorization.split(" ") [1]
    } else{
        return res.status(400).json({error: "Authorization required"})
    }
    
    try{
        _id = jwt.verify(token, process.env.SECRET)._id
    } catch(error){
        return res.status(401).json({error: error.message})
    }

    let user = await userModel.findById(req.params.id)

    if(!user){
        return res.status(404).json({error: "User not found"})
    } else if(user._id == _id){
        user = await userModel.findByIdAndDelete(req.params.id)

        const quizzes = await quizModel.deleteMany({ownerId: req.params.id})

        const quizResponses = await quizResponseModel.deleteMany({userId: req.params.id})

        return res.status(200).json({user, quizzes, quizResponses})
    } else{
        return res.status(401).json({error: "Unauthorised access to delete user"})
    }
}

module.exports = {getUser, signupUser, loginUser, updateUser, deleteUser}