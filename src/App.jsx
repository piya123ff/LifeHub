import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAppData } from './hooks/useAppData.js'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import ErrorBoundary  from './components/common/ErrorBoundary.jsx'
import AppLayout      from './components/layout/AppLayout.jsx'
import DashboardPage  from './features/dashboard/DashboardPage.jsx'
import FinancePage    from './features/finance/FinancePage.jsx'
import TodoPage       from './features/todo/TodoPage.jsx'
import WorkoutPage    from './features/workout/WorkoutPage.jsx'
import HealthPage     from './features/health/HealthPage.jsx'
import GoalsPage      from './features/goals/GoalsPage.jsx'
import HabitsPage     from './features/habits/HabitsPage.jsx'
import BackupPage     from './features/backup/BackupPage.jsx'

function AppInit({ children }) {
  useAppData()
  return children
}

const BASE = import.meta.env.BASE_URL

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter basename={BASE}>
          <AppInit>
            <Routes>
              <Route path="/" element={<AppLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<ErrorBoundary><DashboardPage /></ErrorBoundary>} />
                <Route path="finance"   element={<ErrorBoundary><FinancePage /></ErrorBoundary>} />
                <Route path="todo"      element={<ErrorBoundary><TodoPage /></ErrorBoundary>} />
                <Route path="workout"   element={<ErrorBoundary><WorkoutPage /></ErrorBoundary>} />
                <Route path="health"    element={<ErrorBoundary><HealthPage /></ErrorBoundary>} />
                <Route path="goals"     element={<ErrorBoundary><GoalsPage /></ErrorBoundary>} />
                <Route path="habits"    element={<ErrorBoundary><HabitsPage /></ErrorBoundary>} />
                <Route path="backup"    element={<ErrorBoundary><BackupPage /></ErrorBoundary>} />
              </Route>
            </Routes>
          </AppInit>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

