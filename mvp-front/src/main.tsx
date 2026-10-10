import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { bootstrapFromUrl } from './ai/bootstrapFromUrl'
import './index.css'
import App from './App.tsx'

bootstrapFromUrl()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
