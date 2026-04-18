import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar/Navbar'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'
import Dashboard from './pages/Dashboard/Dashboard'
import HotelDetail from './pages/HotelDetail/HotelDetail'
import PlanningDetail from './pages/PlanningDetail/PlanningDetail'
import DailyPlanDetail from './pages/DailyPlanDetail/DailyPlanDetail'
import Login from './pages/Login/Login'
import Signup from './pages/Signup/Signup'
import './App.css'

export default function App() {
  return (
    <Routes>
      {/* Pages publiques — layout libre */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Pages protégées — layout fixe application */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <div className="app">
              <Navbar />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/hotels/:id" element={<HotelDetail />} />
                  <Route path="/plannings/:id" element={<PlanningDetail />} />
                  <Route path="/daily-plans/:id" element={<DailyPlanDetail />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
