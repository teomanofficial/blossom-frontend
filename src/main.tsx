import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { ImpersonationProvider } from './context/ImpersonationContext'
import AnalyticsProvider from './components/AnalyticsProvider'
import { trackAiReferrerOnce } from './lib/analytics'
import './index.css'

// Fire the GA4 `ai_referrer` event once per session if the visitor arrived
// from a known AI surface (ChatGPT, Perplexity, Claude, Gemini, etc.). Runs
// synchronously before render — referrer detection just reads
// `document.referrer`, which is available immediately. The marketing site
// (Astro) mirrors this in `marketing/src/layouts/BaseLayout.astro`.
trackAiReferrerOnce()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AnalyticsProvider>
      <AuthProvider>
        <ImpersonationProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#f1f5f9' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#f1f5f9' },
              duration: 5000,
            },
          }}
        />
        </ImpersonationProvider>
      </AuthProvider>
      </AnalyticsProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
