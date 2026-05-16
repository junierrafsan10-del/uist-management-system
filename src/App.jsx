import { lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import ScrollToTop from './components/ScrollToTop'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import NotFound from './pages/NotFound'
import './styles/globals.css'

const Login = lazy(() => import('./pages/Login'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const Unauthorized = lazy(() => import('./pages/Unauthorized'))
const Landing = lazy(() => import('./pages/Landing'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const StudentsPage = lazy(() => import('./pages/admin/StudentsPage'))
const ResultsPage = lazy(() => import('./pages/admin/ResultsPage'))
const AttendancePage = lazy(() => import('./pages/admin/AttendancePage'))
const TeacherDashboard = lazy(() => import('./pages/teacher/TeacherDashboard'))
const NewStudentDashboard = lazy(() => import('./pages/student/StudentDashboard'))


function PageSkeleton() {
  return <div className="page-skeleton" />
}

export default function App() {
  const location = useLocation()

  return (
    <>
      <ScrollToTop />
      <AnimatePresence mode="wait">
        <Suspense fallback={<PageSkeleton />}>
          <div className="page-transition-wrapper">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Landing />} />
              
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route
                path="/student-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <ErrorBoundary>
                      <NewStudentDashboard />
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <ErrorBoundary>
                      <TeacherDashboard />
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <ErrorBoundary>
                      <AdminDashboard />
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/students"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <ErrorBoundary>
                      <StudentsPage />
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/results"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <ErrorBoundary>
                      <ResultsPage />
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/attendance"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <ErrorBoundary>
                      <AttendancePage />
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </Suspense>
      </AnimatePresence>
    </>
  )
}
