import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAppData } from './hooks/useAppData.js'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import AppLayout      from './components/layout/AppLayout.jsx'
import DashboardPage  from './features/dashboard/DashboardPage.jsx'
import FinancePage    from './features/finance/FinancePage.jsx'
import TodoPage       from './features/todo/TodoPage.jsx'
import WorkoutPage    from './features/workout/WorkoutPage.jsx'
import HealthPage     from './features/health/HealthPage.jsx'
import GoalsPage      from './features/goals/GoalsPage.jsx'
import BackupPage     from './features/backup/BackupPage.jsx'

function AppInit({ children }) {
  useAppData()
  return children
}

// basename matches vite.config.js base: '/lifehub/'
const BASE = import.meta.env.BASE_URL

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter basename={BASE}>
        <AppInit>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="finance"   element={<FinancePage />} />
              <Route path="todo"      element={<TodoPage />} />
              <Route path="workout"   element={<WorkoutPage />} />
              <Route path="health"    element={<HealthPage />} />
              <Route path="goals"     element={<GoalsPage />} />
              <Route path="backup"    element={<BackupPage />} />
            </Route>
          </Routes>
        </AppInit>
      </BrowserRouter>
    </ThemeProvider>
  )
}
