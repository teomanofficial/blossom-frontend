import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authFetch } from '../lib/api'
import { getSocket } from '../lib/socket'
import { useAuth } from '../context/AuthContext'
import { useUpgrade } from '../context/UpgradeContext'
import WizardSteps, { stepFromStatus, type WizardStep } from '../components/scripts/WizardSteps'
import PipelineStepper, { type StepState } from '../components/scripts/PipelineStepper'
import HookCard from '../components/scripts/HookCard'
import ResearchView from '../components/scripts/ResearchView'
import PersonaPanel from '../components/scripts/PersonaPanel'
import SourceVideoCard from '../components/scripts/SourceVideoCard'
import VersionHistory from '../components/scripts/VersionHistory'
import ScriptTitleMenu from '../components/scripts/ScriptTitleMenu'
import DisabledUpsellButton from '../components/upsell/DisabledUpsellButton'
import { estimateDurationSeconds, formatDuration } from '../components/scripts/format'
import type {
  ResearchJson,
  ScriptHook,
  ScriptRecord,
  ScriptStatus,
  ScriptStatusResponse,
  ScriptStudioEntryState,
  SourceVideoContext,
} from '../types/scripts'

/** Async pipeline phases shown in the vertical progress stepper. */
type BusyPhase = 'research' | 'hooks' | 'script'

const PIPELINE_STEPS = [
  { key: 'research', label: 'Researching your topic', subtitle: 'Mining outliers & engagement angles...' },
  { key: 'hooks', label: 'Crafting outlier-modeled hooks', subtitle: 'Modeling 6 hooks on real breakout videos...' },
  { key: 'script', label: 'Writing your script', subtitle: 'Generating a spoken-word script...' },
]

const PHASE_INDEX: Record<BusyPhase, number> = { research: 0, hooks: 1, script: 2 }

export default function ScriptStudio() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const entry = (location.state ?? null) as ScriptStudioEntryState | null
  const sourceVideo = entry?.sourceVideo ?? null
  const { proCredits } = useAuth()
  const { openUpgrade } = useUpgrade()

  const [tab, setTab] = useState<'wizard' | 'persona'>('wizard')
  const [topic, setTopic] = useState(entry?.topic ?? '')
  const [script, setScript] = useState<ScriptRecord | null>(null)
  const [status, setStatus] = useState<ScriptStatus>('topic')
  const [step, setStep] = useState<WizardStep>('topic')
  const [busyPhase, setBusyPhase] = useState<BusyPhase | null>(null)
  const [failedPhase, setFailedPhase] = useState<BusyPhase | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [selectedHookId, setSelectedHookId] = useState<string | null>(null)
  const [appendingHooks, setAppendingHooks] = useState(false)
  const [refineInput, setRefineInput] = useState('')
  const [refining, setRefining] = useState(false)
  // Editing affordances
  const [additionalContext, setAdditionalContext] = useState('')
  const [savingResearch, setSavingResearch] = useState(false)
  const [editingScript, setEditingScript] = useState(false)
  const [scriptDraft, setScriptDraft] = useState('')
  const [savingScript, setSavingScript] = useState(false)
  const [showVersions, setShowVersions] = useState(false)
  // Downstream-stale prompts (shown when an upstream artifact is edited).
  const [hooksStale, setHooksStale] = useState(false)
  const [scriptStale, setScriptStale] = useState(false)

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Guards the one-time up-front create when launched from a source video,
  // so React strict-mode's double effect invocation can't create twice.
  const seedingRef = useRef(false)

  // ── Plan-gate / quota handling ────────────────────────────────────
  // The route is already pro-gated, but the backend is the source of
  // truth: a 403/402/429 means open the upgrade overlay.
  const handlePaywall = useCallback(
    async (res: Response): Promise<boolean> => {
      if (res.status === 403 || res.status === 402 || res.status === 429) {
        openUpgrade('script-studio')
        return true
      }
      return false
    },
    [openUpgrade],
  )

  // ── Polling ───────────────────────────────────────────────────────
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  const loadFull = useCallback((scriptId: string) => {
    authFetch(`/api/analysis/scripts/${scriptId}`)
      .then((res) => (res.ok ? (res.json() as Promise<ScriptRecord>) : null))
      .then((data) => {
        if (!data) return
        setScript(data)
        setStatus(data.status)
        setSelectedHookId(data.selected_hook_id ?? null)
        setAdditionalContext(data.additional_context ?? '')
        setBusyPhase(null)
        setStep(stepFromStatus(data.status))
      })
      .catch((err) => console.error('Failed to load script:', err))
  }, [])

  const startPolling = useCallback(
    (scriptId: string, target: ScriptStatus, phase: BusyPhase) => {
      stopPolling()
      pollingRef.current = setInterval(async () => {
        try {
          const res = await authFetch(`/api/analysis/scripts/${scriptId}/status`)
          if (!res.ok) return
          const data = (await res.json()) as ScriptStatusResponse
          setStatus(data.status)
          if (data.status === target) {
            stopPolling()
            loadFull(scriptId)
          } else if (data.status === 'error') {
            stopPolling()
            setBusyPhase(null)
            setFailedPhase(phase)
            setErrorMessage(data.error_message || 'Something went wrong. Please retry.')
          }
        } catch (err) {
          console.error('Polling error:', err)
        }
      }, 2000)
    },
    [stopPolling, loadFull],
  )

  useEffect(() => () => stopPolling(), [stopPolling])

  // ── Load / resume an existing script ──────────────────────────────
  useEffect(() => {
    if (!id) {
      // Fresh wizard (possibly prefilled from an entry point).
      setScript(null)
      setStatus('topic')
      setStep('topic')
      setBusyPhase(null)
      setErrorMessage(null)
      return
    }
    let cancelled = false
    authFetch(`/api/analysis/scripts/${id}`)
      .then((res) => (res.ok ? (res.json() as Promise<ScriptRecord>) : null))
      .then((data) => {
        if (cancelled) return
        if (!data) {
          setErrorMessage('Could not load this script. It may have been deleted.')
          return
        }
        setScript(data)
        setStatus(data.status)
        setSelectedHookId(data.selected_hook_id ?? null)
        setTopic(data.topic ?? '')
        setAdditionalContext(data.additional_context ?? '')
        setStep(stepFromStatus(data.status))
        if (data.error_message) setErrorMessage(data.error_message)
        // Resume in-flight async phases.
        if (data.status === 'researching') {
          setBusyPhase('research')
          startPolling(id, 'research_ready', 'research')
        } else if (data.status === 'scripting') {
          setBusyPhase('script')
          startPolling(id, 'script_ready', 'script')
        }
      })
      .catch((err) => {
        if (!cancelled) setErrorMessage('Could not load this script. Please try again.')
        console.error('Failed to resume script:', err)
      })
    return () => {
      cancelled = true
    }
  }, [id, startPolling])

  // ── Pre-seed from a source video ──────────────────────────────────
  // Launched from an analyzed video (no id yet): create the script up
  // front so the backend pre-seeds the topic from that video's analysis,
  // then land on /:id and let the resume effect prefill the editable
  // Topic step. The source video's own hook becomes hook candidate #1.
  useEffect(() => {
    if (id || (!entry?.sourceVideoId && !entry?.sourceUploadId) || seedingRef.current) return
    // `seedingRef` (a ref, so it survives StrictMode's double effect invocation)
    // is the sole dedupe guard. We deliberately do NOT gate the result on a
    // per-effect `cancelled` flag: under StrictMode the first run's cleanup
    // would flip it true and the second run is a no-op, so the only successful
    // create would be discarded and the page would never receive its id.
    seedingRef.current = true
    ;(async () => {
      try {
        const res = await authFetch('/api/analysis/scripts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...(entry.sourceUploadId
              ? { sourceUploadId: entry.sourceUploadId }
              : { sourceVideoId: entry.sourceVideoId }),
            ...(entry.topic ? { topic: entry.topic } : {}),
          }),
        })
        if (await handlePaywall(res)) {
          seedingRef.current = false
          return
        }
        if (!res.ok) {
          seedingRef.current = false
          const code = await res
            .json()
            .then((b) => b?.error as string | undefined)
            .catch(() => undefined)
          setErrorMessage(
            code === 'source_upload_not_analyzed' || code === 'source_video_not_analyzed'
              ? "This video hasn't finished analyzing yet. Open it, let the analysis complete, then try again."
              : code === 'source_upload_not_accessible' || code === 'source_video_not_accessible'
                ? 'This video is no longer available to build from.'
                : 'Could not create script. Please try again.',
          )
          return
        }
        const created = (await res.json()) as ScriptRecord
        setScript(created)
        setStatus(created.status)
        setTopic(created.topic ?? entry.topic ?? '')
        setAdditionalContext(created.additional_context ?? '')
        // Land on /:id so refresh/resume works; preserve nav state so the
        // source-video card persists until GET /:id returns source_context.
        navigate(`/dashboard/script-studio/${created.id}`, {
          replace: true,
          state: entry,
        })
      } catch (err) {
        console.error('Source-video seed error:', err)
        seedingRef.current = false
        setErrorMessage('Could not create script. Please try again.')
      }
    })()
  }, [id, entry, handlePaywall, navigate])

  // ── Optional socket for snappier updates (polling is the fallback) ─
  useEffect(() => {
    if (!id) return
    const socket = getSocket()
    socket.emit('join', `script:${id}`)
    const onProgress = (data: { status?: ScriptStatus }) => {
      if (data?.status) setStatus(data.status)
    }
    const onDone = () => loadFull(id)
    const onError = (data: { error_message?: string }) => {
      stopPolling()
      setBusyPhase(null)
      setErrorMessage(data?.error_message || 'Something went wrong. Please retry.')
    }
    socket.on('script:progress', onProgress)
    socket.on('script:done', onDone)
    socket.on('script:error', onError)
    return () => {
      socket.emit('leave', `script:${id}`)
      socket.off('script:progress', onProgress)
      socket.off('script:done', onDone)
      socket.off('script:error', onError)
    }
  }, [id, loadFull, stopPolling])

  // ── Step actions ──────────────────────────────────────────────────
  const startResearch = useCallback(
    async (scriptId: string, addlContext?: string) => {
      setErrorMessage(null)
      setFailedPhase(null)
      setStep('research')
      setBusyPhase('research')
      setStatus('researching')
      try {
        const res = await authFetch(`/api/analysis/scripts/${scriptId}/research`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ additionalContext: addlContext ?? '' }),
        })
        if (await handlePaywall(res)) {
          setBusyPhase(null)
          return
        }
        if (!res.ok) {
          setBusyPhase(null)
          setFailedPhase('research')
          setErrorMessage('Research failed to start. Please retry.')
          return
        }
        startPolling(scriptId, 'research_ready', 'research')
      } catch (err) {
        console.error('startResearch error:', err)
        setBusyPhase(null)
        setFailedPhase('research')
        setErrorMessage('Research failed to start. Please retry.')
      }
    },
    [handlePaywall, startPolling],
  )

  const handleTopicContinue = useCallback(async () => {
    const trimmed = topic.trim()
    if (!trimmed) return
    setSubmitting(true)
    setErrorMessage(null)
    try {
      let scriptId = id
      if (!scriptId) {
        const res = await authFetch('/api/analysis/scripts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: trimmed,
            ...(entry?.sourceUploadId
              ? { sourceUploadId: entry.sourceUploadId }
              : entry?.sourceVideoId
                ? { sourceVideoId: entry.sourceVideoId }
                : {}),
          }),
        })
        if (await handlePaywall(res)) return
        if (!res.ok) {
          setErrorMessage('Could not create script. Please try again.')
          return
        }
        const created = (await res.json()) as ScriptRecord
        scriptId = created.id
        setScript(created)
        navigate(`/dashboard/script-studio/${scriptId}`, { replace: true })
      } else if (trimmed !== (script?.topic ?? '').trim()) {
        // Existing script (e.g. seeded from a source video): persist the
        // tweaked topic before research so the brief reflects the edit.
        try {
          const patchRes = await authFetch(`/api/analysis/scripts/${scriptId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic: trimmed }),
          })
          if (await handlePaywall(patchRes)) return
        } catch (err) {
          // Non-fatal — research falls back to the stored topic.
          console.error('Topic update error:', err)
        }
      }
      await startResearch(scriptId)
    } catch (err) {
      console.error('handleTopicContinue error:', err)
      setErrorMessage('Could not start. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }, [topic, id, entry, script?.topic, handlePaywall, navigate, startResearch])

  // append=false → initial generation (async, polled, replaces the list).
  // append=true  → "Generate more hooks": adds a fresh batch to the existing
  // list. The backend runs this synchronously and returns the updated script,
  // so we just merge it in (no polling — status stays 'hooks_ready' throughout).
  const generateHooks = useCallback(async (append = false) => {
    if (!id) return
    setErrorMessage(null)
    setFailedPhase(null)
    setStep('hooks')
    if (append) setAppendingHooks(true)
    else setBusyPhase('hooks')
    try {
      const res = await authFetch(`/api/analysis/scripts/${id}/hooks`, {
        method: 'POST',
        ...(append
          ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ append: true }) }
          : {}),
      })
      if (await handlePaywall(res)) {
        setBusyPhase(null)
        setAppendingHooks(false)
        return
      }
      if (!res.ok) {
        setBusyPhase(null)
        setAppendingHooks(false)
        setFailedPhase('hooks')
        setErrorMessage('Hook generation failed to start. Please retry.')
        return
      }
      if (append) {
        const updated = (await res.json()) as ScriptRecord
        setScript(updated)
        setAppendingHooks(false)
      } else {
        startPolling(id, 'hooks_ready', 'hooks')
      }
    } catch (err) {
      console.error('generateHooks error:', err)
      setBusyPhase(null)
      setAppendingHooks(false)
      setFailedPhase('hooks')
      setErrorMessage('Hook generation failed to start. Please retry.')
    }
  }, [id, handlePaywall, startPolling])

  const selectHook = useCallback(
    async (hookId: string) => {
      if (!id) return
      setSelectedHookId(hookId) // optimistic
      try {
        const res = await authFetch(`/api/analysis/scripts/${id}/select-hook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hookId }),
        })
        if (await handlePaywall(res)) return
      } catch (err) {
        console.error('selectHook error:', err)
      }
    },
    [id, handlePaywall],
  )

  const editHook = useCallback(
    async (hookId: string, spokenHook: string) => {
      if (!id) return
      // Optimistic local update.
      setScript((prev) =>
        prev?.hooks
          ? {
              ...prev,
              hooks: prev.hooks.map((h) => (h.id === hookId ? { ...h, spoken_hook: spokenHook } : h)),
            }
          : prev,
      )
      // The selected hook changing invalidates an already-generated script.
      if (hookId === selectedHookId && script?.script_text) setScriptStale(true)
      try {
        const res = await authFetch(`/api/analysis/scripts/${id}/hooks/${hookId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ spoken_hook: spokenHook }),
        })
        if (await handlePaywall(res)) return
        if (!res.ok) toast.error('Could not save hook edit')
      } catch (err) {
        console.error('editHook error:', err)
        toast.error('Could not save hook edit')
      }
    },
    [id, selectedHookId, script?.script_text, handlePaywall],
  )

  const deleteHook = useCallback(
    async (hookId: string) => {
      if (!id) return
      const prevHooks = script?.hooks ?? []
      // Optimistic removal.
      setScript((prev) =>
        prev?.hooks ? { ...prev, hooks: prev.hooks.filter((h) => h.id !== hookId) } : prev,
      )
      if (hookId === selectedHookId) setSelectedHookId(null)
      try {
        const res = await authFetch(`/api/analysis/scripts/${id}/hooks/${hookId}`, { method: 'DELETE' })
        if (await handlePaywall(res)) return
        if (!res.ok) {
          // Roll back on failure.
          setScript((prev) => (prev ? { ...prev, hooks: prevHooks } : prev))
          toast.error('Could not delete hook')
        }
      } catch (err) {
        console.error('deleteHook error:', err)
        setScript((prev) => (prev ? { ...prev, hooks: prevHooks } : prev))
        toast.error('Could not delete hook')
      }
    },
    [id, selectedHookId, script?.hooks, handlePaywall],
  )

  const generateScript = useCallback(async () => {
    if (!id) return
    if (!selectedHookId) {
      toast.error('Select a hook first')
      return
    }
    setErrorMessage(null)
    setFailedPhase(null)
    setStep('script')
    setBusyPhase('script')
    setStatus('scripting')
    try {
      const res = await authFetch(`/api/analysis/scripts/${id}/generate`, { method: 'POST' })
      if (await handlePaywall(res)) {
        setBusyPhase(null)
        return
      }
      if (!res.ok) {
        setBusyPhase(null)
        setFailedPhase('script')
        setErrorMessage('Script generation failed to start. Please retry.')
        return
      }
      startPolling(id, 'script_ready', 'script')
    } catch (err) {
      console.error('generateScript error:', err)
      setBusyPhase(null)
      setFailedPhase('script')
      setErrorMessage('Script generation failed to start. Please retry.')
    }
  }, [id, selectedHookId, handlePaywall, startPolling])

  const handleRefine = useCallback(async () => {
    const instruction = refineInput.trim()
    if (!instruction || !id) return
    setRefining(true)
    setErrorMessage(null)
    try {
      const res = await authFetch(`/api/analysis/scripts/${id}/refine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction }),
      })
      if (await handlePaywall(res)) return
      if (!res.ok) {
        setErrorMessage('Refine failed. Please try again.')
        return
      }
      const data = (await res.json()) as ScriptRecord
      setRefineInput('')
      if (data.status === 'scripting') {
        // Async refine — poll for completion.
        setBusyPhase('script')
        setStatus('scripting')
        startPolling(id, 'script_ready', 'script')
      } else if (data.script_text) {
        setScript((prev) =>
          prev
            ? {
                ...prev,
                script_text: data.script_text,
                word_count: data.word_count ?? prev.word_count,
                status: data.status ?? prev.status,
              }
            : data,
        )
      } else {
        loadFull(id)
      }
    } catch (err) {
      console.error('handleRefine error:', err)
      setErrorMessage('Refine failed. Please try again.')
    } finally {
      setRefining(false)
    }
  }, [refineInput, id, handlePaywall, startPolling, loadFull])

  const handleCopy = useCallback(() => {
    if (!script?.script_text) return
    navigator.clipboard
      .writeText(script.script_text)
      .then(() => toast.success('Script copied'))
      .catch(() => toast.error('Could not copy'))
  }, [script?.script_text])

  const handleExport = useCallback(() => {
    if (!script?.script_text) return
    const blob = new Blob([script.script_text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(script.title || script.topic || 'script').slice(0, 40).replace(/[^a-z0-9]+/gi, '-')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }, [script?.script_text, script?.title, script?.topic])

  // From-video mode: topic is locked to the source, so Continue just kicks
  // off research with the optional additional context.
  const handleFromVideoContinue = useCallback(async () => {
    if (!id) return
    const trimmed = additionalContext.trim()
    const saved = (script?.additional_context ?? '').trim()
    // Already researched and context unchanged → just move forward.
    if (script?.research_json && trimmed === saved) {
      setStep('research')
      return
    }
    setSubmitting(true)
    try {
      await startResearch(id, trimmed)
    } finally {
      setSubmitting(false)
    }
  }, [id, additionalContext, script?.additional_context, script?.research_json, startResearch])

  const saveResearch = useCallback(
    async (next: ResearchJson) => {
      if (!id) return
      setSavingResearch(true)
      try {
        const res = await authFetch(`/api/analysis/scripts/${id}/research`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ research: next }),
        })
        if (await handlePaywall(res)) return
        if (!res.ok) {
          toast.error('Could not save research')
          return
        }
        const data = (await res.json()) as ScriptRecord
        setScript((prev) => (prev ? { ...prev, research_json: data.research_json ?? next } : data))
        toast.success('Research saved')
        // Editing research invalidates already-generated hooks.
        if ((script?.hooks?.length ?? 0) > 0) setHooksStale(true)
      } catch (err) {
        console.error('saveResearch error:', err)
        toast.error('Could not save research')
      } finally {
        setSavingResearch(false)
      }
    },
    [id, script?.hooks, handlePaywall],
  )

  const saveScriptText = useCallback(async () => {
    if (!id) return
    setSavingScript(true)
    try {
      const res = await authFetch(`/api/analysis/scripts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script_text: scriptDraft }),
      })
      if (await handlePaywall(res)) return
      if (!res.ok) {
        toast.error('Could not save script')
        return
      }
      const data = (await res.json()) as ScriptRecord
      setScript((prev) =>
        prev
          ? { ...prev, script_text: data.script_text ?? scriptDraft, word_count: data.word_count ?? prev.word_count }
          : data,
      )
      setEditingScript(false)
      toast.success('Script saved')
    } catch (err) {
      console.error('saveScriptText error:', err)
      toast.error('Could not save script')
    } finally {
      setSavingScript(false)
    }
  }, [id, scriptDraft, handlePaywall])

  const renameTitle = useCallback(
    async (title: string) => {
      if (!id) return
      try {
        const res = await authFetch(`/api/analysis/scripts/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title }),
        })
        if (await handlePaywall(res)) return
        if (!res.ok) {
          toast.error('Could not rename')
          return
        }
        setScript((prev) => (prev ? { ...prev, title } : prev))
        toast.success('Title updated')
      } catch (err) {
        console.error('renameTitle error:', err)
        toast.error('Could not rename')
      }
    },
    [id, handlePaywall],
  )

  const deleteScript = useCallback(async () => {
    if (!id) return
    try {
      const res = await authFetch(`/api/analysis/scripts/${id}`, { method: 'DELETE' })
      if (await handlePaywall(res)) return
      if (!res.ok) {
        toast.error('Could not delete script')
        return
      }
      toast.success('Script deleted')
      navigate('/dashboard/scripts')
    } catch (err) {
      console.error('deleteScript error:', err)
      toast.error('Could not delete script')
    }
  }, [id, handlePaywall, navigate])

  const retryFailedPhase = useCallback(() => {
    if (!id || !failedPhase) return
    if (failedPhase === 'research') startResearch(id)
    else if (failedPhase === 'hooks') generateHooks()
    else generateScript()
  }, [id, failedPhase, startResearch, generateHooks, generateScript])

  // ── Stepper state resolution ──────────────────────────────────────
  const stepperState = useCallback(
    (index: number): StepState => {
      const runningIdx = busyPhase ? PHASE_INDEX[busyPhase] : -1
      if (status === 'error' && failedPhase && index === PHASE_INDEX[failedPhase]) return 'error'
      if (runningIdx === -1) return index < 1 ? 'done' : 'pending'
      if (index < runningIdx) return 'done'
      if (index === runningIdx) return 'running'
      return 'pending'
    },
    [busyPhase, status, failedPhase],
  )

  const hooks: ScriptHook[] = script?.hooks ?? []
  const wordCount = script?.word_count ?? null
  const durationSec = estimateDurationSeconds(wordCount)

  // ── Entry mode & editability ──────────────────────────────────────
  // Grounded on a source (library video OR analyzed upload). source_context is
  // only present on grounded scripts, so it reliably identifies from-video mode
  // on resume; entry.* covers the pre-create window.
  const fromVideoMode = !!(
    script?.source_video_id ||
    script?.source_context?.source_video ||
    entry?.sourceVideoId ||
    entry?.sourceUploadId
  )
  // Topic is frozen once a script body exists, or always in from-video mode
  // (the source IS the topic) — mirrors the backend topic-lock.
  const topicLocked = !!script?.script_text || fromVideoMode
  const sourceVideoCard: SourceVideoContext | null =
    script?.source_context?.source_video ??
    (sourceVideo
      ? {
          thumbnail_url: sourceVideo.thumbnailUrl,
          handle: sourceVideo.handle,
          title: sourceVideo.title,
          platform: sourceVideo.platform,
          multiple: sourceVideo.outlierMultiple,
          views: sourceVideo.views,
        }
      : null)

  // ── Non-linear step navigation ────────────────────────────────────
  // Which artifacts already exist — a step is reachable once its data
  // exists, plus the immediate next step (clicking it triggers generation).
  const hasResearch = !!script?.research_json
  const hasHooks = hooks.length > 0
  const hasScript = !!script?.script_text

  const reachableSteps: WizardStep[] = (() => {
    const set = new Set<WizardStep>(['topic'])
    if (hasResearch) set.add('research')
    if (hasHooks) set.add('hooks')
    if (hasScript) set.add('script')
    // Allow jumping forward to the next not-yet-generated step (triggers it).
    if (id) {
      if (!hasResearch) set.add('research')
      else if (!hasHooks) set.add('hooks')
      else if (!hasScript && selectedHookId) set.add('script')
    }
    return Array.from(set)
  })()

  // Jump to an already-reached step (backward/lateral), or kick off
  // generation when clicking forward to a not-yet-generated step.
  const handleStepSelect = (target: WizardStep) => {
    if (busyPhase || target === step) return
    setErrorMessage(null)
    if (target === 'topic') {
      setStep('topic')
    } else if (target === 'research') {
      if (hasResearch) setStep('research')
      else if (id) startResearch(id, fromVideoMode ? additionalContext.trim() : undefined)
    } else if (target === 'hooks') {
      if (hasHooks) setStep('hooks')
      else generateHooks()
    } else if (target === 'script') {
      if (hasScript) setStep('script')
      else generateScript()
    }
  }

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {script && id ? (
            <ScriptTitleMenu
              title={script.title || script.topic || 'Untitled script'}
              onRename={renameTitle}
              onDelete={deleteScript}
            />
          ) : (
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              Script{' '}
              <span className="bg-gradient-to-r from-pink-500 to-orange-400 bg-clip-text text-transparent">
                Studio
              </span>
            </h1>
          )}
          <p className="mt-1 text-sm text-slate-500">
            Topic → research brief → outlier-modeled hooks → spoken-word script.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {proCredits && (
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[11px] font-bold text-slate-400">
              <i className="fas fa-bolt text-[10px] text-pink-400" />
              {proCredits.used}/{proCredits.limit} credits
            </span>
          )}
          <Link
            to="/dashboard/scripts"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[11px] font-bold text-slate-400 transition-all hover:bg-white/[0.08] hover:text-white"
          >
            <i className="fas fa-folder-open text-[10px]" />
            My Scripts
          </Link>
          <button
            type="button"
            onClick={() => setTab((t) => (t === 'persona' ? 'wizard' : 'persona'))}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-bold transition-all ${
              tab === 'persona'
                ? 'border-pink-500/40 bg-pink-500/10 text-pink-300'
                : 'border-white/[0.06] bg-white/[0.03] text-slate-400 hover:bg-white/[0.08] hover:text-white'
            }`}
          >
            <i className="fas fa-id-badge text-[10px]" />
            Persona
          </button>
        </div>
      </div>

      {tab === 'persona' ? (
        <div className="glass-card rounded-3xl p-6 sm:p-8">
          <PersonaPanel />
        </div>
      ) : id && !script && !errorMessage ? (
        /* Resuming an existing script — wait for GET /:id before rendering. */
        <div className="flex justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-pink-500 border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Wizard step header */}
          <div className="mb-6">
            <WizardSteps current={step} onSelect={handleStepSelect} reachable={reachableSteps} />
          </div>

          {/* Error banner */}
          {errorMessage && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-4">
              <i className="fas fa-circle-exclamation mt-0.5 text-red-400" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-red-300">{errorMessage}</p>
              </div>
              {failedPhase && (
                <button
                  type="button"
                  onClick={retryFailedPhase}
                  className="shrink-0 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-200 transition-all hover:bg-red-500/20"
                >
                  <i className="fas fa-redo mr-1.5 text-[10px]" />
                  Retry
                </button>
              )}
            </div>
          )}

          {/* Async progress card */}
          {busyPhase ? (
            <div className="glass-card rounded-3xl p-6 sm:p-8">
              <div className="mb-5">
                <h2 className="text-lg font-black tracking-tight">
                  Building your{' '}
                  <span className="bg-gradient-to-r from-pink-500 to-orange-400 bg-clip-text text-transparent">
                    script
                  </span>
                </h2>
                <p className="mt-1 max-w-md text-xs text-slate-500">
                  This can take a moment. You can leave and resume from My Scripts — we keep going.
                </p>
              </div>
              <PipelineStepper steps={PIPELINE_STEPS} stateOf={stepperState} />
            </div>
          ) : (
            <>
              {/* TOPIC */}
              {step === 'topic' &&
                (fromVideoMode ? (
                  /* FROM-VIDEO mode — the source video is the topic. */
                  <div className="glass-card rounded-3xl p-6 sm:p-8">
                    {sourceVideoCard && <SourceVideoCard video={sourceVideoCard} />}
                    <label className="mb-2 block text-sm font-bold text-white">
                      Add extra context <span className="font-medium text-slate-500">(optional)</span>
                    </label>
                    <p className="mb-4 text-xs text-slate-500">
                      Leave blank to build straight from this video, or add a twist, angle, audience, or
                      detail to steer it.
                    </p>
                    <textarea
                      value={additionalContext}
                      onChange={(e) => setAdditionalContext(e.target.value)}
                      placeholder="e.g. Angle it for first-time founders, and keep it under 30 seconds."
                      rows={4}
                      className="glass-input mb-5 w-full resize-y px-4 py-3 text-sm text-white placeholder-slate-500"
                    />
                    <DisabledUpsellButton
                      requiredTier="pro"
                      upgradeSource="script-studio"
                      onClick={handleFromVideoContinue}
                      disabled={submitting || !id}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-orange-400 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-pink-500/20 transition-all hover:from-pink-600 hover:to-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submitting || !id ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                          {id ? 'Starting...' : 'Preparing...'}
                        </>
                      ) : (
                        <>
                          {hasResearch ? 'Continue' : 'Research this video'}
                          <i className="fas fa-arrow-right text-xs" />
                        </>
                      )}
                    </DisabledUpsellButton>
                  </div>
                ) : (
                  /* TYPED-TOPIC mode. */
                  <div className="glass-card rounded-3xl p-6 sm:p-8">
                    <label className="mb-2 block text-sm font-bold text-white">
                      Describe the video you want to create
                    </label>
                    <p className="mb-4 text-xs text-slate-500">
                      A sentence or two is enough — the more specific, the sharper the research and hooks.
                    </p>
                    {topicLocked ? (
                      <>
                        <div className="glass-input mb-3 w-full whitespace-pre-wrap px-4 py-3 text-sm text-slate-300">
                          {topic || '—'}
                        </div>
                        <p className="mb-5 flex items-center gap-1.5 text-xs text-slate-500">
                          <i className="fas fa-lock text-[10px]" />
                          Topic can&apos;t be changed after the script is created.
                        </p>
                      </>
                    ) : (
                      <textarea
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g. Why most people's morning routines are sabotaging their productivity — and the 3-minute fix nobody talks about."
                        rows={5}
                        className="glass-input mb-5 w-full resize-y px-4 py-3 text-sm text-white placeholder-slate-500"
                      />
                    )}
                    {!topicLocked && (
                      <DisabledUpsellButton
                        requiredTier="pro"
                        upgradeSource="script-studio"
                        onClick={handleTopicContinue}
                        disabled={submitting || !topic.trim()}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-orange-400 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-pink-500/20 transition-all hover:from-pink-600 hover:to-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {submitting ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                            Starting...
                          </>
                        ) : (
                          <>
                            Continue
                            <i className="fas fa-arrow-right text-xs" />
                          </>
                        )}
                      </DisabledUpsellButton>
                    )}
                    {topicLocked && hasResearch && (
                      <button
                        type="button"
                        onClick={() => handleStepSelect('research')}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-orange-400 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-pink-500/20 transition-all hover:from-pink-600 hover:to-orange-500"
                      >
                        Continue
                        <i className="fas fa-arrow-right text-xs" />
                      </button>
                    )}
                  </div>
                ))}

              {/* RESEARCH */}
              {step === 'research' && script?.research_json && (
                <div className="space-y-5">
                  {hooksStale && hasHooks && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-4">
                      <p className="text-sm font-semibold text-amber-200">
                        <i className="fas fa-triangle-exclamation mr-1.5" />
                        Research changed — your hooks are based on the old brief.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setHooksStale(false)
                          generateHooks()
                        }}
                        className="shrink-0 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-100 transition-all hover:bg-amber-500/20"
                      >
                        Regenerate hooks
                      </button>
                    </div>
                  )}
                  <ResearchView research={script.research_json} onSave={saveResearch} saving={savingResearch} />
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setStep('topic')}
                      className="text-sm font-bold text-slate-400 transition-colors hover:text-white"
                    >
                      <i className="fas fa-arrow-left mr-1.5 text-xs" />
                      {topicLocked ? 'View topic' : 'Edit topic'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStepSelect('hooks')}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-orange-400 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-pink-500/20 transition-all hover:from-pink-600 hover:to-orange-500"
                    >
                      {hasHooks ? 'View hooks' : 'Generate hooks'}
                      <i className="fas fa-arrow-right text-xs" />
                    </button>
                  </div>
                </div>
              )}

              {/* HOOK */}
              {step === 'hooks' && (
                <div className="space-y-5">
                  {scriptStale && hasScript && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-4">
                      <p className="text-sm font-semibold text-amber-200">
                        <i className="fas fa-triangle-exclamation mr-1.5" />
                        Hook changed — your script was written from the old hook.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setScriptStale(false)
                          generateScript()
                        }}
                        className="shrink-0 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-100 transition-all hover:bg-amber-500/20"
                      >
                        Regenerate script
                      </button>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-black tracking-tight">Pick your hook</h2>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Each is modeled on a real breakout video. Select one, or edit it to taste.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => generateHooks(true)}
                      disabled={appendingHooks}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-xs font-bold text-slate-300 transition-all hover:bg-white/[0.08] hover:text-white disabled:opacity-60"
                    >
                      <i className={`fas ${appendingHooks ? 'fa-spinner fa-spin' : 'fa-plus'} text-[11px]`} />
                      {appendingHooks ? 'Generating…' : 'Generate more hooks'}
                    </button>
                  </div>

                  {hooks.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {hooks.map((hook) => (
                        <HookCard
                          key={hook.id}
                          hook={hook}
                          selected={selectedHookId === hook.id}
                          onSelect={selectHook}
                          onEdit={editHook}
                          onDelete={deleteHook}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="glass-card rounded-3xl p-10 text-center text-sm text-slate-500">
                      No hooks yet. Try “Generate more hooks”.
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setStep('research')}
                      className="text-sm font-bold text-slate-400 transition-colors hover:text-white"
                    >
                      <i className="fas fa-arrow-left mr-1.5 text-xs" />
                      Back to research
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStepSelect('script')}
                      disabled={!selectedHookId}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-orange-400 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-pink-500/20 transition-all hover:from-pink-600 hover:to-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {hasScript ? 'View script' : 'Write the script'}
                      <i className="fas fa-arrow-right text-xs" />
                    </button>
                  </div>
                </div>
              )}

              {/* SCRIPT */}
              {step === 'script' && script?.script_text && (
                <div className="space-y-5">
                  <div className="glass-card rounded-3xl p-6 sm:p-8">
                    {/* Meta + header-right actions */}
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {wordCount != null && (
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.04] px-2.5 py-1 text-[11px] font-bold text-slate-300">
                            <i className="fas fa-font text-[10px] text-slate-500" />
                            {wordCount} words
                          </span>
                        )}
                        {durationSec > 0 && (
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.04] px-2.5 py-1 text-[11px] font-bold text-slate-300">
                            <i className="fas fa-clock text-[10px] text-slate-500" />~{formatDuration(durationSec)}
                          </span>
                        )}
                      </div>
                      {!editingScript && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setScriptDraft(script?.script_text ?? '')
                              setEditingScript(true)
                            }}
                            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-xs font-bold text-slate-300 transition-all hover:bg-white/[0.08] hover:text-white"
                          >
                            <i className="fas fa-pen text-[11px]" />
                            Edit script
                          </button>
                          <button
                            type="button"
                            onClick={generateScript}
                            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-xs font-bold text-slate-300 transition-all hover:bg-white/[0.08] hover:text-white"
                          >
                            <i className="fas fa-wand-magic-sparkles text-[11px]" />
                            Rewrite from scratch
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Body — read-only spoken-word script or inline editor */}
                    {editingScript ? (
                      <div className="space-y-3">
                        <textarea
                          value={scriptDraft}
                          onChange={(e) => setScriptDraft(e.target.value)}
                          rows={14}
                          className="glass-input w-full resize-y px-4 py-3 font-mono text-sm leading-relaxed text-white"
                        />
                        <p className="text-[11px] text-slate-500">
                          One sentence per line keeps the spoken-word formatting.
                        </p>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={saveScriptText}
                            disabled={savingScript}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-orange-400 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-pink-500/20 transition-all hover:from-pink-600 hover:to-orange-500 disabled:opacity-50"
                          >
                            {savingScript ? 'Saving...' : 'Save script'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingScript(false)}
                            disabled={savingScript}
                            className="text-sm font-bold text-slate-400 transition-colors hover:text-white disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {(script?.script_text ?? '').split('\n').map((line, i) =>
                          line.trim() === '' ? (
                            <div key={i} className="h-3" />
                          ) : (
                            <p key={i} className="text-[15px] leading-relaxed text-slate-200">
                              {line}
                            </p>
                          ),
                        )}
                      </div>
                    )}

                    {/* Footer actions */}
                    {!editingScript && (
                      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-white/[0.06] pt-5">
                        <button
                          type="button"
                          onClick={handleCopy}
                          className="inline-flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-xs font-bold text-slate-300 transition-all hover:bg-white/[0.08] hover:text-white"
                        >
                          <i className="fas fa-copy text-[11px]" />
                          Copy
                        </button>
                        <button
                          type="button"
                          onClick={handleExport}
                          className="inline-flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-xs font-bold text-slate-300 transition-all hover:bg-white/[0.08] hover:text-white"
                        >
                          <i className="fas fa-download text-[11px]" />
                          Export .txt
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowVersions(true)}
                          aria-label="Version history"
                          className="inline-flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-xs font-bold text-slate-300 transition-all hover:bg-white/[0.08] hover:text-white"
                        >
                          <i className="fas fa-clock-rotate-left text-[11px]" />
                          History
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Conversational refine box */}
                  <div className="glass-card rounded-3xl p-5">
                    <label className="mb-2 block text-sm font-bold text-white">
                      What changes would you like to make?
                    </label>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <input
                        value={refineInput}
                        onChange={(e) => setRefineInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !refining) handleRefine()
                        }}
                        placeholder="e.g. Make the opening punchier and cut the script to 30 seconds."
                        className="glass-input flex-1 px-4 py-3 text-sm text-white placeholder-slate-500"
                      />
                      <button
                        type="button"
                        onClick={handleRefine}
                        disabled={refining || !refineInput.trim()}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-orange-400 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-pink-500/20 transition-all hover:from-pink-600 hover:to-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {refining ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                            Refining...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-paper-plane text-xs" />
                            Refine
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {id && (
        <VersionHistory
          scriptId={id}
          open={showVersions}
          onClose={() => setShowVersions(false)}
          onRestored={(updated) =>
            setScript((prev) =>
              prev
                ? {
                    ...prev,
                    script_text: updated.script_text ?? prev.script_text,
                    word_count: updated.word_count ?? prev.word_count,
                  }
                : updated,
            )
          }
        />
      )}
    </div>
  )
}
