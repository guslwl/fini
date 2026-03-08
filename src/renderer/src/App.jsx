import { Navigate, Route, Routes } from 'react-router-dom'

import AppShell from '@/components/layout/AppShell'
import CalendarPage from '@/pages/CalendarPage'
import HolidaysPage from '@/pages/HolidaysPage'
import HomePage from '@/pages/HomePage'
import PayablesPage from '@/pages/PayablesPage'
import RecurringPayablesPage from '@/pages/RecurringPayablesPage'

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="holidays" element={<HolidaysPage />} />
        <Route path="payables" element={<PayablesPage />} />
        <Route path="payables/recurring" element={<RecurringPayablesPage />} />
        <Route path="payables/calendar" element={<CalendarPage />} />
        <Route path="recurring" element={<Navigate to="/payables/recurring" replace />} />
        <Route path="calendar" element={<Navigate to="/payables/calendar" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
