require('dotenv').config()

const express = require("express")
const mongoose = require("mongoose")

const quizRoutes = require("./routes/quizRoutes")
const userRoutes = require("./routes/userRoutes")
const quizResponseRoutes = require("./routes/quizResponseRoutes")

const app = express()

app.use(express.json())

app.use(express.urlencoded({extended: true}))

app.use("/api/quiz", quizRoutes)
app.use("/api/user", userRoutes)
app.use("/api/quizresponse", quizResponseRoutes)

// connecting to the db
mongoose.connect(process.env.MONGO_URI)
    .then(() => app.listen(process.env.PORT))
    .catch(err => console.log(err))