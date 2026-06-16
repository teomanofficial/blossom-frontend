import { useEffect, useRef, useState } from 'react'

interface ScriptTitleMenuProps {
  title: string
  /** Persist a renamed title (PATCH /:id { title }). */
  onRename: (title: string) => Promise<void> | void
  /** Delete the script (DELETE /:id) then navigate away. */
  onDelete: () => Promise<void> | void
}

/**
 * Script title with a kebab "⋮" menu (Edit title / Delete). "Add to project"
 * is intentionally omitted — the backend has no endpoint for it yet.
 */
export default function ScriptTitleMenu({ title, onRename, onDelete }: ScriptTitleMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [draft, setDraft] = useState(title)
  const [busy, setBusy] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [menuOpen])

  const commitRename = async () => {
    const next = draft.trim()
    if (!next || next === title) {
      setRenaming(false)
      return
    }
    setBusy(true)
    try {
      await onRename(next)
      setRenaming(false)
    } finally {
      setBusy(false)
    }
  }

  const confirmDelete = async () => {
    if (!window.confirm('Delete this script? This cannot be undone.')) return
    setMenuOpen(false)
    setBusy(true)
    try {
      await onDelete()
    } finally {
      setBusy(false)
    }
  }

  if (renaming) {
    return (
      <div className="flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitRename()
            if (e.key === 'Escape') setRenaming(false)
          }}
          autoFocus
          disabled={busy}
          className="glass-input min-w-0 flex-1 px-3 py-1.5 text-lg font-black text-white"
        />
        <button
          type="button"
          onClick={commitRename}
          disabled={busy}
          className="rounded-lg bg-gradient-to-r from-pink-500 to-orange-400 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => setRenaming(false)}
          disabled={busy}
          className="text-xs font-bold text-slate-400 hover:text-white disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div ref={wrapRef} className="relative flex items-center gap-1.5">
      <h1 className="truncate text-xl font-black tracking-tight text-white sm:text-2xl">{title}</h1>
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Script options"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
      >
        <i className="fas fa-ellipsis-vertical" />
      </button>

      {menuOpen && (
        <div
          role="menu"
          className="absolute left-0 top-full z-30 mt-2 w-44 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b0b12]/95 py-1 shadow-2xl backdrop-blur-2xl"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setDraft(title)
              setRenaming(true)
              setMenuOpen(false)
            }}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-semibold text-slate-200 transition-colors hover:bg-white/[0.06]"
          >
            <i className="fas fa-pen w-4 text-[12px] text-slate-400" />
            Edit title
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={confirmDelete}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/10"
          >
            <i className="fas fa-trash w-4 text-[12px]" />
            Delete
          </button>
        </div>
      )}
    </div>
  )
}
