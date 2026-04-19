import {useEffect} from 'react'
import {Routes, Route, useLocation} from 'react-router-dom'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import BlogList from './pages/BlogList.jsx'
import BlogDetail from './pages/BlogDetail.jsx'
import NewsList from './pages/NewsList.jsx'
import NewsDetail from './pages/NewsDetail.jsx'
import About from './pages/About.jsx'
import Contact from './pages/Contact.jsx'
import Programs from './pages/Programs.jsx'
import Trial from './pages/Trial.jsx'
import Enroll from './pages/Enroll.jsx'
import PaymentSuccess from './pages/PaymentSuccess.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import NotFound from './pages/NotFound.jsx'
import ProtectedRoute from './admin/components/ProtectedRoute.jsx'
import AdminLayout from './admin/components/AdminLayout.jsx'
import AdminLoginPage from './admin/pages/AdminLoginPage.jsx'
import AdminDashboardPage from './admin/pages/AdminDashboardPage.jsx'
import UploadPage from './admin/pages/UploadPage.jsx'
import VideosPage from './admin/pages/VideosPage.jsx'
import LectureMappingPage from './admin/pages/LectureMappingPage.jsx'
import {trackPageView} from './utils/metaPixel'

export default function App() {
  const location = useLocation()
  const isAdminShell = location.pathname.startsWith('/login') || location.pathname.startsWith('/admin')

  useEffect(() => {
    trackPageView(`${location.pathname}${location.search}`)
  }, [location.pathname, location.search])

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-slate-800">
      {!isAdminShell ? <Header /> : null}
      <main className="flex-1">
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
          <Route path="/" element={<Home />} />
          <Route path="/programs" element={<Programs />} />
          <Route path="/blogs" element={<BlogList />} />
          <Route path="/blogs/:slug" element={<BlogDetail />} />
          <Route path="/news" element={<NewsList />} />
          <Route path="/news/:slug" element={<NewsDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/trial" element={<Trial />} />
          <Route path="/enroll" element={<Enroll />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isAdminShell ? <Footer /> : null}
    </div>
  )
}
