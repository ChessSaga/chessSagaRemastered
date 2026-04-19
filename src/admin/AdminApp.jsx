import {Navigate, Route, Routes} from 'react-router-dom'
import AdminLayout from './components/AdminLayout'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import UploadPage from './pages/UploadPage'
import VideosPage from './pages/VideosPage'
import LectureMappingPage from './pages/LectureMappingPage'

export default function AdminApp() {
  return (
    <Routes>
      <Route path="/login" element={<AdminLoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/upload" element={<UploadPage />} />
          <Route path="/admin/videos" element={<VideosPage />} />
          <Route path="/admin/lectures" element={<LectureMappingPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
