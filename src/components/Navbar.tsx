import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, signOut } = useAuth()

  return (
    <nav className="fixed w-full z-50 px-4 sm:px-6 py-4 sm:py-6">
      <div className="max-w-7xl mx-auto glass-card rounded-[2rem] px-6 sm:px-8 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo-light.png" alt="Blossom" className="w-10 h-10" />
          <span className="text-2xl font-bold tracking-tighter">Blossom</span>
        </Link>

        <div className="hidden lg:flex items-center gap-10 text-sm font-semibold text-slate-400">
          <a href="#results" className="hover:text-white transition-colors">The Playbook</a>
          <a href="#system" className="hover:text-white transition-colors">The System</a>
          <a href="#influence" className="hover:text-white transition-colors">Influence</a>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="hidden sm:block text-sm font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              <button
                onClick={signOut}
                className="text-sm font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden sm:block text-sm font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="bg-white text-slate-900 font-bold py-2.5 px-6 rounded-2xl glow-button text-sm tracking-tight"
              >
                Start Now
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
