import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import RegisterPage from "./Components/RegisterPage";
import LoginPage from "./Components/LoginPage";
import ForgotPassword from "./Components/ForgotPassword";
import ResetPassword from "./Components/ResetPassword";
import VerifyEmail from "./Components/VerifyEmail";



function App() {
  const [user, setUser] = useState(null);
  return (
    <div className="App">
      <Routes>
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