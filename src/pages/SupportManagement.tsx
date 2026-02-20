import { useEffect, useState, useRef, useCallback } from 'react'
import { authFetch } from '../lib/api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Ticket {
  id: number
  user_id: string
  subject: string
  status: string
  priority: string
  category: string
  user_name: string | null
  user_email: string | null
  created_at: string
  updated_at: string
  unread_count: number
  last_message_at: string
}

interface TicketMessage {
  id: number
  sender_type: string
  sender_name: string | null
  message: string
  is_read: boolean
  created_at: string
}

interface TicketWithMessages extends Ticket {
  messages: TicketMessage[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStatusBadge(status: string): string {
  switch (status) {
    case 'open':
      return 'bg-teal-400/10 text-teal-400'
    case 'in_progress':
      return 'bg-yellow-400/10 text-yellow-400'
    case 'resolved':
      return 'bg-blue-400/10 text-blue-400'
    case 'closed':
      return 'bg-slate-400/10 text-slate-500'
    default:
      return 'bg-slate-400/10 text-slate-500'
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'open':
      return 'Open'
    case 'in_progress':
      return 'In Progress'
    case 'resolved':
      return 'Resolved'
    case 'closed':
      return 'Closed'
    default:
      return status
  }
}

function getPriorityBadge(priority: string): string {
  switch (priority) {
    case 'low':
      return 'bg-slate-400/10 text-slate-400'
    case 'medium':
      return 'bg-orange-400/10 text-orange-400'
    case 'high':
      return 'bg-red-400/10 text-red-400'
    default:
      return 'bg-slate-400/10 text-slate-400'
  }
}

function getCategoryLabel(category: string): string {
  switch (category) {
    case 'general':
      return 'General'
    case 'billing':
      return 'Billing'
    case 'technical':
      return 'Technical'
    case 'account':
      return 'Account'
    case 'feature_request':
      return 'Feature Request'
    case 'bug_report':
      return 'Bug Report'
    case 'complaint':
      return 'Complaint'
    default:
      return category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  }
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const seconds = Math.floor((now - then) / 1000)

  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  const years = Math.floor(months / 12)
  return `${years}y ago`
}

// ---------------------------------------------------------------------------
// Status filter tabs
// ---------------------------------------------------------------------------

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'All', value: '' },
  { label: 'Open', value: 'open' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Closed', value: 'closed' },
]

const STATUS_OPTIONS = ['open', 'in_progress', 'resolved', 'closed']

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SupportManagement() {
  // View state
  const [view, setView] = useState<'list' | 'thread'>('list')
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null)

  // List state
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  // Thread state
  const [ticket, setTicket] = useState<TicketWithMessages | null>(null)
  const [threadLoading, setThreadLoading] = useState(false)
  const [threadError, setThreadError] = useState<string | null>(null)

  // Reply state
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  // Status change state
  const [changingStatus, setChangingStatus] = useState(false)

  // Ref for auto-scroll
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // -------------------------------------------------------------------------
  // Fetch ticket list
  // -------------------------------------------------------------------------

  const fetchTickets = useCallback(async () => {
    setListLoading(true)
    setListError(null)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      const res = await authFetch(`/api/support/tickets?${params.toString()}`)
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || `Failed to load tickets (${res.status})`)
      }
      const data = await res.json()
      setTickets(data.tickets ?? [])
      setTotal(data.total ?? 0)
    } catch (err: any) {
      setListError(err.message ?? 'Failed to load tickets')
    } finally {
      setListLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    if (view === 'list') {
      fetchTickets()
    }
  }, [view, fetchTickets])

  // -------------------------------------------------------------------------
  // Fetch single ticket thread
  // -------------------------------------------------------------------------

  const fetchTicket = useCallback(async (id: number) => {
    setThreadLoading(true)
    setThreadError(null)
    try {
      const res = await authFetch(`/api/support/tickets/${id}`)
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || `Failed to load ticket (${res.status})`)
      }
      const data = await res.json()
      setTicket(data.ticket ?? null)
    } catch (err: any) {
      setThreadError(err.message ?? 'Failed to load ticket')
    } finally {
      setThreadLoading(false)
    }
  }, [])

  useEffect(() => {
    if (view === 'thread' && selectedTicketId !== null) {
      fetchTicket(selectedTicketId)
    }
  }, [view, selectedTicketId, fetchTicket])

  // Auto-scroll messages
  useEffect(() => {
    if (ticket?.messages?.length) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [ticket?.messages])

  // -------------------------------------------------------------------------
  // Open ticket thread
  // -------------------------------------------------------------------------

  function openThread(id: number) {
    setSelectedTicketId(id)
    setTicket(null)
    setReplyText('')
    setSendError(null)
    setView('thread')
  }

  function backToList() {
    setView('list')
    setSelectedTicketId(null)
    setTicket(null)
  }

  // -------------------------------------------------------------------------
  // Send reply
  // -------------------------------------------------------------------------

  async function handleSendReply() {
    if (!replyText.trim() || !selectedTicketId) return
    setSending(true)
    setSendError(null)
    try {
      const res = await authFetch(`/api/support/tickets/${selectedTicketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyText.trim() }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || `Failed to send reply (${res.status})`)
      }
      setReplyText('')
      await fetchTicket(selectedTicketId)
    } catch (err: any) {
      setSendError(err.message ?? 'Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  // -------------------------------------------------------------------------
  // Change ticket status
  // -------------------------------------------------------------------------

  async function handleStatusChange(newStatus: string) {
    if (!selectedTicketId || !ticket) return
    if (newStatus === ticket.status) return
    setChangingStatus(true)
    try {
      const res = await authFetch(`/api/support/tickets/${selectedTicketId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || `Failed to update status (${res.status})`)
      }
      await fetchTicket(selectedTicketId)
    } catch (err: any) {
      setThreadError(err.message ?? 'Failed to update status')
    } finally {
      setChangingStatus(false)
    }
  }

  // -------------------------------------------------------------------------
  // Render: Ticket List
  // -------------------------------------------------------------------------

  function renderTicketList() {
    return (
      <div className="space-y-6">
        {/* Status filter tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                statusFilter === f.value
                  ? 'bg-white/10 text-white font-bold'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Ticket count */}
        <p className="text-slate-500 text-sm font-medium">
          {total} ticket{total !== 1 ? 's' : ''} found
        </p>

        {/* Loading */}
        {listLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
          </div>
        )}

        {/* Error */}
        {listError && !listLoading && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
            {listError}
          </div>
        )}

        {/* Empty state */}
        {!listLoading && !listError && tickets.length === 0 && (
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
            <div className="text-4xl mb-3 opacity-40">📭</div>
            <p className="text-slate-400 text-sm font-medium">No tickets found</p>
            <p className="text-slate-600 text-xs mt-1">
              {statusFilter ? 'Try a different status filter' : 'No support tickets have been submitted yet'}
            </p>
          </div>
        )}

        {/* Ticket cards */}
        {!listLoading && !listError && tickets.length > 0 && (
          <div className="space-y-3">
            {tickets.map(t => (
              <button
                key={t.id}
                onClick={() => openThread(t.id)}
                className="w-full text-left p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Subject */}
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white truncate group-hover:text-pink-400 transition-colors">
                        {t.subject}
                      </h3>
                      {t.unread_count > 0 && (
                        <span className="flex-shrink-0 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-pink-500 text-white rounded-full">
                          {t.unread_count}
                        </span>
                      )}
                    </div>

                    {/* User info */}
                    <p className="text-slate-500 text-xs mt-1 truncate">
                      {t.user_name || t.user_email || 'Unknown user'} &middot; #{t.id}
                    </p>

                    {/* Badges row */}
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold uppercase tracking-wide ${getStatusBadge(t.status)}`}>
                        {getStatusLabel(t.status)}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold uppercase tracking-wide ${getPriorityBadge(t.priority)}`}>
                        {t.priority}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold uppercase tracking-wide bg-white/5 text-slate-400">
                        {getCategoryLabel(t.category)}
                      </span>
                    </div>
                  </div>

                  {/* Last activity */}
                  <div className="flex-shrink-0 text-right">
                    <p className="text-slate-600 text-xs">
                      {t.last_message_at ? timeAgo(t.last_message_at) : timeAgo(t.updated_at)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // Render: Thread View
  // -------------------------------------------------------------------------

  function renderThreadView() {
    // Loading
    if (threadLoading && !ticket) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
        </div>
      )
    }

    // Error
    if (threadError && !ticket) {
      return (
        <div className="space-y-4">
          <button
            onClick={backToList}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-semibold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to tickets
          </button>
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
            {threadError}
          </div>
        </div>
      )
    }

    if (!ticket) return null

    return (
      <div className="space-y-6">
        {/* Back button */}
        <button
          onClick={backToList}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-semibold transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to tickets
        </button>

        {/* Ticket header card */}
        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-white">{ticket.subject}</h2>
              <p className="text-slate-500 text-sm mt-1">
                {ticket.user_name || ticket.user_email || 'Unknown user'}
                {ticket.user_name && ticket.user_email && (
                  <span className="text-slate-600"> &middot; {ticket.user_email}</span>
                )}
                <span className="text-slate-600"> &middot; #{ticket.id}</span>
              </p>
            </div>
          </div>

          {/* Badges and status selector */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold uppercase tracking-wide ${getStatusBadge(ticket.status)}`}>
              {getStatusLabel(ticket.status)}
            </span>
            <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold uppercase tracking-wide ${getPriorityBadge(ticket.priority)}`}>
              {ticket.priority}
            </span>
            <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold uppercase tracking-wide bg-white/5 text-slate-400">
              {getCategoryLabel(ticket.category)}
            </span>

            <div className="ml-auto flex items-center gap-2">
              <label className="text-slate-500 text-xs font-medium">Status:</label>
              <select
                value={ticket.status}
                onChange={e => handleStatusChange(e.target.value)}
                disabled={changingStatus}
                className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm font-medium text-white focus:border-pink-500/50 focus:outline-none transition-colors disabled:opacity-50 cursor-pointer appearance-none"
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s} className="bg-slate-900 text-white">
                    {getStatusLabel(s)}
                  </option>
                ))}
              </select>
              {changingStatus && (
                <div className="w-4 h-4 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
              )}
            </div>
          </div>

          <p className="text-slate-600 text-xs">
            Created {new Date(ticket.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>

        {/* Thread error */}
        {threadError && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
            {threadError}
          </div>
        )}

        {/* Messages */}
        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Messages</h3>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {ticket.messages.length === 0 && (
              <p className="text-slate-600 text-sm text-center py-8">No messages in this ticket yet.</p>
            )}

            {ticket.messages.map(msg => {
              const isAdmin = msg.sender_type === 'admin' || msg.sender_type === 'support'
              return (
                <div
                  key={msg.id}
                  className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                      isAdmin
                        ? 'bg-pink-500/10 border border-pink-500/20'
                        : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    <p className={`text-[11px] font-bold uppercase tracking-wide mb-1 ${
                      isAdmin ? 'text-pink-400' : 'text-slate-500'
                    }`}>
                      {isAdmin ? 'Support Team' : (msg.sender_name || 'User')}
                    </p>
                    <p className="text-sm text-slate-200 whitespace-pre-wrap break-words leading-relaxed">
                      {msg.message}
                    </p>
                    <p className="text-[10px] text-slate-600 mt-2">
                      {timeAgo(msg.created_at)}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Reply box */}
        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Reply</h3>

          {sendError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
              {sendError}
            </div>
          )}

          <textarea
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            placeholder="Type your reply..."
            rows={4}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-white placeholder:text-slate-600 focus:border-pink-500/50 focus:outline-none transition-colors resize-none"
          />

          <div className="flex justify-end">
            <button
              onClick={handleSendReply}
              disabled={sending || !replyText.trim()}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-orange-400 text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {sending ? 'Sending...' : 'Send Reply'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // Main render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <span className="px-3 py-1 bg-orange-500/10 text-orange-400 rounded-full text-xs font-bold uppercase tracking-wider">
          Management
        </span>
        <h1 className="text-3xl font-black tracking-tight mt-3">
          Support <span className="gradient-text">Management</span>
        </h1>
        <p className="text-slate-500 text-sm font-medium mt-1">
          Manage user support tickets and complaints
        </p>
      </div>

      {/* View router */}
      {view === 'list' ? renderTicketList() : renderThreadView()}
    </div>
  )
}
