import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import {
  initAnalytics,
  trackPageView,
  setupScrollTracking,
  trackEvent,
  trackPricingView,
} from '../lib/analytics'

/**
 * AnalyticsProvider — wraps the app and automatically tracks:
 * - Session initialization
 * - Page views on route changes
 * - Scroll depth on every page
 * - Pricing section visibility (IntersectionObserver)
 * - CTA clicks, feature section views, signup/login clicks
 *
 * Must be placed inside <BrowserRouter> but outside <AuthProvider>
 * so it works for anonymous users.
 */
export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const initialized = useRef(false)
  const prevPath = useRef<string | null>(null)

  // Initialize analytics on mount
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      initAnalytics()
    }
  }, [])

  // Track page views on route changes
  useEffect(() => {
    if (location.pathname !== prevPath.current) {
      prevPath.current = location.pathname
      trackPageView(location.pathname, document.title)
    }
  }, [location.pathname])

  // Set up scroll tracking
  useEffect(() => {
    return setupScrollTracking()
  }, [])

  // Track pricing section visibility on landing page
  useEffect(() => {
    if (location.pathname !== '/' && location.pathname !== '/choose-plan') return

    const pricingObserver = new MutationObserver(() => {
      const pricingSection = document.getElementById('pricing')
      if (pricingSection) {
        pricingObserver.disconnect()
        const observer = new IntersectionObserver(
          (entries) => {
            if (entries[0]?.isIntersecting) {
              trackPricingView('view')
              trackEvent('pricing_section_visible', 'engagement')
              observer.disconnect()
            }
          },
          { threshold: 0.3 }
        )
        observer.observe(pricingSection)
      }
    })

    pricingObserver.observe(document.body, { childList: true, subtree: true })

    // Also check immediately
    const pricingSection = document.getElementById('pricing')
    if (pricingSection) {
      pricingObserver.disconnect()
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            trackPricingView('view')
            trackEvent('pricing_section_visible', 'engagement')
            observer.disconnect()
          }
        },
        { threshold: 0.3 }
      )
      observer.observe(pricingSection)
    }

    return () => pricingObserver.disconnect()
  }, [location.pathname])

  // Track feature section visibility on landing page
  useEffect(() => {
    if (location.pathname !== '/') return

    const sectionIds = ['results', 'pricing', 'influence']
    const observers: IntersectionObserver[] = []

    const timer = setTimeout(() => {
      for (const id of sectionIds) {
        const el = document.getElementById(id)
        if (!el) continue
        const observer = new IntersectionObserver(
          (entries) => {
            if (entries[0]?.isIntersecting) {
              trackEvent(`section_visible_${id}`, 'engagement')
              observer.disconnect()
            }
          },
          { threshold: 0.2 }
        )
        observer.observe(el)
        observers.push(observer)
      }
    }, 500)

    return () => {
      clearTimeout(timer)
      observers.forEach((o) => o.disconnect())
    }
  }, [location.pathname])

  // Global click tracking for CTAs and navigation
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a[href]') as HTMLAnchorElement | null
      const button = target.closest('button') as HTMLButtonElement | null

      if (link) {
        const href = link.getAttribute('href') || ''

        // Track signup CTA clicks
        if (href === '/signup') {
          trackEvent('cta_signup_click', 'conversion', {
            text: link.textContent?.trim().slice(0, 50),
            page: location.pathname,
          })
        }

        // Track login clicks
        if (href === '/login') {
          trackEvent('cta_login_click', 'conversion', {
            page: location.pathname,
          })
        }

        // Track pricing plan CTA clicks
        if (href === '/signup' && target.closest('[class*="pricing"], section#pricing')) {
          const planCard = target.closest('[class*="glass-card"]')
          const planName = planCard?.querySelector('h3')?.textContent
          if (planName) {
            trackPricingView('click_cta', undefined, planName)
          }
        }
      }

      if (button) {
        const text = button.textContent?.trim() || ''

        // Track "Start Free Trial" or subscription buttons
        if (text.includes('Start Free Trial') || text.includes('Subscribe') || text.includes('Opening checkout')) {
          const planCard = button.closest('[class*="glass-card"]')
          const planName = planCard?.querySelector('h3')?.textContent
          const priceEl = planCard?.querySelector('[class*="text-5xl"]')
          const price = priceEl?.textContent

          trackEvent('plan_subscribe_click', 'conversion', {
            planName,
            price,
            page: location.pathname,
          })

          if (planName) {
            trackPricingView('click_cta', undefined, planName)
          }
        }

        // Track "Get Viral Now" hero CTA
        if (text.includes('Get Viral Now')) {
          trackEvent('hero_cta_click', 'conversion', { page: location.pathname })
        }

        // Track "Claim Your Spot" final CTA
        if (text.includes('Claim Your Spot')) {
          trackEvent('final_cta_click', 'conversion', { page: location.pathname })
        }
      }
    }

    document.addEventListener('click', handler, { capture: true })
    return () => document.removeEventListener('click', handler, { capture: true })
  }, [location.pathname])

  return <>{children}</>
}
