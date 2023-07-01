const validateQuiz = async(req, res, next) =>{
    let marksTotal = 0

    if(req.body.options.markedQuiz){
        for(const mark of req.body.marks){
            marksTotal += mark
        }
    }

    if(req.body.passMark > marksTotal){
        return res.status(400).json({error: "Pass mark cannot be greater than marks total"})
    }

    if(req.body.options.public){
        if(req.body.options.tags.length > 10){
            return res.status(400).json({error: "Up to 10 tags are allowed"})
        }

        if(req.body.options.tags.filter((tag, index) => req.body.options.tags.indexOf(tag) != index).length > 0){
            return res.status(400).json({error: "Duplicate tags not allowed"})
        }

        if(req.body.options.tags.includes("")){
            return res.status(400).json({error: "Empty tags not allowed"})
        }
    }

    next()
}

module.exports = validateQuiz