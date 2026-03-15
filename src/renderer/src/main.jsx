import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { initI18n } from '@/i18n/index.js'

import '@/index.css'
import App from 'renderer/App.jsx'

async function bootstrap() {
  await initI18n()
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </StrictMode>
  )
}

bootstrap()
