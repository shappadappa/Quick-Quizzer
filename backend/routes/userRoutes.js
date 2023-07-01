const express = require("express")

const router = express.Router()

const {getUser, signupUser, loginUser, updateUser, deleteUser} = require("../controllers/userController")

router.post("/signup", signupUser)
router.post("/login", loginUser)

router.get("/:id", getUser)
router.patch("/:id", updateUser)
router.delete("/:id", deleteUser)

module.exports = router