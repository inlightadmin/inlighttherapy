import { FirebaseStatus } from '@/components/FirebaseStatus'
import { Layout } from '@/components/Layout'
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
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

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
            <Route path="account" element={<AccountPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<SignupPage />} />
            <Route path="terms" element={<TermsPage />} />
            <Route path="privacy" element={<PrivacyPage />} />
            <Route path="home" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
        <FirebaseStatus />
      </BrowserRouter>
    </AuthProvider>
  )
}
