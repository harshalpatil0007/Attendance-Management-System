import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AboutPage from './pages/AboutPage';
import ChatBot from './components/chatbot/ChatBot';

const AppContent = () => {
  const location = useLocation();
  const isTeacherDashboard = location.pathname.startsWith('/dashboard/teacher');

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Show global chatbot everywhere EXCEPT on teacher dashboard where it's merged with Quick Update */}
      {!isTeacherDashboard && <ChatBot />}
      
      <Routes>
        <Route path="/" element={<><Navbar /><Landing /><Footer /></>} />
        <Route path="/about" element={<><Navbar /><AboutPage /><Footer /></>} />
        <Route path="/login" element={<><Navbar /><Login /><Footer /></>} />
        <Route path="/register" element={<><Navbar /><Register /><Footer /></>} />
        <Route path="/forgot-password" element={<><Navbar /><ForgotPassword /><Footer /></>} />
        
        {/* Protected Dashboard Routes */}
        <Route path="/dashboard/student" element={<StudentDashboard />} />
        <Route path="/dashboard/teacher" element={<TeacherDashboard />} />
        <Route path="/dashboard/admin/*" element={<AdminDashboard />} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
