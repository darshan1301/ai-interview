import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Chatbox from "./features/chatbox";
import Dashboard from "./pages/Dashboard";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ProtectedRoute from "./features/authentication/checkAuth";
import Home from "./pages/Home";
import { RecoilRoot } from "recoil";

const App = () => {
  return (
    <RecoilRoot>
      <Router>
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />

          {/* ✅ Protected routes */}
          <Route
            index
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chatbox/:interviewId"
            element={
              <ProtectedRoute>
                <Chatbox />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </RecoilRoot>
  );
};

export default App;
