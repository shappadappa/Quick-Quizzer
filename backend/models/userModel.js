const mongoose = require("mongoose")
const validator = require("validator")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const uniqueValidator = require("mongoose-unique-validator")

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        uniqueCaseInsensitive: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        uniqueCaseInsensitive: true
    },
    password: {
        type: String,
        required: true
    }
}, {timestamps: true})

userSchema.statics.signup = async function(email, username, password){
    // validating inputs
    if(!validator.isEmail(email)){
        throw Error("Invalid email")
    }

    if(!validator.isStrongPassword(password, {minSymbols: 0})){
        throw Error("Password is not strong enough")
    }

    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)

    const user = await this.create({email, username, password: hash})

    return user
}

userSchema.statics.login = async function(emailOrUsername, password){
    let user

    if(validator.isEmail(emailOrUsername)){
        // case insensitive search
        user = await this.findOne({email: {"$regex": `^${emailOrusername}$`, "$options": "i"}})
        
        if(!user){
            throw Error("Incorrect email")
        }
    } else{
        // case insensitive search
        user = await this.findOne({username: {"$regex": `^${emailOrUsername}$`, "$options": "i"}})

        if(!user){
            throw Error("Incorrect username")
        }
    }

    const matchingPassword = await bcrypt.compare(password, user.password)

    if(!matchingPassword){
        throw Error("Incorrect password")
    }

    return user
}

userSchema.statics.updateDetails = async function(authorization, email, username, oldPassword, newPassword){
    let user

    if(!validator.isEmail(email)){
        throw Error("Invalid email")
    }
    
    let token, _id

    if(authorization){
        token = authorization.split(" ") [1]
    } else{
        throw Error("Authorization required")
    }
    
    try{
        _id = jwt.verify(token, process.env.SECRET)._id
    } catch(error){
        throw Error(error.message)
    }

    user = await this.findById(_id)

    if(!user){
        throw Error("User not found")
    }

    const matchingPassword = await bcrypt.compare(oldPassword, user.password)
    
    if(!matchingPassword){
        throw Error("Password incorrect")
    }

    if(!validator.isStrongPassword(newPassword, {minSymbols: 0})){
        throw Error("New password is not strong enough")
    }

    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(newPassword, salt)

    user = await this.updateOne({_id}, {email, username, password: hash}, {runValidators: true})

    return user
}

userSchema.plugin(uniqueValidator, {message: "{PATH} already in use"})

module.exports = mongoose.model("User", userSchema)