require("dotenv").config()

const jwt = require("jsonwebtoken")
const userModel = require("../models/userModel")

const requireAuth = async(req, res, next) =>{
    const {authorization} = req.headers

    if(!authorization){
        return res.status(401).json({error: "Authorization token required"})
    }

    const token = authorization.split(" ") [1] // token is found after "Bearer"

    try{
        const {_id} = jwt.verify(token, process.env.SECRET)

        req.user = await userModel.findById(_id).select("_id")
        
        next()
    } catch(error){
        return res.status(401).json({error: error.message})
    }
}

module.exports = requireAuth