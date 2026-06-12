import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { AppProvider } from './store/AppContext.tsx'
import './index.css'

const container = document.getElementById('root')
if (!container) {
  throw new Error('找不到 #root 挂载节点')
}

createRoot(container).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
)
