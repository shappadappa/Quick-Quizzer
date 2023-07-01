import { Link } from "react-router-dom";
import {ReactComponent as PageNotFoundSvg} from "../svgs/404page.svg"

const PageNotFound = () => {
    return (
        <div className="page-not-found">
            <p>The requested page was not found</p>
            <PageNotFoundSvg />
            <i>How did you end up here?</i>
            <Link to="/">Go back to the dashboard</Link>
        </div>
    );
}
 
export default PageNotFound;