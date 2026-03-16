import { Navigate, Route, Routes } from 'react-router-dom'

import AppShell from '@/components/layout/AppShell'
import AccountsPage from '@/pages/AccountsPage'
import CalendarPage from '@/pages/CalendarPage'
import HolidaysPage from '@/pages/HolidaysPage'
import HomePage from '@/pages/HomePage'
import PayablesPage from '@/pages/PayablesPage'
import ScheduledTransactionsPage from '@/pages/ScheduledTransactionsPage'

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="accounts" element={<AccountsPage />} />
        <Route path="holidays" element={<HolidaysPage />} />
        <Route path="payables" element={<PayablesPage />} />
        <Route path="scheduled-transactions" element={<ScheduledTransactionsPage />} />
        <Route path="payables/calendar" element={<CalendarPage />} />
        <Route
          path="payables/recurring"
          element={<Navigate to="/scheduled-transactions" replace />}
        />
        <Route path="recurring" element={<Navigate to="/scheduled-transactions" replace />} />
        <Route path="calendar" element={<Navigate to="/payables/calendar" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
