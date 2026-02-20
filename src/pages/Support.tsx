import { useEffect, useState, useRef } from 'react'
import { authFetch } from '../lib/api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Ticket {
  id: number
  subject: string
  status: string
  priority: string
  category: string
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

type View = 'list' | 'create' | 'thread'

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
    case 'bug_report':
      return 'Bug Report'
    case 'billing':
      return 'Billing'
    case 'feature_request':
      return 'Feature Request'
    case 'complaint':
      return 'Complaint'
    default:
      return category
  }
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)
  const diffWeek = Math.floor(diffDay / 7)
  const diffMonth = Math.floor(diffDay / 30)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  if (diffWeek < 5) return `${diffWeek}w ago`
  return `${diffMonth}mo ago`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Support() {
  const [view, setView] = useState<View>('list')
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<TicketWithMessages | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Create form state
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('general')
  const [priority, setPriority] = useState('medium')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Reply state
  const [reply, setReply] = useState('')
  const [sendingReply, setSendingReply] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // ---------- Fetch tickets ----------
  const fetchTickets = async () => {
    try {
      setError(null)
      const res = await authFetch('/api/support/tickets')
      if (!res.ok) throw new Error('Failed to load tickets')
      const data = await res.json()
      setTickets(data.tickets || [])
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  // ---------- Fetch single ticket ----------
  const fetchTicketDetail = async (id: number) => {
    try {
      setDetailLoading(true)
      setError(null)
      const res = await authFetch(`/api/support/tickets/${id}`)
      if (!res.ok) throw new Error('Failed to load ticket')
      const data = await res.json()
      setSelectedTicket(data.ticket)
      setView('thread')
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setDetailLoading(false)
    }
  }

  // ---------- Auto-scroll messages ----------
  useEffect(() => {
    if (view === 'thread' && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [view, selectedTicket?.messages])

  // ---------- Create ticket ----------
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) return
    try {
      setSubmitting(true)
      setError(null)
      const res = await authFetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject.trim(), category, priority, message: message.trim() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to create ticket')
      }
      const data = await res.json()
      setTickets((prev) => [data.ticket, ...prev])
      setSubject('')
      setCategory('general')
      setPriority('medium')
      setMessage('')
      setView('list')
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  // ---------- Send reply ----------
  const handleReply = async () => {
    if (!reply.trim() || !selectedTicket) return
    try {
      setSendingReply(true)
      setError(null)
      const res = await authFetch(`/api/support/tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reply.trim() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to send reply')
      }
      setReply('')
      await fetchTicketDetail(selectedTicket.id)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setSendingReply(false)
    }
  }

  // ---------- Navigation helpers ----------
  const goToList = () => {
    setView('list')
    setSelectedTicket(null)
    setReply('')
    setError(null)
    fetchTickets()
  }

  const goToCreate = () => {
    setView('create')
    setError(null)
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <>
      {/* Page header */}
      <div className="mb-12">
        <span className="px-3 py-1 bg-pink-500/10 text-pink-400 rounded-full text-xs font-bold uppercase tracking-wider">
          Support
        </span>
        <h1 className="text-3xl font-black tracking-tight mt-3">
          Support & <span className="gradient-text">Help</span>
        </h1>
        <p className="text-slate-500 text-sm font-medium mt-1">
          Have a question or issue? We're here to help.
        </p>
      </div>

      {/* Global error */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-4 text-red-400 hover:text-red-300">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* ===================== TICKET LIST VIEW ===================== */}
      {view === 'list' && (
        <>
          {/* Header row */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">Your Tickets</h2>
            <button
              onClick={goToCreate}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-orange-400 text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity"
            >
              New Ticket
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
            </div>
          ) : tickets.length === 0 ? (
            /* Empty state */
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center py-16">
              <svg
                className="w-12 h-12 mx-auto text-slate-600 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <p className="text-slate-500 text-sm font-medium">No tickets yet</p>
              <p className="text-slate-600 text-xs mt-1">Create a ticket to get help from our team.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => fetchTicketDetail(ticket.id)}
                  disabled={detailLoading}
                  className="w-full text-left p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white truncate">{ticket.subject}</span>
                        {ticket.unread_count > 0 && (
                          <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-pink-500 text-white text-[10px] font-bold rounded-full">
                            {ticket.unread_count}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(ticket.status)}`}
                        >
                          {getStatusLabel(ticket.status)}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getPriorityBadge(ticket.priority)}`}
                        >
                          {ticket.priority}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/5 text-slate-400">
                          {getCategoryLabel(ticket.category)}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-600 font-medium whitespace-nowrap mt-1">
                      {timeAgo(ticket.last_message_at || ticket.updated_at)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* ===================== CREATE TICKET VIEW ===================== */}
      {view === 'create' && (
        <>
          <button
            onClick={goToList}
            className="flex items-center gap-2 text-slate-400 text-sm font-medium hover:text-white transition-colors mb-6"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to tickets
          </button>

          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <h2 className="text-lg font-bold text-white mb-6">Create a Ticket</h2>

            <form onSubmit={handleCreate} className="space-y-5">
              {/* Subject */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief description of your issue"
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-white placeholder:text-slate-600 focus:border-pink-500/50 focus:outline-none transition-colors"
                />
              </div>

              {/* Category + Priority row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-white placeholder:text-slate-600 focus:border-pink-500/50 focus:outline-none transition-colors"
                  >
                    <option value="general">General</option>
                    <option value="bug_report">Bug Report</option>
                    <option value="billing">Billing</option>
                    <option value="feature_request">Feature Request</option>
                    <option value="complaint">Complaint</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-white placeholder:text-slate-600 focus:border-pink-500/50 focus:outline-none transition-colors"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue in detail..."
                  required
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-white placeholder:text-slate-600 focus:border-pink-500/50 focus:outline-none transition-colors resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={goToList}
                  className="px-6 py-3 bg-white/5 border border-white/10 text-slate-400 text-sm font-bold rounded-xl hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !subject.trim() || !message.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-pink-500 to-orange-400 text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    'Submit Ticket'
                  )}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* ===================== THREAD VIEW ===================== */}
      {view === 'thread' && (
        <>
          <button
            onClick={goToList}
            className="flex items-center gap-2 text-slate-400 text-sm font-medium hover:text-white transition-colors mb-6"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to tickets
          </button>

          {detailLoading && !selectedTicket ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
            </div>
          ) : selectedTicket ? (
            <div className="space-y-4">
              {/* Ticket header card */}
              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <h2 className="text-lg font-bold text-white mb-3">{selectedTicket.subject}</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(selectedTicket.status)}`}
                  >
                    {getStatusLabel(selectedTicket.status)}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getPriorityBadge(selectedTicket.priority)}`}
                  >
                    {selectedTicket.priority}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/5 text-slate-400">
                    {getCategoryLabel(selectedTicket.category)}
                  </span>
                  <span className="text-[11px] text-slate-600 font-medium ml-auto">
                    Created {formatDate(selectedTicket.created_at)}
                  </span>
                </div>
              </div>

              {/* Messages */}
              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <div className="max-h-[28rem] overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                  {selectedTicket.messages.length === 0 ? (
                    <p className="text-slate-600 text-sm text-center py-8">No messages yet.</p>
                  ) : (
                    selectedTicket.messages.map((msg) => {
                      const isUser = msg.sender_type === 'user'
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                              isUser
                                ? 'bg-pink-500/10 border border-pink-500/20'
                                : 'bg-white/5 border border-white/10'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-4 mb-1">
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider ${
                                  isUser ? 'text-pink-400' : 'text-slate-400'
                                }`}
                              >
                                {isUser ? 'You' : msg.sender_name || 'Support Team'}
                              </span>
                              <span className="text-[10px] text-slate-600 font-medium whitespace-nowrap">
                                {formatDate(msg.created_at)}
                              </span>
                            </div>
                            <p className="text-sm text-slate-300 font-medium whitespace-pre-wrap leading-relaxed">
                              {msg.message}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Reply box */}
              {selectedTicket.status !== 'closed' && (
                <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">
                    Reply
                  </label>
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type your reply..."
                    rows={3}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-white placeholder:text-slate-600 focus:border-pink-500/50 focus:outline-none transition-colors resize-none"
                  />
                  <div className="flex justify-end mt-3">
                    <button
                      onClick={handleReply}
                      disabled={sendingReply || !reply.trim()}
                      className="px-6 py-3 bg-gradient-to-r from-pink-500 to-orange-400 text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendingReply ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending...
                        </span>
                      ) : (
                        'Send Reply'
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Closed ticket notice */}
              {selectedTicket.status === 'closed' && (
                <div className="p-4 rounded-xl bg-slate-400/5 border border-slate-400/10 text-center">
                  <p className="text-slate-500 text-sm font-medium">
                    This ticket is closed. If you need further help, please create a new ticket.
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </>
      )}
    </>
  )
}
