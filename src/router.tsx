/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { authStore } from './stores/authStore'

// Lazy-loaded pages — each route is a separate chunk
const FeedPage = lazy(() => import('./pages/FeedPage'))
const BoardViewPage = lazy(() => import('./pages/BoardViewPage'))
const BuilderPage = lazy(() => import('./pages/BuilderPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const EarningsPage = lazy(() => import('./pages/EarningsPage'))
const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'))

function LoadingFallback() {
  return (
    <div className="flex h-screen items-center justify-center bg-black">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
    </div>
  )
}

// Redirects unauthenticated users to /login
function PrivateRoute() {
  const isAuthenticated = authStore((s) => s.isAuthenticated)
  return isAuthenticated ? (
    <Suspense fallback={<LoadingFallback />}>
      <Outlet />
    </Suspense>
  ) : (
    <Navigate to="/login" replace />
  )
}

// Redirects authenticated users away from auth pages
function PublicOnlyRoute() {
  const isAuthenticated = authStore((s) => s.isAuthenticated)
  return isAuthenticated ? (
    <Navigate to="/feed" replace />
  ) : (
    <Suspense fallback={<LoadingFallback />}>
      <Outlet />
    </Suspense>
  )
}

export const router = createBrowserRouter([
  // Public routes
  {
    path: '/',
    element: <Navigate to="/feed" replace />,
  },
  {
    path: '/feed',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <FeedPage />
      </Suspense>
    ),
  },
  {
    // Hosted board player — used for SMS share links and embeds
    path: '/b/:boardId',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <BoardViewPage />
      </Suspense>
    ),
  },
  {
    // Temporary public builder review route for MVP sanity checks before auth is fully wired.
    path: '/builder-demo',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <BuilderPage />
      </Suspense>
    ),
  },
  {
    // Public user profile
    path: '/:username',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <ProfilePage />
      </Suspense>
    ),
  },

  // Auth routes (redirect away if already logged in)
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
    ],
  },

  // Protected routes
  {
    element: <PrivateRoute />,
    children: [
      { path: '/builder', element: <BuilderPage /> },
      { path: '/builder/:boardId', element: <BuilderPage /> },
      { path: '/earnings', element: <EarningsPage /> },
    ],
  },
])
