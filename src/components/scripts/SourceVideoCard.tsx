import type { SourceVideoContext } from '../../types/scripts'
import { compactCount, formatMultiple } from './format'

interface SourceVideoCardProps {
  video: SourceVideoContext
}

/** Map a platform slug to its FontAwesome brand icon. */
function platformIcon(platform?: string | null): string {
  switch ((platform || '').toLowerCase()) {
    case 'tiktok':
      return 'fa-tiktok'
    case 'instagram':
      return 'fa-instagram'
    case 'youtube':
      return 'fa-youtube'
    default:
      return 'fa-circle-play'
  }
}

/**
 * Prominent source-video card shown at the top of the Topic step in
 * from-video mode. Reuses the outlier multiple + views visual treatment from
 * Blossom video cards so the grounding reads natively. Read-only; clicking
 * opens the original video in a new tab when a URL is available.
 */
export default function SourceVideoCard({ video }: SourceVideoCardProps) {
  const hasMultiple = video.multiple != null
  const hasViews = video.views != null
  const icon = platformIcon(video.platform)
  const clickable = !!video.content_url

  const Wrapper = clickable ? 'a' : 'div'
  const wrapperProps = clickable
    ? { href: video.content_url as string, target: '_blank', rel: 'noopener noreferrer' }
    : {}

  return (
    <div className="mb-6">
      <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">
        <i className="fas fa-wand-magic-sparkles mr-1.5 text-pink-400" />
        Your script will be built from this video
      </span>
      <Wrapper
        {...wrapperProps}
        className={`group flex items-stretch gap-4 rounded-3xl border border-white/[0.06] bg-white/[0.03] p-3 backdrop-blur-2xl transition-all ${
          clickable ? 'hover:border-white/15 hover:bg-white/[0.05]' : ''
        }`}
      >
        {/* Thumbnail */}
        <div className="relative aspect-[9/16] w-20 shrink-0 overflow-hidden rounded-2xl bg-white/[0.04] sm:w-24">
          {video.thumbnail_url ? (
            <img
              src={video.thumbnail_url}
              alt={video.title ?? 'Source video'}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-600">
              <i className={`fab ${icon} text-2xl`} />
            </div>
          )}
          <span className="absolute bottom-1.5 left-1.5 flex h-6 w-6 items-center justify-center rounded-lg bg-black/60 text-white backdrop-blur-md">
            <i className={`fab ${icon} text-xs`} />
          </span>
        </div>

        {/* Meta */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 py-1 pr-2">
          {video.title && (
            <p className="line-clamp-2 text-sm font-bold leading-snug text-white">{video.title}</p>
          )}
          {video.handle && (
            <span className="truncate text-xs font-semibold text-slate-400">
              {video.handle.startsWith('@') ? video.handle : `@${video.handle}`}
            </span>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {hasMultiple && (
              <span className="inline-flex items-center rounded-lg bg-gradient-to-br from-pink-500 via-fuchsia-500 to-purple-600 px-2 py-0.5 text-[11px] font-black text-white shadow-lg shadow-pink-500/30">
                {formatMultiple(video.multiple)}
              </span>
            )}
            {hasViews && (
              <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] font-bold text-slate-300">
                <i className="fas fa-eye text-[9px] text-slate-500" />
                {compactCount(video.views)}
              </span>
            )}
            {clickable && (
              <span className="ml-auto text-[11px] font-bold text-slate-500 transition-colors group-hover:text-pink-300">
                Open <i className="fas fa-arrow-up-right-from-square ml-0.5 text-[9px]" />
              </span>
            )}
          </div>
        </div>
      </Wrapper>
    </div>
  )
}
