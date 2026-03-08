import { Navigate, Route, Routes } from 'react-router-dom'

import AppShell from '@/components/layout/AppShell'
import CalendarPage from '@/pages/CalendarPage'
import HolidaysPage from '@/pages/HolidaysPage'
import HomePage from '@/pages/HomePage'
import PayablesPage from '@/pages/PayablesPage'

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="holidays" element={<HolidaysPage />} />
        <Route path="payables" element={<PayablesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
