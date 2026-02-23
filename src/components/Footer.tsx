import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="py-16 px-6 border-t border-white/5 bg-black/30">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10 text-slate-500 text-sm">
        <Link to="/" className="flex items-center gap-2 font-black text-white text-2xl tracking-tighter">
          <img src="/logo-light.png" alt="Blossom" className="w-8 h-8" />
          Blossom
        </Link>
        <div className="font-medium">Turning content into culture.</div>
        <div className="flex gap-8 font-bold uppercase tracking-widest text-[11px]">
          <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
          <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          <Link to="/signup" className="hover:text-white transition-colors">Join the Elite</Link>
        </div>
      </div>
    </footer>
  )
}
