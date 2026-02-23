import { Navigate, Route, Routes } from 'react-router-dom'

import AppShell from '@/components/layout/AppShell'
import HolidaysPage from '@/pages/HolidaysPage'
import HomePage from '@/pages/HomePage'
import PayablesPage from '@/pages/PayablesPage'

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="payables" element={<PayablesPage />} />
        <Route path="holidays" element={<HolidaysPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
