/** External CDN domains that use expiring/signed URLs */
const BLOCKED_DOMAINS = [
  'tiktokcdn', 'tiktok.com',
  'cdninstagram.com', 'fbcdn.net', 'instagram.com',
]

/**
 * Resolves a Supabase Storage local path to a usable URL.
 * Rejects external CDN URLs (tiktokcdn, cdninstagram, etc.) — those expire.
 */
export function getStorageUrl(localPath: string | null | undefined): string | null {
  if (!localPath) return null
  if (localPath.startsWith('http')) {
    if (BLOCKED_DOMAINS.some(d => localPath.includes(d))) return null
    return localPath
  }
  return `/media/${localPath.split('/').pop()}`
}
