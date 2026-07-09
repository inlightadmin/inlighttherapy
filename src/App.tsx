import { Layout } from '@/components/Layout'
import { FirebaseStatus } from '@/components/FirebaseStatus'
import { AboutPage } from '@/pages/AboutPage'
import { ClinicianDetailPage } from '@/pages/ClinicianDetailPage'
import { CliniciansPage } from '@/pages/CliniciansPage'
import { ContactPage } from '@/pages/ContactPage'
import { HomePage } from '@/pages/HomePage'
import { LoginPage, SignupPage } from '@/pages/AuthPages'
import { TermsPage, PrivacyPage } from '@/pages/LegalPages'
import { NewsletterPage } from '@/pages/NewsletterPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ServicesPage } from '@/pages/ServicesPage'
import { ToolsPage } from '@/pages/ToolsPage'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

export default function App() {
  return (
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
  )
}
