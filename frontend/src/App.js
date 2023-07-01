import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

import Dashboard from "./pages/Dashboard"
import AddQuiz from "./pages/AddQuiz";
import Navbar from "./components/Navbar";
import Quiz from "./pages/Quiz";
import AnswerQuiz from "./pages/AnswerQuiz";
import Login from "./pages/Login";
import Signup from "./pages/Signup"
import Profile from "./pages/Profile"
import PageNotFound from "./pages/PageNotFound";

import { useAuthContext } from "./hooks/useAuthContext";

function App() {
  const {user, isLoading} = useAuthContext()

  return (
    <BrowserRouter>
      <div className="App">
        <>
          <Navbar />
          {!isLoading && 
            <Routes>
              <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login"/>} />
              <Route path="/add" element={user ? <AddQuiz /> : <Navigate to="/login"/>} />
              <Route path="/quiz/:id" element={user ? <Quiz /> : <Navigate to="/login"/>} />
              <Route path="/takequiz/:id" element={user ? <AnswerQuiz /> : <Navigate to="/login"/>} />

              <Route path="/login" element={!user ? <Login /> : <Navigate to ="/" />} />
              <Route path="/signup" element={!user ? <Signup /> : <Navigate to ="/" />} />
              <Route path="/profile/:id" element={user ? <Profile /> : <Navigate to="/login" />} />

              <Route path="*" element={<PageNotFound />} />
            </Routes>
          }
          {isLoading && <div className="loader"></div>}
        </>
      </div>
    </BrowserRouter>
  );
}

export default App;
