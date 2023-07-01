const mongoose = require("mongoose")

const quizSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    questions: {
        type: [String],
        required: false
    },
    marks: {
        type: [Number],
        required: false
    },
    passMark: {
        type: Number,
        required: false
    },
    questionTypes: {
        type: [String],
        required: false
    },
    answers: {
        type: [String],
        required: false
    },
    wrongAnswers: {
        type: [[String]],
        required: false
    },
    completionMessage: {
        type: String,
        required: false
    },
    passMessage: {
        type: String,
        required: false
    },
    failMessage: {
        type: String,
        required: false
    },
    ownerId: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: false
    },
    options: {
        markedQuiz: {
            type: Boolean,
            required: true
        },
        public: {
            type: Boolean,
            required: true
        },
        tags: {
            type: [String],
            required: false
        },
        timed: {
            type: Boolean,
            required: true
        },
        maxTime: {
            type: Number,
            required: false
        }
    }
}, {timestamps: true})

module.exports = mongoose.model("Quiz", quizSchema)
