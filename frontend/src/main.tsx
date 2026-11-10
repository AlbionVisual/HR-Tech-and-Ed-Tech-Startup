import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { bootstrapFromUrl } from './ai/bootstrapFromUrl'
import { loadCatalog } from './ai/catalog'
import './index.css'
import App from './App.tsx'

bootstrapFromUrl()
void loadCatalog()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
