import { Navigate, Route, Routes } from 'react-router-dom'

import AppShell from '@/components/layout/AppShell'
import HolidaysPage from '@/pages/HolidaysPage'
import HomePage from '@/pages/HomePage'
// TODO import PayablesPage from '@/pages/PayablesPage'
// <Route path="payables" element={<PayablesPage />} />

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="holidays" element={<HolidaysPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
