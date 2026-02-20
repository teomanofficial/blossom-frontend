import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import VerifyEmail from './pages/VerifyEmail'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import Dashboard from './pages/Dashboard'
import Formats from './pages/Formats'
import FormatDetail from './pages/FormatDetail'
import Hooks from './pages/Hooks'
import HookDetail from './pages/HookDetail'
import Tactics from './pages/Tactics'
import TacticDetail from './pages/TacticDetail'
import Videos from './pages/Videos'
import ContentAnalysis from './pages/ContentAnalysis'
import AnalysisHistory from './pages/AnalysisHistory'
import Influencers from './pages/Influencers'
import InfluencerDetail from './pages/InfluencerDetail'
import Discovery from './pages/Discovery'
import DiscoveredItems from './pages/DiscoveredItems'
import Suggestions from './pages/Suggestions'
import SuggestionDetail from './pages/SuggestionDetail'
import AccountLayout from './pages/Account'
import AccountProfile from './pages/AccountProfile'
import AccountBilling from './pages/AccountBilling'
import AccountIntegrations from './pages/AccountIntegrations'
import SubscriptionPlans from './pages/SubscriptionPlans'
import Users from './pages/Users'
import ContentManagement from './pages/ContentManagement'
import ContentManagementDetail from './pages/ContentManagementDetail'
import Support from './pages/Support'
import SupportManagement from './pages/SupportManagement'
import Categories from './pages/Categories'
import BulkAnalysisManagement from './pages/BulkAnalysisManagement'
import OnboardingManagement from './pages/OnboardingManagement'
import CategoryDomains from './pages/CategoryDomains'
import ChoosePlan from './pages/ChoosePlan'
import TrendingPosts from './pages/TrendingPosts'
import Onboarding from './pages/Onboarding'
import AuthCallback from './pages/AuthCallback'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardLayout from './components/DashboardLayout'
import type { ReactNode } from 'react'

function FeatureGate({ children }: { children: ReactNode }) {
  const { userType, planSlug, loading } = useAuth()
  if (loading) return null
  const hasAccess = userType === 'admin' || planSlug === 'premium' || planSlug === 'platin'
  if (!hasAccess) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function AdminGate({ children }: { children: ReactNode }) {
  const { userType, loading } = useAuth()
  if (loading) return null
  if (userType !== 'admin') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/choose-plan" element={<ChoosePlan />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="formats" element={<Formats />} />
        <Route path="formats/:id" element={<FormatDetail />} />
        <Route path="hooks" element={<Hooks />} />
        <Route path="hooks/:id" element={<HookDetail />} />
        <Route path="tactics" element={<Tactics />} />
        <Route path="tactics/:id" element={<TacticDetail />} />
        <Route path="videos" element={<AdminGate><Videos /></AdminGate>} />
        <Route path="analyze" element={<ContentAnalysis />} />
        <Route path="analyze/history" element={<AnalysisHistory />} />
        <Route path="influencers" element={<FeatureGate><Influencers /></FeatureGate>} />
        <Route path="influencers/:id" element={<FeatureGate><InfluencerDetail /></FeatureGate>} />
        <Route path="discovery" element={<AdminGate><Discovery /></AdminGate>} />
        <Route path="discovery/items" element={<AdminGate><DiscoveredItems /></AdminGate>} />
        <Route path="trending" element={<TrendingPosts />} />
        <Route path="suggestions" element={<Suggestions />} />
        <Route path="suggestions/:id" element={<SuggestionDetail />} />
        <Route path="settings" element={<Navigate to="/dashboard/account/billing" replace />} />
        <Route path="account" element={<AccountLayout />}>
          <Route index element={<AccountProfile />} />
          <Route path="integrations" element={<AccountIntegrations />} />
          <Route path="billing" element={<AccountBilling />} />
        </Route>
        <Route path="subscription-plans" element={<AdminGate><SubscriptionPlans /></AdminGate>} />
        <Route path="users" element={<AdminGate><Users /></AdminGate>} />
        <Route path="content-management" element={<AdminGate><ContentManagement /></AdminGate>} />
        <Route path="content-management/:id" element={<AdminGate><ContentManagementDetail /></AdminGate>} />
        <Route path="categories" element={<AdminGate><Categories /></AdminGate>} />
        <Route path="categories/:id/domains" element={<AdminGate><CategoryDomains /></AdminGate>} />
        <Route path="support" element={<Support />} />
        <Route path="support-management" element={<AdminGate><SupportManagement /></AdminGate>} />
        <Route path="bulk-management" element={<AdminGate><BulkAnalysisManagement /></AdminGate>} />
        <Route path="onboarding-management" element={<AdminGate><OnboardingManagement /></AdminGate>} />
      </Route>
    </Routes>
  )
}

export default App
