import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { ErrorBoundary } from 'react-error-boundary'
import { Toaster } from 'sonner'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { AnalyticsTracker } from './components/AnalyticsTracker.jsx'
import { ErrorFallback } from './components/ErrorFallback.jsx'
import { ScrollToTop } from './components/ScrollToTop.jsx'

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      const status = error?.response?.status || error?.status
      if (status >= 500) {
        window.location.href = '/500'
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: (failureCount, error) => {
        const status = error?.response?.status
        if (status === 401 || status === 403) return false
        return failureCount < 1
      },
      retryDelay: 1000,
      /** Reduces layout thrash / surprise refetch; per-query can override (e.g. notifications). */
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
      <HelmetProvider>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <AuthProvider>
                <ScrollToTop />
                <AnalyticsTracker />
                <App />
                <Toaster
  position="top-right"
  richColors
  closeButton
  toastOptions={{
    duration: 4000,
    style: { maxWidth: 380 },
  }}
/>
              </AuthProvider>
            </BrowserRouter>
          </QueryClientProvider>
        </ThemeProvider>
      </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>,
)
