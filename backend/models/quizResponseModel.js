const mongoose = require("mongoose")

const quizResponseSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    quizId: {
        type: String,
        required: true
    },
    correctQuestions: {
        type: [Number],
        required: true
    },
    mark: {
        type: Number,
        required: false
    },
    timeTaken: {
        type: Number,
        required: true
    }
}, {timestamps: true})

module.exports = mongoose.model("QuizResponse", quizResponseSchema)
