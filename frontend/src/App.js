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
import WorkerAddWorkshop from "./Components/WorkerAddWorkshop";
import WorkerDashboard from "./Components/WorkerDashboard";
import ServiceTrack from "./Components/ServiceTrack";
import { useAuth } from './auth/AuthContext';



function PrivateRoute({ children }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return null; // loader can be added
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

function AdminRoute({ children }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function WorkerRoute({ children }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (user.role !== 'worker') return <Navigate to="/" replace />;
  return children;
}

function LoginOrRedirect() {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (user) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'worker') return <Navigate to="/worker/dashboard" replace />;
    return <Navigate to="/" replace />;
  }
  return <LoginPage />;
}

function App() {
  const [user, setUser] = useState(null);
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
        <Route path="/workshops/:id" element={<PrivateRoute><WorkshopDetail /></PrivateRoute>} />
        <Route path="/workshops/:id/service/new" element={<PrivateRoute><ServiceNew /></PrivateRoute>} />
        <Route path="/services/:id/track" element={<PrivateRoute><ServiceTrack /></PrivateRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminHome /></AdminRoute>} />
        <Route path="/worker/workshop/new" element={<WorkerRoute><WorkerAddWorkshop /></WorkerRoute>} />
        <Route path="/worker/dashboard" element={<WorkerRoute><WorkerDashboard /></WorkerRoute>} />
        <Route path="/login" element={<LoginOrRedirect />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
      </Routes>
    </div>
  );
}

export default App;