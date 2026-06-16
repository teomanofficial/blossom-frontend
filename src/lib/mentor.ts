/**
 * Single source of truth for the "Mentor" feature naming.
 *
 * The Mentor is the AI content strategist surface (formerly "Coach Chat" /
 * "Chats"). Change the label here to rename the feature everywhere — nav,
 * headers, empty states, etc. The word "chat" must not appear in any
 * user-facing copy on these surfaces.
 */
export const MENTOR_LABEL = 'Mentor'
/** A single conversation with the Mentor. */
export const MENTOR_SESSION_LABEL = 'session'

/** ── General Mentor API ─────────────────────────────────────────── */
export const GENERAL_MENTOR_BASE = '/api/general-coach-chat'

export interface MentorSession {
  threadId: number
  title: string | null
  lastMessage: string | null
  messageCount: number
  updatedAt: string
}

export interface MentorPersistedMessage {
  id: number | string
  role: 'user' | 'model'
  content: string
  createdAt?: string
}

/** Relative-time formatter shared across Mentor surfaces. */
export function formatRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const then = new Date(dateStr).getTime()
  if (Number.isNaN(then)) return ''
  const now = Date.now()
  const diffSec = Math.max(0, Math.floor((now - then) / 1000))
  if (diffSec < 60) return 'just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`
  const diffWk = Math.floor(diffDay / 7)
  return `${diffWk} week${diffWk === 1 ? '' : 's'} ago`
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max).trimEnd() + '…'
}
