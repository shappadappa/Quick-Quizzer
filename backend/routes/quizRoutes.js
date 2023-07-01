const express = require("express")

const { getQuizzes, getQuiz, createQuiz, updateQuiz, deleteQuiz } = require("../controllers/QuizController")
const requireAuth = require("../middleware/requireAuth")
const validateQuiz = require("../middleware/validateQuiz")

const router = express.Router()

router.use(requireAuth)

router.get("/", getQuizzes)
router.get("/:id", getQuiz)
router.get("*", (req, res) =>{
    return res.status(404).json({error: "Invalid ID"})
})
router.delete("/:id", deleteQuiz)

router.use(validateQuiz)

router.post("/", createQuiz)
router.patch("/:id", updateQuiz)

module.exports = router