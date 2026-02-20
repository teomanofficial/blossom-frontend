import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

interface Plan {
  id: number
  name: string
  slug: string
  description: string
  price_amount: number
  price_currency: string
  billing_interval: string
  features: string[]
}

const features = [
  {
    icon: (
      <svg className="w-6 h-6 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.047 8.287 8.287 0 009 9.601a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.468 5.99 5.99 0 00-1.925 3.547 5.975 5.975 0 01-2.133-1.001A3.75 3.75 0 0012 18z" />
      </svg>
    ),
    title: 'Viral Formats & Hooks',
    description:
      'Learn the exact tricks and secrets top influencers use to go viral and get millions of views with zero effort.',
  },
  {
    icon: (
      <svg className="w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
      </svg>
    ),
    title: 'Analysis',
    description:
      'Analyze your posts and cover your mistakes instantly. That 1M view milestone is much closer than you think.',
  },
  {
    icon: (
      <svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.518l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
    title: 'Trends',
    description:
      'Learn what is trending worldwide. Master new hooks and tactics to stay one step ahead of everyone else.',
  },
]

export default function Landing() {
  const [plans, setPlans] = useState<Plan[]>([])

  useEffect(() => {
    apiFetch('/api/billing/plans')
      .then((r) => r.json())
      .then((data) => setPlans(data.plans || []))
      .catch(console.error)
  }, [])

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(0)}`

  return (
    <div className="min-h-screen bg-slate-950 overflow-x-hidden">
      {/* Background mesh */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(circle at 10% 20%, rgba(139,92,246,0.15) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(244,114,182,0.15) 0%, transparent 40%)',
        }}
      />

      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-44 pb-24 px-4 sm:px-6 text-center z-10">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-orange-400 text-[11px] font-bold mb-8 tracking-widest uppercase">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67z" />
            </svg>
            THE VIRAL BLUEPRINT
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-8xl font-black mb-8 leading-[1.1] tracking-tight uppercase">
            DO YOU WANT TO GET
            <br />
            <span className="gradient-text text-6xl sm:text-7xl md:text-9xl">
              1M VIEWS?
            </span>
          </h1>

          <p className="text-slate-400 text-base sm:text-lg md:text-xl max-w-3xl mx-auto mb-12 font-medium">
            Do you want to get millions of views? Of course you do—who doesn't!
            <br className="hidden md:block" />
            Learn how to influence people in just 10 seconds. Discover how tiny,
            subtle changes turn hundreds of views into millions of fans.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              to="/signup"
              className="w-full sm:w-auto px-12 py-5 bg-gradient-to-r from-pink-500 to-orange-500 text-white font-black text-lg sm:text-xl rounded-2xl glow-button flex items-center justify-center gap-3 shadow-xl"
            >
              Get Viral Now
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11 21h-1l1-7H7.5c-.88 0-.33-.75-.31-.78C8.48 10.94 10.42 7.54 13.01 3h1l-1 7h3.51c.4 0 .62.19.4.66C12.97 17.55 11 21 11 21z" />
              </svg>
            </Link>
          </div>

          {/* Creator Scorecard Demo */}
          <div className="mt-24 relative px-0 sm:px-4 max-w-5xl mx-auto">
            <div className="absolute inset-0 bg-pink-500/10 blur-[120px] rounded-full" />
            <div className="glass-card rounded-[2rem] sm:rounded-[3.5rem] p-4 sm:p-6 md:p-12 relative overflow-hidden shadow-2xl">
              <div className="flex flex-col lg:flex-row gap-10 items-stretch text-left">
                {/* Post Preview with Scanner */}
                <div className="w-full lg:w-5/12 flex">
                  <div className="relative bg-slate-950 rounded-[2rem] sm:rounded-[2.5rem] p-1.5 border-[4px] border-slate-800 shadow-2xl w-full">
                    <div className="analysis-phone-frame rounded-[1.5rem] sm:rounded-[2rem] h-full overflow-hidden relative" style={{ aspectRatio: '9/16' }}>
                      <img
                        src="/landing-cover.jpg"
                        alt="Content example"
                        className="absolute inset-0 w-full h-full object-cover"
                      />

                      {/* Dark overlay for contrast */}
                      <div className="absolute inset-0 bg-black/20" />

                      {/* Subtle grid texture */}
                      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.05) 1px, rgba(255,255,255,0.05) 2px), repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(255,255,255,0.05) 1px, rgba(255,255,255,0.05) 2px)' }} />

                      {/* Laser scanning beam */}
                      <div className="absolute inset-x-0 analysis-laser-beam z-30" />
                      <div className="absolute inset-x-0 analysis-laser-glow z-20" />

                      {/* Pinging AI nodes */}
                      <div className="analysis-node top-[25%] left-[35%]" style={{ animationDelay: '0.2s' }} />
                      <div className="analysis-node top-[55%] left-[65%]" style={{ animationDelay: '0.9s' }} />
                      <div className="analysis-node top-[78%] left-[40%]" style={{ animationDelay: '1.5s' }} />

                      {/* Center status */}
                      <div className="absolute inset-0 flex items-center justify-center z-10">
                        <div className="p-4 bg-black/70 backdrop-blur-xl rounded-2xl border border-white/10 text-center">
                          <div className="w-10 h-10 mx-auto rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-2">
                            <svg className="w-5 h-5 text-pink-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <div className="text-white font-bold text-sm">
                            Analyzing Hook Patterns...
                          </div>
                          <span className="text-[7px] font-mono tracking-[0.3em] uppercase text-white/30 mt-1 block">Neural Engine v4</span>
                        </div>
                      </div>

                      {/* Bottom warning badge */}
                      <div className="absolute bottom-6 sm:bottom-8 left-4 sm:left-6 right-4 sm:right-6 z-10">
                        <div className="p-3 bg-black/70 backdrop-blur-xl border border-red-500/40 rounded-xl text-red-400 text-[10px] font-black uppercase flex items-center gap-2 shadow-lg shadow-red-500/10">
                          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                          </svg>
                          Low Engagement Probability
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Weakness Breakdown */}
                <div className="w-full lg:w-7/12 space-y-6">
                  <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
                    VIRALITY ANALYSIS
                  </h3>
                  <p className="text-slate-400 font-medium">
                    We found why your post is stuck at 200 views. Cover these
                    mistakes now.
                  </p>

                  <div className="space-y-4">
                    {/* Critical Weakness */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-red-500/5 border border-red-500/20">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-red-400 text-[10px] font-black uppercase tracking-widest">
                          CRITICAL WEAKNESS
                        </span>
                        <span className="text-xs font-bold text-slate-500">
                          HOOK: 22/100
                        </span>
                      </div>
                      <h4 className="font-bold text-base sm:text-lg mb-1">
                        Lack of clear narrative or story
                      </h4>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        The video lacks a compelling narrative hook, which limits
                        deeper engagement and emotional connection with the
                        viewer.
                      </p>
                      <div className="mt-3 p-3 bg-green-500/10 rounded-xl border border-green-500/20 text-green-400 text-[11px] font-bold italic">
                        Fix: Incorporate a brief personal anecdote to add a
                        relatable element.
                      </div>
                    </div>

                    {/* Pacing Error */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-orange-500/5 border border-orange-500/20">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-orange-400 text-[10px] font-black uppercase tracking-widest">
                          PACING ERROR
                        </span>
                        <span className="text-xs font-bold text-slate-500">
                          RETENTION: 45%
                        </span>
                      </div>
                      <h4 className="font-bold text-base sm:text-lg mb-1">
                        Slow Visual Transitions
                      </h4>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        Your frames are too static. Viewers are scrolling away at
                        0.04s because there is no pattern interrupt.
                      </p>
                    </div>

                    {/* Score Cards */}
                    <div className="flex gap-4">
                      <div className="flex-1 p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 text-center">
                        <div className="text-[10px] font-black text-slate-500 uppercase mb-1">
                          Current Reach
                        </div>
                        <div className="text-xl sm:text-2xl font-black text-red-500">
                          LOW
                        </div>
                      </div>
                      <div className="flex-1 p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 text-center">
                        <div className="text-[10px] font-black text-slate-500 uppercase mb-1">
                          Shareability
                        </div>
                        <div className="text-xl sm:text-2xl font-black text-orange-500">
                          POOR
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="results" className="py-24 sm:py-32 px-4 sm:px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 sm:mb-24">
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-black mb-4 tracking-tight">
              THE MAGICAL RECEIPT.
            </h2>
            <p className="text-slate-400 text-base sm:text-lg md:text-xl max-w-xl mx-auto font-medium">
              We don't just predict views—we predict success.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-8 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem] glass-card hover:bg-white/[0.05] transition-all group"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl sm:text-2xl font-black">{feature.title}</h3>
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0 ml-4">
                    {feature.icon}
                  </div>
                </div>
                <p className="text-slate-400 font-medium leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="system" className="py-24 sm:py-32 px-4 sm:px-6 bg-white/[0.02] relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-black mb-4 tracking-tight">
              THE SYSTEM.
            </h2>
            <p className="text-slate-400 text-base sm:text-lg md:text-xl max-w-xl mx-auto font-medium">
              Three steps. Zero guesswork. Maximum influence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
            <div className="relative">
              <div className="text-6xl sm:text-7xl font-black text-pink-500/10 mb-4">01</div>
              <h3 className="text-xl sm:text-2xl font-black mb-3">Upload Your Content</h3>
              <p className="text-slate-400 font-medium leading-relaxed">
                Drop your Instagram Reel or TikTok video. We accept all common
                formats.
              </p>
            </div>
            <div className="relative">
              <div className="text-6xl sm:text-7xl font-black text-orange-500/10 mb-4">02</div>
              <h3 className="text-xl sm:text-2xl font-black mb-3">AI Scans Everything</h3>
              <p className="text-slate-400 font-medium leading-relaxed">
                Our AI examines hooks, pacing, visuals, audio, and compares
                against millions of viral posts.
              </p>
            </div>
            <div className="relative">
              <div className="text-6xl sm:text-7xl font-black text-yellow-500/10 mb-4">03</div>
              <h3 className="text-xl sm:text-2xl font-black mb-3">Get Your Playbook</h3>
              <p className="text-slate-400 font-medium leading-relaxed">
                Receive a detailed scorecard with fixes, viral score, and
                personalized growth recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 sm:py-32 px-4 sm:px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 sm:mb-24">
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-black mb-4 tracking-tight">
              PRICING.
            </h2>
            <p className="text-slate-400 text-base sm:text-lg md:text-xl max-w-xl mx-auto font-medium">
              Choose the plan that matches your ambition.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`glass-card rounded-[2.5rem] p-8 sm:p-10 relative ${
                  plan.slug === 'premium'
                    ? 'border-pink-500/30 ring-1 ring-pink-500/20 scale-105'
                    : ''
                }`}
              >
                {plan.slug === 'premium' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-pink-500 to-orange-400 rounded-full text-[9px] font-black uppercase tracking-widest text-white">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-black mb-1">{plan.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {plan.description}
                  </p>
                </div>

                <div className="mb-8">
                  <span className="text-5xl font-black">
                    {formatPrice(plan.price_amount)}
                  </span>
                  <span className="text-sm text-slate-500 font-semibold">
                    /{plan.billing_interval}
                  </span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature: string, i: number) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <svg className="w-4 h-4 text-teal-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-slate-300 font-medium">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/signup"
                  className={`block w-full py-4 rounded-2xl text-sm font-black text-center transition-all ${
                    plan.slug === 'premium'
                      ? 'bg-gradient-to-r from-pink-500 to-orange-400 text-white glow-button hover:scale-105'
                      : 'bg-white/10 hover:bg-white/15 border border-white/10 text-white'
                  }`}
                >
                  Start Free Trial
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="influence" className="py-32 sm:py-44 px-4 sm:px-6 text-center relative z-10">
        <h2 className="text-4xl sm:text-5xl md:text-8xl font-black mb-10 leading-tight tracking-tight uppercase italic">
          Let's
          <br />
          <span className="gradient-text">Influence!</span>
        </h2>
        <div className="max-w-3xl mx-auto">
          <p className="text-slate-400 text-lg sm:text-xl md:text-2xl mb-12 font-medium leading-relaxed">
            Going viral is about more than just cool music and video quality. It
            is about <strong className="text-white">human psychology</strong>.
            We are going to show you exactly how to capture someone's mind in
            just 10 seconds.
          </p>
          <Link
            to="/signup"
            className="inline-block px-10 sm:px-14 py-5 sm:py-6 bg-white text-black font-black text-xl sm:text-2xl rounded-[2.5rem] glow-button hover:scale-105 transition-transform uppercase tracking-tighter"
          >
            Show Me The Secrets
            <svg className="w-5 h-5 inline-block ml-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67z" />
            </svg>
          </Link>
        </div>
        <div className="mt-12 flex flex-wrap justify-center gap-6 sm:gap-10 text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em]">
          <span>Psychology-Driven</span>
          <span>Error-Correction</span>
          <span>Peak Influence</span>
        </div>
      </section>

      <Footer />
    </div>
  )
}
