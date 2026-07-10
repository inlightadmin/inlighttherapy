import { FirebaseStatus } from '@/components/FirebaseStatus'
import { Layout } from '@/components/Layout'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { RequireStaff } from '@/components/admin/RequireStaff'
import { AuthProvider } from '@/context/AuthContext'
import { AboutPage } from '@/pages/AboutPage'
import { AccountPage } from '@/pages/AccountPage'
import { LoginPage, SignupPage } from '@/pages/AuthPages'
import { ClinicianDetailPage } from '@/pages/ClinicianDetailPage'
import { CliniciansPage } from '@/pages/CliniciansPage'
import { ContactPage } from '@/pages/ContactPage'
import { HomePage } from '@/pages/HomePage'
import { PrivacyPage, TermsPage } from '@/pages/LegalPages'
import { NewsletterPage } from '@/pages/NewsletterPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ServicesPage } from '@/pages/ServicesPage'
import { ToolsPage } from '@/pages/ToolsPage'
import { AdminClinicianEditPage } from '@/pages/admin/AdminClinicianEditPage'
import { AdminCliniciansPage } from '@/pages/admin/AdminCliniciansPage'
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { AdminHoursPage } from '@/pages/admin/AdminHoursPage'
import { AdminQuotesPage } from '@/pages/admin/AdminQuotesPage'
import { AdminToolsPage } from '@/pages/admin/AdminToolsPage'
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage'
import { ChatPage } from '@/pages/ChatPage'
import { StaffChatPage } from '@/pages/StaffChatPage'
import { useEffect } from 'react'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom'

/** SEO-friendly URL: /location → /contact#location (Find us section) */
function LocationRedirect() {
  const navigate = useNavigate()
  useEffect(() => {
    navigate('/contact#location', { replace: true })
  }, [navigate])
  return null
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="clinicians" element={<CliniciansPage />} />
            <Route path="clinicians/:slug" element={<ClinicianDetailPage />} />
            <Route path="tools" element={<ToolsPage />} />
            <Route path="newsletter" element={<NewsletterPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="location" element={<LocationRedirect />} />
            <Route path="account" element={<AccountPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route
              path="chat/staff"
              element={
                <RequireStaff minRole="CLINICIAN">
                  <div className="container-page py-10 sm:py-12">
                    <StaffChatPage />
                  </div>
                </RequireStaff>
              }
            />
            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<SignupPage />} />
            <Route path="terms" element={<TermsPage />} />
            <Route path="privacy" element={<PrivacyPage />} />
            <Route path="home" element={<Navigate to="/" replace />} />

            <Route
              path="admin"
              element={
                <RequireStaff minRole="PUBLICIST">
                  <AdminLayout />
                </RequireStaff>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="chat" element={<StaffChatPage />} />
              <Route path="quotes" element={<AdminQuotesPage />} />
              <Route path="tools" element={<AdminToolsPage />} />
              <Route path="hours" element={<AdminHoursPage />} />
              <Route path="clinicians" element={<AdminCliniciansPage />} />
              <Route
                path="clinicians/:uid"
                element={<AdminClinicianEditPage />}
              />
              <Route
                path="users"
                element={
                  <RequireStaff minRole="ADMIN">
                    <AdminUsersPage />
                  </RequireStaff>
                }
              />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
        <FirebaseStatus />
      </BrowserRouter>
    </AuthProvider>
  )
}
