/**
 * Vanity chart data generators — admin-only, frontend-only.
 * Creates realistic-looking chart data for marketing screenshots.
 */

export type GrowthPattern = 'steady' | 'exponential' | 'viral-spike' | 'hockey-stick'

interface VanityChartConfig {
  /** Multiply existing values by this factor */
  multiplier: number
  /** Growth pattern to apply */
  pattern: GrowthPattern
  /** Number of data points to generate if no real data */
  days: number
  /** Base value (starting point when generating from scratch) */
  baseValue: number
}

const DEFAULT_CONFIG: VanityChartConfig = {
  multiplier: 1,
  pattern: 'steady',
  days: 30,
  baseValue: 100,
}

/** Generate dates going back N days from today */
function generateDates(days: number): string[] {
  const dates: string[] = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    dates.push(d.toISOString().split('T')[0]!)
  }
  return dates
}

/** Apply a growth pattern to a normalized 0..1 progress value */
function patternCurve(t: number, pattern: GrowthPattern): number {
  switch (pattern) {
    case 'steady':
      return 1 + t * 0.8 // gentle 80% growth over the period
    case 'exponential':
      return Math.pow(2, t * 2.5) // ~5.6x growth
    case 'viral-spike': {
      // builds slowly, then spikes at ~75% through
      if (t < 0.6) return 1 + t * 0.5
      if (t < 0.75) return 1.3 + (t - 0.6) * 20
      return 4.3 + (t - 0.75) * 4
    }
    case 'hockey-stick': {
      // flat then sharp upturn at ~60%
      if (t < 0.6) return 1 + t * 0.2
      return 1.12 + Math.pow((t - 0.6) / 0.4, 2.5) * 6
    }
    default:
      return 1
  }
}

/** Add natural-looking noise (±percentage) */
function addNoise(value: number, noisePct: number = 0.08): number {
  const noise = 1 + (Math.random() - 0.5) * 2 * noisePct
  return Math.max(0, Math.round(value * noise))
}

/* ─── Views Over Time ─── */

export interface VanityViewsPoint {
  date: string
  views: number
}

export function generateVanityViews(
  realData: Array<{ date: string; views: number }>,
  config: Partial<VanityChartConfig> = {}
): VanityViewsPoint[] {
  const c = { ...DEFAULT_CONFIG, ...config }

  // If we have real data, scale it
  if (realData.length > 0) {
    return realData.map((d, i) => {
      const t = realData.length > 1 ? i / (realData.length - 1) : 0.5
      const curve = patternCurve(t, c.pattern)
      return {
        date: d.date,
        views: addNoise(d.views * c.multiplier * curve),
      }
    })
  }

  // Generate from scratch
  const dates = generateDates(c.days)
  return dates.map((date, i) => {
    const t = dates.length > 1 ? i / (dates.length - 1) : 0.5
    const curve = patternCurve(t, c.pattern)
    return {
      date,
      views: addNoise(c.baseValue * c.multiplier * curve),
    }
  })
}

/* ─── Follower Growth ─── */

export interface VanityFollowerPoint {
  date: string
  follower_count: number
  platform: string
  username: string
}

export function generateVanityFollowers(
  realData: Array<{ date: string; follower_count: number; platform?: string; username?: string }>,
  config: Partial<VanityChartConfig> = {}
): VanityFollowerPoint[] {
  const c = { ...DEFAULT_CONFIG, baseValue: 500, ...config }

  if (realData.length > 0) {
    // Group by platform/username, apply pattern to each series
    const seriesMap = new Map<string, typeof realData>()
    realData.forEach(d => {
      const key = `${d.platform || 'instagram'}|${d.username || 'user'}`
      if (!seriesMap.has(key)) seriesMap.set(key, [])
      seriesMap.get(key)!.push(d)
    })

    const result: VanityFollowerPoint[] = []
    seriesMap.forEach((points) => {
      // Followers should be monotonically increasing (cumulative)
      let prev = 0
      points.forEach((d, i) => {
        const t = points.length > 1 ? i / (points.length - 1) : 0.5
        const curve = patternCurve(t, c.pattern)
        const val = Math.max(prev, Math.round(d.follower_count * c.multiplier * curve))
        prev = val
        result.push({
          date: d.date,
          follower_count: addNoise(val, 0.02), // less noise for followers
          platform: d.platform || 'instagram',
          username: d.username || 'user',
        })
      })
    })
    return result
  }

  // Generate from scratch — single platform
  const dates = generateDates(c.days)
  let prev = c.baseValue * c.multiplier
  return dates.map((date, i) => {
    const t = dates.length > 1 ? i / (dates.length - 1) : 0.5
    const curve = patternCurve(t, c.pattern)
    const val = Math.max(prev, Math.round(c.baseValue * c.multiplier * curve))
    prev = val
    return {
      date,
      follower_count: addNoise(val, 0.015),
      platform: 'instagram',
      username: 'creator',
    }
  })
}

/* ─── Engagement Trend ─── */

export interface VanityEngagementPoint {
  date: string
  posts: number
  views: number
  likes: number
  comments: number
}

export function generateVanityEngagement(
  realData: Array<{ date: string; posts: number; views: number; likes: number; comments: number }>,
  config: Partial<VanityChartConfig> = {}
): VanityEngagementPoint[] {
  const c = { ...DEFAULT_CONFIG, ...config }

  if (realData.length > 0) {
    return realData.map((d, i) => {
      const t = realData.length > 1 ? i / (realData.length - 1) : 0.5
      const curve = patternCurve(t, c.pattern)
      return {
        date: d.date,
        posts: Math.max(1, addNoise(d.posts * Math.max(1, c.multiplier * 0.1), 0.15)),
        views: addNoise(d.views * c.multiplier * curve),
        likes: addNoise(d.likes * c.multiplier * curve * 0.9),
        comments: addNoise(d.comments * c.multiplier * curve * 0.7),
      }
    })
  }

  // Generate from scratch
  const dates = generateDates(c.days)
  return dates.map((date, i) => {
    const t = dates.length > 1 ? i / (dates.length - 1) : 0.5
    const curve = patternCurve(t, c.pattern)
    const views = addNoise(c.baseValue * c.multiplier * curve)
    return {
      date,
      posts: Math.max(1, addNoise(2 + Math.random() * 3, 0.2)),
      views,
      likes: addNoise(views * 0.06),
      comments: addNoise(views * 0.008),
    }
  })
}
