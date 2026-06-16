import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { useAuth } from './context/AuthContext'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Pricing from './pages/Pricing'
import VerifyEmail from './pages/VerifyEmail'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import FAQ from './pages/FAQ'
import Dashboard from './pages/Dashboard'
import PostMortem from './pages/PostMortem'
import Outliers from './pages/Outliers'
import Greenlight from './pages/Greenlight'
import Formats from './pages/Formats'
import FormatDetail from './pages/FormatDetail'
import Hooks from './pages/Hooks'
import HookDetail from './pages/HookDetail'
import Tactics from './pages/Tactics'
import TacticDetail from './pages/TacticDetail'
import Videos from './pages/Videos'
import ContentAnalysis from './pages/ContentAnalysis'
import AnalysisDetail from './pages/AnalysisDetail'
import GeneralCoachChat from './pages/GeneralCoachChat'
import Influencers from './pages/Influencers'
import InfluencerDetail from './pages/InfluencerDetail'
import Discovery from './pages/Discovery'
import TrackedHashtags from './pages/TrackedHashtags'
import DiscoveredItems from './pages/DiscoveredItems'
import DiscoverySettings from './pages/DiscoverySettings'
import Suggestions from './pages/Suggestions'
import SuggestionDetail from './pages/SuggestionDetail'
import AccountLayout from './pages/Account'
import AccountProfile from './pages/AccountProfile'
import AccountBilling from './pages/AccountBilling'
import AccountIntegrations from './pages/AccountIntegrations'
import AccountSecurity from './pages/AccountSecurity'
import AccountPreferences from './pages/AccountPreferences'
import AccountOrganization from './pages/AccountOrganization'
import AccountApiKeys from './pages/AccountApiKeys'
import AccountMcp from './pages/AccountMcp'
import InviteAccept from './pages/InviteAccept'
import SubscriptionPlans from './pages/SubscriptionPlans'
import Users from './pages/Users'
import ContentManagement from './pages/ContentManagement'
import ContentManagementDetail from './pages/ContentManagementDetail'
import Support from './pages/Support'
import SupportManagement from './pages/SupportManagement'
import Categories from './pages/Categories'
import OrphanVideos from './pages/OrphanVideos'
import OrphanDomains from './pages/OrphanDomains'
import BulkAnalysisManagement from './pages/BulkAnalysisManagement'
import DuplicateManagement from './pages/DuplicateManagement'
import OnboardingManagement from './pages/OnboardingManagement'
import CategoryRequestManagement from './pages/CategoryRequestManagement'
import AIModelLab from './pages/AIModelLab'
import Hashtags from './pages/Hashtags'
import CategoryDetail from './pages/CategoryDetail'
import CategoryDomains from './pages/CategoryDomains'
import ChooseCategory from './pages/ChooseCategory'
import ChoosePlan from './pages/ChoosePlan'
import TrendingPosts from './pages/TrendingPosts'
import Trends from './pages/Trends'
import TrendingFormats from './pages/TrendingFormats'
import TrendingHooks from './pages/TrendingHooks'
import TrendingContents from './pages/TrendingContents'
import TrendingSongs from './pages/TrendingSongs'
import Songs from './pages/Songs'
import TrendingTopicDetail from './pages/TrendingTopicDetail'
import ContentAnalyticsDashboard from './pages/ContentAnalyticsDashboard'
import SiteAnalytics from './pages/SiteAnalytics'
import CarouselPosts from './pages/CarouselPosts'
import Onboarding from './pages/Onboarding'
import AuthCallback from './pages/AuthCallback'
import SharedAnalysis from './pages/SharedAnalysis'
import Platforms from './pages/Platforms'
import PlatformPosts from './pages/PlatformPosts'
import PlatformPostDetail from './pages/PlatformPostDetail'
import PlatformPostCreate from './pages/PlatformPostCreate'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardLayout from './components/DashboardLayout'
import type { ReactNode } from 'react'

/* ── Insights drill-down pages (lazy — keeps the initial chunk thin) ── */
const InsightsPulse = lazy(() => import('./pages/insights/Pulse'))
const InsightsAction = lazy(() => import('./pages/insights/Action'))
const InsightsForensics = lazy(() => import('./pages/insights/Forensics'))
const InsightsAnatomy = lazy(() => import('./pages/insights/Anatomy'))
const InsightsCreators = lazy(() => import('./pages/insights/Creators'))

/* ── Admin pages (lazy) ── */
const KeywordBlacklistAdmin = lazy(() => import('./pages/admin/KeywordBlacklist'))

function InsightsPageFallback() {
  return (
    <div className="glass-card rounded-3xl p-8 animate-pulse">
      <div className="h-4 w-32 bg-white/5 rounded mb-3" />
      <div className="h-6 w-64 bg-white/5 rounded mb-6" />
      <div className="grid grid-cols-12 gap-4 lg:gap-6">
        <div className="col-span-12 h-48 bg-white/[0.04] rounded-3xl" />
        <div className="col-span-12 lg:col-span-6 h-48 bg-white/[0.04] rounded-3xl" />
        <div className="col-span-12 lg:col-span-6 h-48 bg-white/[0.04] rounded-3xl" />
      </div>
    </div>
  )
}

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

function RedirectIfAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<RedirectIfAuth><Landing /></RedirectIfAuth>} />
      <Route path="/login" element={<RedirectIfAuth><Login /></RedirectIfAuth>} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/choose-category" element={<ChooseCategory />} />
      <Route path="/choose-plan" element={<ChoosePlan />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/invite/:token" element={<InviteAccept />} />
      <Route path="/share/:token" element={<SharedAnalysis />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />

        {/* Insights drill-down pages (Pulse / Action / Forensics / Anatomy / Creators).
            Each rewrites the corresponding old Tier section as a dedicated page so
            widgets get col-6 / col-12 room instead of being cramped into a 3-4 col grid. */}
        <Route
          path="pulse"
          element={
            <Suspense fallback={<InsightsPageFallback />}>
              <InsightsPulse />
            </Suspense>
          }
        />
        <Route
          path="action"
          element={
            <Suspense fallback={<InsightsPageFallback />}>
              <InsightsAction />
            </Suspense>
          }
        />
        <Route
          path="forensics"
          element={
            <Suspense fallback={<InsightsPageFallback />}>
              <InsightsForensics />
            </Suspense>
          }
        />
        <Route
          path="anatomy"
          element={
            <Suspense fallback={<InsightsPageFallback />}>
              <InsightsAnatomy />
            </Suspense>
          }
        />
        <Route
          path="creators"
          element={
            <Suspense fallback={<InsightsPageFallback />}>
              <InsightsCreators />
            </Suspense>
          }
        />

        <Route path="post-mortem" element={<PostMortem />} />
        <Route path="post-mortem/:videoId" element={<PostMortem />} />
        <Route path="outliers" element={<Outliers />} />
        <Route path="greenlight" element={<Greenlight />} />
        <Route path="platforms" element={<Platforms />} />
        <Route path="platforms/posts" element={<PlatformPosts />} />
        <Route path="platforms/posts/new" element={<PlatformPostCreate />} />
        <Route path="platforms/posts/:id" element={<PlatformPostDetail />} />
        <Route path="formats" element={<Formats />} />
        <Route path="formats/:id" element={<FormatDetail />} />
        <Route path="hooks" element={<Hooks />} />
        <Route path="hooks/:id" element={<HookDetail />} />
        <Route path="tactics" element={<Tactics />} />
        <Route path="tactics/:id" element={<TacticDetail />} />
        <Route path="videos" element={<AdminGate><Videos /></AdminGate>} />
        <Route path="analyze" element={<ContentAnalysis />} />
        <Route path="analyze/history" element={<Navigate to="/dashboard/analyze" replace />} />
        <Route path="analyze/:id" element={<AnalysisDetail />} />
        <Route path="mentor" element={<GeneralCoachChat />} />
        <Route path="mentor/:threadId" element={<GeneralCoachChat />} />
        {/* Legacy redirects — keep old links alive */}
        <Route path="chats" element={<Navigate to="/dashboard/mentor" replace />} />
        <Route path="coach-chat" element={<Navigate to="/dashboard/mentor" replace />} />
        <Route path="influencers" element={<FeatureGate><Influencers /></FeatureGate>} />
        <Route path="influencers/:id" element={<FeatureGate><InfluencerDetail /></FeatureGate>} />
        <Route path="discovery" element={<AdminGate><Discovery /></AdminGate>} />
        <Route path="discovery/hashtags" element={<AdminGate><TrackedHashtags /></AdminGate>} />
        <Route path="discovery/items" element={<AdminGate><DiscoveredItems /></AdminGate>} />
        <Route path="discovery/settings" element={<AdminGate><DiscoverySettings /></AdminGate>} />
        <Route path="trends" element={<Trends />} />
        <Route path="trends/posts" element={<TrendingPosts />} />
        <Route path="trends/formats" element={<TrendingFormats />} />
        <Route path="trends/hooks" element={<TrendingHooks />} />
        <Route path="trends/contents" element={<TrendingContents />} />
        <Route path="trends/songs" element={<TrendingSongs />} />
        <Route path="trends/topics-detail" element={<FeatureGate><TrendingTopicDetail /></FeatureGate>} />
        <Route path="trending" element={<Navigate to="/dashboard/trends" replace />} />
        <Route path="suggestions" element={<Suggestions />} />
        <Route path="suggestions/:id" element={<SuggestionDetail />} />
        <Route path="settings" element={<Navigate to="/dashboard/account/billing" replace />} />
        <Route path="account" element={<AccountLayout />}>
          <Route index element={<AccountProfile />} />
          <Route path="preferences" element={<AccountPreferences />} />
          <Route path="security" element={<AccountSecurity />} />
          <Route path="integrations" element={<AccountIntegrations />} />
          <Route path="organization" element={<AccountOrganization />} />
          <Route path="api" element={<AccountApiKeys />} />
          <Route path="mcp" element={<AccountMcp />} />
          <Route path="billing" element={<AccountBilling />} />
        </Route>
        <Route path="subscription-plans" element={<AdminGate><SubscriptionPlans /></AdminGate>} />
        <Route path="users" element={<AdminGate><Users /></AdminGate>} />
        <Route path="content-analytics" element={<AdminGate><ContentAnalyticsDashboard /></AdminGate>} />
        <Route path="domain-management" element={<AdminGate><ContentManagement /></AdminGate>} />
        <Route path="domain-management/:id" element={<AdminGate><ContentManagementDetail /></AdminGate>} />
        <Route path="content-management" element={<Navigate to="/dashboard/domain-management" replace />} />
        <Route path="content-management/:id" element={<Navigate to="/dashboard/domain-management" replace />} />
        <Route path="categories" element={<AdminGate><Categories /></AdminGate>} />
        <Route path="categories/orphans" element={<AdminGate><OrphanVideos /></AdminGate>} />
        <Route path="categories/orphan-domains" element={<AdminGate><OrphanDomains /></AdminGate>} />
        <Route path="categories/:id" element={<CategoryDetail />} />
        <Route path="categories/:id/domains" element={<AdminGate><CategoryDomains /></AdminGate>} />
        <Route path="support" element={<Support />} />
        <Route path="support-management" element={<AdminGate><SupportManagement /></AdminGate>} />
        <Route path="bulk-management" element={<AdminGate><BulkAnalysisManagement /></AdminGate>} />
        <Route path="duplicate-management" element={<AdminGate><DuplicateManagement /></AdminGate>} />
        <Route path="onboarding-management" element={<AdminGate><OnboardingManagement /></AdminGate>} />
        <Route path="category-requests" element={<AdminGate><CategoryRequestManagement /></AdminGate>} />
        <Route path="ai-model-lab" element={<AdminGate><AIModelLab /></AdminGate>} />
        <Route path="songs" element={<AdminGate><Songs /></AdminGate>} />
        <Route path="hashtags" element={<AdminGate><Hashtags /></AdminGate>} />
        <Route path="site-analytics" element={<AdminGate><SiteAnalytics /></AdminGate>} />
        <Route path="carousel-posts" element={<AdminGate><CarouselPosts /></AdminGate>} />
        <Route
          path="admin/keyword-blacklist"
          element={
            <Suspense fallback={<InsightsPageFallback />}>
              <KeywordBlacklistAdmin />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  )
}

export default App
