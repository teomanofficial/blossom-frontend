// Shared helper functions for analysis detail components

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(Math.round(n))
}

export const fmtTime = (sec: number | null | undefined) => {
  if (sec == null) return '--';
  const m = Math.floor(sec / 60);
  const s = String(Math.round(sec) % 60).padStart(2, '0');
  return `${m}:${s}`;
};

export const categoryColors: Record<string, string> = {
  hook_visual: 'bg-pink-500/20 text-pink-400',
  hook_audio: 'bg-purple-500/20 text-purple-400',
  hook_text: 'bg-blue-500/20 text-blue-400',
  hook_structural: 'bg-indigo-500/20 text-indigo-400',
  pacing: 'bg-teal-500/20 text-teal-400',
  emotional: 'bg-rose-500/20 text-rose-400',
  visual_style: 'bg-amber-500/20 text-amber-400',
  audio_design: 'bg-violet-500/20 text-violet-400',
  text_overlay: 'bg-cyan-500/20 text-cyan-400',
  framing_angle: 'bg-emerald-500/20 text-emerald-400',
  content_structure: 'bg-sky-500/20 text-sky-400',
  shareability: 'bg-orange-500/20 text-orange-400',
  engagement_bait: 'bg-yellow-500/20 text-yellow-400',
  trend_leverage: 'bg-lime-500/20 text-lime-400',
  identity_signal: 'bg-fuchsia-500/20 text-fuchsia-400',
};

export const getCategoryColor = (cat: string) =>
  categoryColors[cat?.toLowerCase()?.replace(/\s+/g, '_')] || 'bg-white/10 text-slate-300';

export const scoreColor = (score: number) =>
  score >= 70 ? 'text-teal-400' : score >= 40 ? 'text-yellow-400' : 'text-red-400';

export const scoreBarColor = (score: number) =>
  score >= 70
    ? 'from-teal-500 to-teal-400'
    : score >= 40
    ? 'from-yellow-500 to-yellow-400'
    : 'from-red-500 to-red-400';

export const effortColor = (effort: string) => {
  const e = effort?.toLowerCase();
  if (e === 'low') return 'bg-teal-400/10 text-teal-400';
  if (e === 'medium') return 'bg-yellow-400/10 text-yellow-400';
  return 'bg-red-400/10 text-red-400';
};
