import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="py-16 px-6 border-t border-white/5 bg-black/30">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10 text-slate-500 text-sm">
        <Link to="/" className="flex items-center gap-2 font-black text-white text-2xl tracking-tighter">
          <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-orange-400 rounded-lg flex items-center justify-center shadow-lg shadow-pink-500/20">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.22.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
            </svg>
          </div>
          Blossom AI
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
