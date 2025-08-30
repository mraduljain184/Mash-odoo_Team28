import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import RegisterPage from "./Components/RegisterPage";
import LoginPage from "./Components/LoginPage";
import ForgotPassword from "./Components/ForgotPassword";
import ResetPassword from "./Components/ResetPassword";
import VerifyEmail from "./Components/VerifyEmail";
import HomePage from "./Components/HomePage";
import WorkshopDetail from "./Components/WorkshopDetail";
import ServiceNew from "./Components/ServiceNew";
import AdminHome from "./Components/AdminHome";



function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

function App() {
  const [user, setUser] = useState(null);
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
        <Route path="/workshops/:id" element={<PrivateRoute><WorkshopDetail /></PrivateRoute>} />
        <Route path="/workshops/:id/service/new" element={<PrivateRoute><ServiceNew /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute><AdminHome /></PrivateRoute>} />
        <Route path="/login" element={<LoginPage setUser={setUser} />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
      </Routes>
    </div>
  );
}

export default App;