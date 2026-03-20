import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'
import { POSProvider } from './context/POSContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <POSProvider>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: '10px',
            background: '#1e1e2e',
            color: '#fff',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: { iconTheme: { primary: '#4ade80', secondary: '#1e1e2e' } },
          error: { iconTheme: { primary: '#f87171', secondary: '#1e1e2e' } },
        }}
      />
    </POSProvider>
  </StrictMode>
)
