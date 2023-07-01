import { Link } from "react-router-dom"
import { formatDistanceToNow } from "date-fns"

const QuizDetails = ({quiz}) => {
    return (
        <Link title={quiz.title} to={`/${quiz.public ? "take" : ""}quiz/${quiz._id}`} className="quiz">
            <h4>{quiz.title.length <= 21 ? quiz.title : quiz.title.slice(0, 20 + Math.abs(quiz.title.slice(20).indexOf(" "))) + "..."}</h4>
            <p>Created {formatDistanceToNow(new Date(quiz.createdAt), {addSuffix: true})}</p>
            {quiz.tags && 
                <div className="tags">
                    {quiz.tags.map((tag, index) =>(
                        <span key={index} className="tag">{tag}</span>
                    ))}
                </div>
            }
        </Link>
    );
}
 
export default QuizDetails;