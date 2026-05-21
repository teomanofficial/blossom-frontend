/**
 * Greenlight — pre-publish concept validation page at
 * `/dashboard/greenlight`.
 *
 * The page is the Stage 5 N2 flagship. Backend pipeline + the two
 * input components (ConceptInputForm + OutlierPrefillPill) were shipped
 * by the backend half of N2; this file wires up the result panels and
 * the query-param prefill flow.
 *
 * Query params (all optional):
 *   ?fromOutlier=<video_id>     — outlier handoff from /dashboard/outliers.
 *                                 The pill renders above the form and the
 *                                 backend ID is passed as `source_outlier_id`.
 *   ?seed=<keyword>             — from WhitespaceKeywords. Prefills the
 *                                 textarea with "<keyword>: " so the user
 *                                 can continue typing.
 *   ?seed_format=<name>         — from CrossNicheImports. Prefills the
 *                                 "Planned format" field in the advanced
 *                                 section of the form.
 *   ?suggestion_id=<id>         — from NextPostsRanked. Fetches the saved
 *                                 suggestion via GET /api/analysis/suggestions/:id
 *                                 and prefills title+description (concept),
 *                                 suggested_hook, format_name, suggested_tactics.
 *
 * Loading sequence: while the POST is in flight we cycle progress copy
 * every 2s so the user knows the pipeline is working.
 *
 * Result panels are each wrapped in WidgetErrorBoundary so a single bad
 * payload doesn't blank the whole page.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { authFetch } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useInsights } from '../lib/useInsights'
import type { GreenlightResponse, OutlierVideo } from '../types/insights'

import WidgetErrorBoundary from '../components/insights/WidgetErrorBoundary'
import LockedWidget from '../components/insights/shared/LockedWidget'
import {
  ConceptInputForm,
  ComparableWinners,
  EMPTY_CONCEPT_VALUE,
  MissingTacticsPanel,
  OutlierPrefillPill,
  PredictedRetentionPreview,
  ScoreBreakdown,
  SwapRecommendations,
  VerdictBanner,
  toGreenlightRequest,
  type ConceptFormValue,
} from '../components/greenlight'

// ---------------------------------------------------------------------------
// Outlier prefill — fetch the source outlier so the pill can render
// ---------------------------------------------------------------------------

interface OutlierFeedResponse {
  outliers: OutlierVideo[]
}

/**
 * Resolves the `?fromOutlier=<id>` query param to an OutlierVideo by
 * searching the existing tier1/outliers feed. The feed is already
 * heavily cached by useInsights (5min TTL) so this is essentially free
 * when the user navigates from /dashboard/outliers.
 *
 * If the outlier isn't in the cached feed (e.g. fell out of the window)
 * we still pass the id to the backend as `source_outlier_id` — the
 * backend handles that case gracefully — but the pill won't render.
 */
function useOutlierPrefill(outlierId: string | null): {
  outlier: OutlierVideo | null
} {
  const { data } = useInsights<OutlierFeedResponse>('tier1/outliers?limit=50', {
    enabled: Boolean(outlierId),
  })
  const outlier = useMemo(() => {
    if (!outlierId || !data?.outliers) return null
    return data.outliers.find((o) => o.video_id === outlierId) ?? null
  }, [outlierId, data])
  return { outlier }
}

// ---------------------------------------------------------------------------
// Suggestion prefill — fetch a saved suggestion and shape into concept fields
// ---------------------------------------------------------------------------

interface SuggestionDetail {
  id: number | string
  title?: string | null
  description?: string | null
  suggested_hook?: string | null
  format_name?: string | null
  suggested_tactics?: string[] | null
  keyword_name?: string | null
}

/**
 * Map a SuggestionDetail into the ConceptFormValue. The textarea gets
 * "title + description" so the user has a thick brief to edit; the
 * hook + format slots are populated when present; suggested_tactics
 * are concatenated into the concept body so the AI sees them in the
 * eventual classification pass.
 */
function suggestionToFormValue(s: SuggestionDetail): ConceptFormValue {
  const titlePart = (s.title || '').trim()
  const descriptionPart = (s.description || '').trim()
  const tactics = Array.isArray(s.suggested_tactics) ? s.suggested_tactics.filter(Boolean) : []
  const tacticsLine = tactics.length > 0 ? `\n\nTactics to use: ${tactics.join(', ')}.` : ''
  const concept = [titlePart, descriptionPart].filter(Boolean).join('\n\n') + tacticsLine
  return {
    ...EMPTY_CONCEPT_VALUE,
    concept_description: concept.trim(),
    hook_text: (s.suggested_hook || '').trim(),
    planned_format: (s.format_name || '').trim(),
    niche: '',
  }
}

// ---------------------------------------------------------------------------
// Loading progress copy
// ---------------------------------------------------------------------------

const PROGRESS_STEPS: ReadonlyArray<string> = [
  'Analyzing hook strength…',
  'Checking niche fit…',
  'Predicting retention…',
  'Finding comparable winners…',
  'Composing verdict…',
]

function useLoadingProgress(loading: boolean): string {
  const [step, setStep] = useState<string>(PROGRESS_STEPS[0]!)
  useEffect(() => {
    if (!loading) {
      setStep(PROGRESS_STEPS[0]!)
      return
    }
    let i = 0
    setStep(PROGRESS_STEPS[i]!)
    const handle = window.setInterval(() => {
      i = (i + 1) % PROGRESS_STEPS.length
      setStep(PROGRESS_STEPS[i]!)
    }, 2000)
    return () => window.clearInterval(handle)
  }, [loading])
  return step
}

function LoadingPanel({ message }: { message: string }) {
  return (
    <section className="glass-card rounded-3xl p-8 sm:p-12 flex flex-col items-center text-center">
      <div className="relative w-16 h-16 mb-5">
        <div className="absolute inset-0 rounded-full bg-pink-500/15 animate-ping" />
        <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-pink-500/30 to-purple-500/30 border border-pink-500/40 flex items-center justify-center">
          <i className="fas fa-circle-notch fa-spin text-pink-200 text-xl" />
        </div>
      </div>
      <h2 className="text-base sm:text-lg font-bold text-slate-200 mb-1">
        Evaluating your concept
      </h2>
      <p
        className="text-xs sm:text-sm text-slate-400 max-w-md leading-relaxed transition-opacity duration-300"
        aria-live="polite"
      >
        {message}
      </p>
      <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-600">
        Usually finishes in 5-10 seconds
      </p>
    </section>
  )
}

function ErrorPanel({ error, onRetry }: { error: string; onRetry: () => void }) {
  // 429-shaped quota errors get a custom CTA so users understand why
  // they're blocked — the rest get a generic retry button.
  const isQuota = /quota|429|limit/i.test(error)
  return (
    <section
      role="alert"
      className="rounded-3xl bg-rose-500/10 border border-rose-500/25 p-6 sm:p-8 text-center"
    >
      <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-rose-500/20 flex items-center justify-center">
        <i className="fas fa-triangle-exclamation text-rose-300 text-lg" />
      </div>
      <h3 className="text-sm sm:text-base font-bold text-white mb-1">
        {isQuota ? 'Monthly quota reached' : 'Greenlight evaluation failed'}
      </h3>
      <p className="text-xs sm:text-sm text-rose-100/80 max-w-md mx-auto leading-relaxed mb-5">
        {error}
      </p>
      {isQuota ? (
        <Link
          to="/dashboard/account/billing"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-black uppercase tracking-widest hover:-translate-y-px transition-transform"
        >
          <i className="fas fa-rocket text-[10px]" />
          Upgrade to Platin
        </Link>
      ) : (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-black uppercase tracking-widest text-slate-200 transition-colors"
        >
          <i className="fas fa-rotate-right text-[10px]" />
          Try again
        </button>
      )}
    </section>
  )
}

function PageHeader() {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-white transition-colors"
        >
          <i className="fas fa-arrow-left text-[10px]" />
          Back to dashboard
        </Link>
      </div>
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
            <span className="gradient-text font-display">Greenlight Studio</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-medium tracking-wide uppercase mt-1">
            Validate the concept before you film it. Get a verdict, score, and concrete swaps.
          </p>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Result rendering — composed under WidgetErrorBoundary
// ---------------------------------------------------------------------------

function ResultsSection({
  response,
  onReroll,
  loading,
}: {
  response: GreenlightResponse
  onReroll: () => void
  loading: boolean
}) {
  return (
    <div className="space-y-5">
      <WidgetErrorBoundary name="VerdictBanner">
        <VerdictBanner response={response} />
      </WidgetErrorBoundary>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <WidgetErrorBoundary name="ScoreBreakdown">
          <ScoreBreakdown response={response} />
        </WidgetErrorBoundary>
        <WidgetErrorBoundary name="MissingTacticsPanel">
          <MissingTacticsPanel missing={response.missing_gold_standard_tactics} />
        </WidgetErrorBoundary>
      </div>

      <WidgetErrorBoundary name="SwapRecommendations">
        <SwapRecommendations
          swaps={response.swap_recommendations}
          onReroll={onReroll}
          loading={loading}
        />
      </WidgetErrorBoundary>

      <WidgetErrorBoundary name="PredictedRetentionPreview">
        <PredictedRetentionPreview retention={response.retention_prediction} />
      </WidgetErrorBoundary>

      <WidgetErrorBoundary name="ComparableWinners">
        <ComparableWinners winners={response.comparable_winners} />
      </WidgetErrorBoundary>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function GreenlightLockedPage() {
  return (
    <div>
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-white transition-colors mb-6"
      >
        <i className="fas fa-arrow-left text-[10px]" />
        Back to dashboard
      </Link>
      <LockedWidget
        requiredPlan="premium"
        tier="flagship"
        widgetTitle="Greenlight Studio"
        variant="page"
      />
    </div>
  )
}

export default function Greenlight() {
  const { planSlug, userType, loading: authLoading } = useAuth()
  // Free-tier hard gate — render a full-page LockedWidget instead of
  // letting them see the empty input + results scaffold. Greenlight
  // isn't behind App.tsx's FeatureGate, so we gate here.
  const isAdmin = userType === 'admin'
  const hasFlagshipAccess =
    isAdmin || planSlug === 'premium' || planSlug === 'platin'
  if (!authLoading && !hasFlagshipAccess) {
    return <GreenlightLockedPage />
  }
  return <GreenlightInner />
}

function GreenlightInner() {
  const [searchParams, setSearchParams] = useSearchParams()

  // Read all four query params on mount; React re-renders on
  // setSearchParams so we get fresh values per render.
  const outlierIdParam = (searchParams.get('fromOutlier') || '').trim() || null
  const seedKeyword = (searchParams.get('seed') || '').trim()
  const seedFormat = (searchParams.get('seed_format') || '').trim()
  const suggestionIdParam = (searchParams.get('suggestion_id') || '').trim() || null

  // Form state
  const [value, setValue] = useState<ConceptFormValue>(EMPTY_CONCEPT_VALUE)
  const [hasPrefilled, setHasPrefilled] = useState({
    outlier: false,
    seed: false,
    seedFormat: false,
    suggestion: false,
  })

  // Submission state
  const [response, setResponse] = useState<GreenlightResponse | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Outlier prefill resolution (for pill rendering)
  const { outlier } = useOutlierPrefill(outlierIdParam)

  // --- Keyword seed prefill ("?seed=<keyword>") -----------------------------
  useEffect(() => {
    if (!seedKeyword || hasPrefilled.seed) return
    setValue((prev) => {
      // Only prefill when the textarea is otherwise empty so we don't
      // clobber an in-flight edit.
      if (prev.concept_description.trim().length > 0) return prev
      return { ...prev, concept_description: `${seedKeyword}: ` }
    })
    setHasPrefilled((s) => ({ ...s, seed: true }))
  }, [seedKeyword, hasPrefilled.seed])

  // --- Format seed prefill ("?seed_format=<name>") --------------------------
  useEffect(() => {
    if (!seedFormat || hasPrefilled.seedFormat) return
    setValue((prev) => {
      if (prev.planned_format.trim().length > 0) return prev
      return { ...prev, planned_format: seedFormat }
    })
    setHasPrefilled((s) => ({ ...s, seedFormat: true }))
  }, [seedFormat, hasPrefilled.seedFormat])

  // --- Suggestion prefill ("?suggestion_id=<id>") ---------------------------
  useEffect(() => {
    if (!suggestionIdParam || hasPrefilled.suggestion) return
    let cancelled = false
    async function loadSuggestion() {
      try {
        const res = await authFetch(
          `/api/analysis/suggestions/${encodeURIComponent(suggestionIdParam!)}`,
        )
        if (!res.ok) {
          // Don't toast — the prefill is best-effort. Just mark as
          // attempted so we don't loop.
          if (!cancelled) setHasPrefilled((s) => ({ ...s, suggestion: true }))
          return
        }
        const data = (await res.json()) as SuggestionDetail
        if (cancelled) return
        const next = suggestionToFormValue(data)
        // Only apply when the form is empty so manual edits aren't blown away.
        setValue((prev) => {
          if (
            prev.concept_description.trim().length > 0 ||
            prev.hook_text.trim().length > 0 ||
            prev.planned_format.trim().length > 0
          ) {
            return prev
          }
          return next
        })
        setHasPrefilled((s) => ({ ...s, suggestion: true }))
      } catch {
        if (!cancelled) setHasPrefilled((s) => ({ ...s, suggestion: true }))
      }
    }
    loadSuggestion()
    return () => {
      cancelled = true
    }
  }, [suggestionIdParam, hasPrefilled.suggestion])

  // --- Outlier prefill — track that we received an outlier so the form
  //     can use the placeholder copy + UX state ---------------------------
  const prefillingFromOutlier = Boolean(outlierIdParam)
  const outlierUsername = outlier?.influencer.username

  // --- Submit / Re-roll -----------------------------------------------------

  const submit = useCallback(
    async (formValue: ConceptFormValue, sourceOutlierId: string | null) => {
      // Abort any in-flight request so re-clicks don't pile up.
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setError(null)
      setSubmitting(true)
      setResponse(null)

      try {
        const requestBody = toGreenlightRequest(formValue, sourceOutlierId)
        const res = await authFetch('/api/insights/greenlight', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        })
        if (!res.ok) {
          let message = `Evaluation failed (HTTP ${res.status}).`
          try {
            const j = await res.json()
            if (j?.message) message = String(j.message)
            else if (j?.error) message = String(j.error)
          } catch {
            // body wasn't JSON — fall back to status text
            if (res.statusText) message = res.statusText
          }
          if (!controller.signal.aborted) {
            setError(message)
          }
          return
        }
        const json = (await res.json()) as GreenlightResponse
        if (!controller.signal.aborted) setResponse(json)
      } catch (err: any) {
        if (controller.signal.aborted) return
        setError(err?.message || 'Network error while evaluating concept.')
      } finally {
        if (!controller.signal.aborted) setSubmitting(false)
      }
    },
    [],
  )

  const handleSubmit = useCallback(() => {
    submit(value, outlierIdParam)
  }, [submit, value, outlierIdParam])

  /**
   * Build the merged-swaps concept text. We splice each swap_to in place
   * of its swap_from (case-insensitive, first occurrence). If the
   * swap_from string can't be found, we append the swap_to as a new
   * sentence so the user still benefits from the suggestion.
   */
  const handleReroll = useCallback(() => {
    if (!response) return
    let next = value.concept_description
    const appended: string[] = []
    for (const swap of response.swap_recommendations) {
      const from = swap.swap_from
      const to = swap.swap_to
      if (!from || !to) continue
      const lowerNext = next.toLowerCase()
      const lowerFrom = from.toLowerCase()
      const idx = lowerNext.indexOf(lowerFrom)
      if (idx >= 0) {
        next = next.slice(0, idx) + to + next.slice(idx + from.length)
      } else {
        appended.push(to)
      }
    }
    if (appended.length > 0) {
      next = `${next.trim()}\n\n${appended.join(' ')}`.trim()
    }
    const nextValue: ConceptFormValue = {
      ...value,
      concept_description: next,
    }
    setValue(nextValue)
    submit(nextValue, outlierIdParam)
  }, [response, value, submit, outlierIdParam])

  const handleClearOutlier = useCallback(() => {
    const next = new URLSearchParams(searchParams)
    next.delete('fromOutlier')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  const progressMessage = useLoadingProgress(submitting)

  // Abort the request when the component unmounts so the user doesn't
  // briefly see a stale spinner after navigating away.
  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  return (
    <div>
      <PageHeader />

      {prefillingFromOutlier && outlier ? (
        <OutlierPrefillPill
          outlier={{
            video_id: outlier.video_id,
            multiple: outlier.multiple,
            hook_class: outlier.hook_class,
            format_class: outlier.format_class,
            thumbnail_url: outlier.thumbnail_url,
            username: outlier.influencer.username,
          }}
          onClear={handleClearOutlier}
        />
      ) : null}

      <ConceptInputForm
        value={value}
        onChange={setValue}
        onSubmit={handleSubmit}
        loading={submitting}
        prefillingFromOutlier={prefillingFromOutlier}
        outlierUsername={outlierUsername}
      />

      {submitting ? (
        <div className="mt-5">
          <LoadingPanel message={progressMessage} />
        </div>
      ) : null}

      {error && !submitting ? (
        <div className="mt-5">
          <ErrorPanel error={error} onRetry={handleSubmit} />
        </div>
      ) : null}

      {response && !submitting && !error ? (
        <div className="mt-6">
          <ResultsSection
            response={response}
            onReroll={handleReroll}
            loading={submitting}
          />
        </div>
      ) : null}
    </div>
  )
}
