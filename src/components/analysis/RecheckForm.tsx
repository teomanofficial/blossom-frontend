import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../../lib/api'

export interface RecheckFormProps {
  uploadId: number
  sessionToken: string
  onClose: () => void
  onSuccess: (newId: number) => void
}

export default function RecheckForm({ uploadId, sessionToken, onClose, onSuccess }: RecheckFormProps) {
  const navigate = useNavigate()
  const [recheckMode, setRecheckMode] = useState<'url' | 'upload'>('url')
  const [recheckUrl, setRecheckUrl] = useState('')
  const [recheckFile, setRecheckFile] = useState<File | null>(null)
  const [recheckUploading, setRecheckUploading] = useState(false)
  const [recheckError, setRecheckError] = useState<string | null>(null)
  const recheckFileInputRef = useRef<HTMLInputElement>(null)

  const handleRecheck = async () => {
    if (!recheckUrl && !recheckFile) {
      setRecheckError('Please provide a video URL or file')
      return
    }

    setRecheckUploading(true)
    setRecheckError(null)

    try {
      let response: any
      if (recheckFile) {
        const formData = new FormData()
        formData.append('video', recheckFile)
        response = await fetch(`${API_URL}/api/content-analysis/${uploadId}/new-version`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${sessionToken}` },
          body: formData,
        }).then(r => r.json())
      } else {
        response = await fetch(`${API_URL}/api/content-analysis/${uploadId}/new-version`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: recheckUrl }),
        }).then(r => r.json())
      }

      if (response.error) {
        setRecheckError(response.error)
        return
      }

      // Reset re-check form and navigate to new version
      onClose()
      onSuccess(response.id)
      navigate(`/dashboard/analyze/${response.id}`)
    } catch (err: any) {
      setRecheckError(err.message || 'Failed to create new version')
    } finally {
      setRecheckUploading(false)
    }
  }

  return (
    <div className="mb-6 rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-teal-500/5 p-5">
      <div className="flex items-center gap-2 mb-4">
        <i className="fas fa-redo text-purple-400"></i>
        <h3 className="font-bold text-white">Improve & Re-check</h3>
        <button onClick={onClose} className="ml-auto text-slate-500 hover:text-white">
          <i className="fas fa-times"></i>
        </button>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setRecheckMode('url')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${recheckMode === 'url' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <i className="fas fa-link mr-1"></i> URL
        </button>
        <button
          onClick={() => setRecheckMode('upload')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${recheckMode === 'upload' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <i className="fas fa-upload mr-1"></i> Upload
        </button>
      </div>

      {/* URL or file input */}
      {recheckMode === 'url' ? (
        <input
          type="text"
          value={recheckUrl}
          onChange={e => setRecheckUrl(e.target.value)}
          placeholder="Paste TikTok or Instagram URL..."
          className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-purple-500/50 mb-4"
        />
      ) : (
        <div className="mb-4">
          <input
            ref={recheckFileInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm"
            onChange={e => setRecheckFile(e.target.files?.[0] || null)}
            className="hidden"
          />
          <button
            onClick={() => recheckFileInputRef.current?.click()}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-dashed border-white/10 text-slate-400 text-sm hover:bg-white/10 hover:border-purple-500/30 transition-all"
          >
            {recheckFile ? (
              <span className="text-white"><i className="fas fa-check-circle text-teal-400 mr-2"></i>{recheckFile.name}</span>
            ) : (
              <span><i className="fas fa-cloud-upload-alt mr-2"></i>Click to select improved video</span>
            )}
          </button>
        </div>
      )}

      {recheckError && (
        <p className="text-xs text-red-400 mb-3"><i className="fas fa-exclamation-circle mr-1"></i>{recheckError}</p>
      )}

      <button
        onClick={handleRecheck}
        disabled={recheckUploading || (!recheckUrl && !recheckFile)}
        className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-teal-500 text-white text-sm font-bold disabled:opacity-40 hover:from-purple-600 hover:to-teal-600 transition-all"
      >
        {recheckUploading ? (
          <><i className="fas fa-spinner fa-spin mr-2"></i>Analyzing new version...</>
        ) : (
          <><i className="fas fa-play mr-2"></i>Analyze Improved Version</>
        )}
      </button>
    </div>
  )
}
