const express = require("express")

const router = express.Router()

const requireAuth = require("../middleware/requireAuth")
const {getQuizResponses, addQuizResponse, deleteQuizResponse} = require("../controllers/quizResponseController")

router.use(requireAuth)

router.get("/:id", getQuizResponses)
router.post("/", addQuizResponse)
router.delete("/:id", deleteQuizResponse)

module.exports = router