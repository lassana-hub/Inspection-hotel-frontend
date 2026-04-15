import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar/Navbar'
import Dashboard from './pages/Dashboard/Dashboard'
import HotelDetail from './pages/HotelDetail/HotelDetail'
import PlanningDetail from './pages/PlanningDetail/PlanningDetail'
import DailyPlanDetail from './pages/DailyPlanDetail/DailyPlanDetail'
import './App.css'

export default function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/hotels/:id" element={<HotelDetail />} />
          <Route path="/plannings/:id" element={<PlanningDetail />} />
          <Route path="/daily-plans/:id" element={<DailyPlanDetail />} />
        </Routes>
      </main>
    </div>
  )
}
