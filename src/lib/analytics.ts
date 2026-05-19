/**
 * Blossom Site Analytics Tracker
 *
 * Lightweight client-side tracker for anonymous user behavior analysis.
 * Manages sessions, page views, scroll depth, events, and pricing interactions.
 * All data is sent to /api/sa/* endpoints.
 *
 * Also hosts the AI-referrer detection helpers (see bottom of file). The
 * marketing Astro site mirrors that logic in
 * `marketing/src/layouts/BaseLayout.astro` — keep both lists of AI hostnames
 * in sync when adding/removing sources.
 */

import { API_URL, authFetch } from './api'

const SESSION_KEY = 'blsm_analytics_session'
const SESSION_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes

// ── GA4 gtag typing ──────────────────────────────────────────────
// Loose typing for the global gtag() function injected by the GA4 snippet
// in `frontend/index.html`. The SDK passes arbitrary positional args, so we
// model it as a variadic any-tuple function. The optional chaining at the
// call site protects us when gtag hasn't loaded yet (ad blockers, slow
// network, server-side render).
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

interface SessionInfo {
  sessionToken: string
  sessionId: number | null
  visitorId: number | null
  startedAt: number
  lastActivity: number
}

let currentSession: SessionInfo | null = null
let currentPageviewId: number | null = null
let currentPagePath: string | null = null
let maxScrollDepth = 0
let scrollThrottleTimer: ReturnType<typeof setTimeout> | null = null
let eventQueue: any[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null
let initialized = false
let isLocalDev = false

// ── Helpers ──────────────────────────────────────────────────────

function generateToken(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function getUTMParams(): Record<string, string> {
  const params = new URLSearchParams(window.location.search)
  const utm: Record<string, string> = {}
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) {
    const val = params.get(key)
    if (val) {
      // utm_source → utmSource
      const camelKey = 'utm' + key.charAt(4).toUpperCase() + key.slice(5)
      utm[camelKey] = val
    }
  }
  return utm
}

function getDeviceInfo() {
  return {
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
  }
}

function isBot(): boolean {
  const ua = navigator.userAgent
  return /bot|crawl|spider|slurp|googlebot|bingbot|yandex|baidu|duckduck/i.test(ua)
}

async function sendBeacon(path: string, data: any): Promise<void> {
  const url = `${API_URL}/api/sa${path}`
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
      navigator.sendBeacon(url, blob)
    } else {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true,
      }).catch(() => {})
    }
  } catch {
    // Silently fail — analytics should never break the app
  }
}

async function post(path: string, data: any): Promise<any> {
  try {
    const res = await fetch(`${API_URL}/api/sa${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

// ── Session Management ───────────────────────────────────────────

function loadSession(): SessionInfo | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as SessionInfo
    // Session expired?
    if (Date.now() - data.lastActivity > SESSION_TIMEOUT_MS) {
      sessionStorage.removeItem(SESSION_KEY)
      return null
    }
    return data
  } catch {
    return null
  }
}

function saveSession(session: SessionInfo): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    // sessionStorage full or disabled
  }
}

function touchSession(): void {
  if (currentSession) {
    currentSession.lastActivity = Date.now()
    saveSession(currentSession)
  }
}

// ── Init ─────────────────────────────────────────────────────────

export async function initAnalytics(): Promise<void> {
  if (initialized) return
  initialized = true

  // Skip bots and localhost development
  if (isBot()) return
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    isLocalDev = true
    return
  }

  // Try to resume existing session
  const existing = loadSession()
  if (existing) {
    currentSession = existing
    touchSession()

    // Re-validate with backend
    const result = await post('/session', {
      sessionToken: existing.sessionToken,
      landingPage: window.location.pathname,
    })

    if (result?.sessionId) {
      currentSession!.sessionId = result.sessionId
      currentSession!.visitorId = result.visitorId
      saveSession(currentSession!)
    }
    return
  }

  // New session
  const sessionToken = generateToken()
  const utmParams = getUTMParams()
  const deviceInfo = getDeviceInfo()

  currentSession = {
    sessionToken,
    sessionId: null,
    visitorId: null,
    startedAt: Date.now(),
    lastActivity: Date.now(),
  }

  const result = await post('/session', {
    sessionToken,
    landingPage: window.location.pathname,
    landingVariant: 'default',
    referrer: document.referrer || undefined,
    utmSource: utmParams.utmSource,
    utmMedium: utmParams.utmMedium,
    utmCampaign: utmParams.utmCampaign,
    utmTerm: utmParams.utmTerm,
    utmContent: utmParams.utmContent,
    ...deviceInfo,
  })

  if (result?.sessionId) {
    currentSession.sessionId = result.sessionId
    currentSession.visitorId = result.visitorId
    saveSession(currentSession)
  } else if (result?.ignored) {
    // Server says localhost — disable
    isLocalDev = true
    initialized = false
    return
  }

  // Set up lifecycle handlers
  setupLifecycleHandlers()
}

function setupLifecycleHandlers(): void {
  // End session on page unload
  window.addEventListener('beforeunload', () => {
    flushEvents()
    updateCurrentPageview()
    if (currentSession?.sessionToken) {
      sendBeacon('/end', { sessionToken: currentSession.sessionToken })
    }
  })

  // Handle tab visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushEvents()
      updateCurrentPageview()
    } else {
      touchSession()
    }
  })
}

// ── Page Views ───────────────────────────────────────────────────

export async function trackPageView(path: string, title?: string): Promise<void> {
  if (isLocalDev || !currentSession?.sessionToken) return

  // Don't double-track the same page
  if (path === currentPagePath) return

  // Update previous pageview's scroll depth before leaving
  updateCurrentPageview()

  const previousPage = currentPagePath
  currentPagePath = path
  maxScrollDepth = 0
  firedMilestones.clear()

  touchSession()

  const result = await post('/pageview', {
    sessionToken: currentSession.sessionToken,
    pagePath: path,
    pageTitle: title || document.title,
    referrerPage: previousPage,
  })

  if (result?.pageviewId) {
    currentPageviewId = result.pageviewId
  }
}

function updateCurrentPageview(): void {
  if (!currentPageviewId || isLocalDev || !currentSession?.sessionToken) return
  sendBeacon('/pageview/update', {
    pageviewId: currentPageviewId,
    scrollDepthPercent: maxScrollDepth,
    sessionToken: currentSession.sessionToken,
  })
}

// ── Scroll Tracking ──────────────────────────────────────────────

const firedMilestones = new Set<number>()

export function trackScroll(): void {
  if (isLocalDev) return

  const scrollTop = window.scrollY || document.documentElement.scrollTop
  const docHeight = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.offsetHeight
  )
  const winHeight = window.innerHeight
  const scrollPercent = Math.min(100, Math.round((scrollTop / Math.max(docHeight - winHeight, 1)) * 100))

  if (scrollPercent > maxScrollDepth) {
    const prevDepth = maxScrollDepth
    maxScrollDepth = scrollPercent

    // Track scroll milestones as events (fire once per page)
    const milestones = [25, 50, 75, 100]
    for (const milestone of milestones) {
      if (scrollPercent >= milestone && prevDepth < milestone && !firedMilestones.has(milestone)) {
        firedMilestones.add(milestone)
        queueEvent({
          type: 'event',
          eventName: `scroll_${milestone}`,
          eventCategory: 'engagement',
          pagePath: currentPagePath || window.location.pathname,
        })
      }
    }
  }
}

export function setupScrollTracking(): () => void {
  const handler = () => {
    if (scrollThrottleTimer) return
    scrollThrottleTimer = setTimeout(() => {
      trackScroll()
      scrollThrottleTimer = null
    }, 250)
  }
  window.addEventListener('scroll', handler, { passive: true })
  return () => {
    window.removeEventListener('scroll', handler)
    if (scrollThrottleTimer) clearTimeout(scrollThrottleTimer)
  }
}

// ── Event Tracking ───────────────────────────────────────────────

export function trackEvent(
  eventName: string,
  eventCategory: 'interaction' | 'navigation' | 'engagement' | 'conversion',
  eventData?: Record<string, any>
): void {
  if (isLocalDev || !currentSession?.sessionToken) return

  touchSession()

  queueEvent({
    type: 'event',
    eventName,
    eventCategory,
    eventData,
    pagePath: currentPagePath || window.location.pathname,
  })
}

// ── Pricing Tracking ─────────────────────────────────────────────

export function trackPricingView(
  interactionType: 'view' | 'hover' | 'click_cta' | 'compare',
  planSlug?: string,
  planName?: string,
  planPriceCents?: number,
  billingInterval?: string,
  timeSpentSeconds?: number
): void {
  if (isLocalDev || !currentSession?.sessionToken) return

  touchSession()

  queueEvent({
    type: 'pricing',
    pagePath: currentPagePath || window.location.pathname,
    planSlug,
    planName,
    planPriceCents,
    billingInterval,
    interactionType,
    timeSpentSeconds,
  })
}

// ── Conversion Tracking ──────────────────────────────────────────

export async function trackConversion(): Promise<void> {
  if (isLocalDev || !currentSession?.sessionToken) return

  try {
    await authFetch('/api/sa/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionToken: currentSession.sessionToken }),
    })
  } catch {
    // Silently fail — analytics should never break the app
  }
}

// ── Event Queue (batch) ──────────────────────────────────────────

function queueEvent(event: any): void {
  eventQueue.push(event)

  // Flush after 3 seconds or when queue reaches 10 events
  if (eventQueue.length >= 10) {
    flushEvents()
  } else if (!flushTimer) {
    flushTimer = setTimeout(flushEvents, 3000)
  }
}

function flushEvents(): void {
  if (flushTimer) {
    clearTimeout(flushTimer)
    flushTimer = null
  }

  if (eventQueue.length === 0 || !currentSession?.sessionToken) return

  const events = [...eventQueue]
  eventQueue = []

  // Use sendBeacon for reliability during page unload
  sendBeacon('/batch', {
    sessionToken: currentSession.sessionToken,
    events,
  })
}

// ── Public Helpers ───────────────────────────────────────────────

export function getSessionToken(): string | null {
  return currentSession?.sessionToken || null
}

export function isAnalyticsEnabled(): boolean {
  return initialized && !isLocalDev
}

// ── AI Referrer Detection (GA4 `ai_referrer` event) ──────────────
//
// Detects when a visitor lands on Blossom from an AI search/answer surface
// (ChatGPT, Perplexity, Claude, Gemini, etc.) and fires a GA4 custom event
// `ai_referrer` with `{ ai_source, page_path }` so we can measure how much
// traffic LLM citations drive. We dedupe per session (sessionStorage key
// `blossai_ai_ref_fired`) so client-side route changes don't re-fire.
//
// IMPORTANT: This hostname list is mirrored in
// `marketing/src/layouts/BaseLayout.astro`. Update both when changing.
// We use exact-host or strict suffix matching (host === domain OR host
// ends with `.${domain}`) — conservative on purpose, since misattributing
// organic search traffic to AI surfaces would corrupt the metric.

const AI_REFERRER_DOMAINS: ReadonlyArray<{ source: string; host: string }> = [
  { source: 'chatgpt', host: 'chatgpt.com' },
  { source: 'perplexity', host: 'perplexity.ai' },
  { source: 'claude', host: 'claude.ai' },
  { source: 'gemini', host: 'gemini.google.com' },
  { source: 'you', host: 'you.com' },
  { source: 'phind', host: 'phind.com' },
  { source: 'duckassist', host: 'chat.duckduckgo.com' },
  { source: 'copilot', host: 'copilot.microsoft.com' },
]

const AI_REFERRER_SESSION_KEY = 'blossai_ai_ref_fired'

// In-memory fallback: when sessionStorage is unavailable (private browsing
// with strict tracking protection, blocked cookies, ITP edge cases), reads
// and writes throw. Without this fallback, `trackAiReferrerOnce()` would
// re-fire the GA4 event on every call within the same page-load. Keeping
// a module-scoped cache makes the dedupe correct across route changes even
// when storage is off.
let _aiReferrerFiredInMemory: string | null = null

/**
 * Inspect `document.referrer` and return the AI source slug if the referrer
 * host matches one of the known AI surfaces. Returns `null` for direct
 * traffic, unknown referrers, malformed URLs, or non-browser environments.
 *
 * Matching is strict: the referrer host must equal the AI domain exactly
 * or be a subdomain of it (e.g. `gemini.google.com` matches, but
 * `google.com` alone does not — Google web search is not AI traffic).
 */
export function detectAiReferrer(): string | null {
  if (typeof document === 'undefined' || typeof window === 'undefined') return null
  const referrer = document.referrer
  if (!referrer) return null

  let host: string
  try {
    host = new URL(referrer).hostname.toLowerCase()
  } catch {
    return null
  }
  if (!host) return null

  for (const entry of AI_REFERRER_DOMAINS) {
    if (host === entry.host || host.endsWith(`.${entry.host}`)) {
      return entry.source
    }
  }
  return null
}

/**
 * Fire the GA4 `ai_referrer` custom event. No-ops if gtag hasn't loaded
 * (ad blockers, slow CDN, SSR). The `ai_source` parameter must be
 * registered as a custom dimension in GA4 admin for it to appear in
 * reports — see TODO in the Phase 4 status block of the SEO plan.
 */
export function fireAiReferrerEvent(source: string): void {
  if (typeof window === 'undefined') return
  window.gtag?.('event', 'ai_referrer', {
    ai_source: source,
    page_path: window.location.pathname,
  })
}

/**
 * Detect and fire-once-per-session. Idempotent: subsequent calls within
 * the same browser session (or with the same detected source) are no-ops.
 * Safe to invoke on every route change.
 */
export function trackAiReferrerOnce(): void {
  if (typeof window === 'undefined') return
  const source = detectAiReferrer()
  if (!source) return

  // Seed the dedupe check from the in-memory cache first so callers that
  // invoke this on every route change don't re-fire when storage is blocked.
  let alreadyFired: string | null = _aiReferrerFiredInMemory
  try {
    const stored = window.sessionStorage.getItem(AI_REFERRER_SESSION_KEY)
    if (stored) alreadyFired = stored
  } catch {
    // sessionStorage may be unavailable (privacy mode, disabled cookies).
    // Continue with the in-memory cache value.
  }
  if (alreadyFired === source) return

  fireAiReferrerEvent(source)
  _aiReferrerFiredInMemory = source
  try {
    window.sessionStorage.setItem(AI_REFERRER_SESSION_KEY, source)
  } catch {
    // Swallow — the in-memory cache above prevents duplicate fires this session.
  }
}
