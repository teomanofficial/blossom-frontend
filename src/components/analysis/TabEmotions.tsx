interface TabEmotionsProps {
  full: any
}

export default function TabEmotions({ full }: TabEmotionsProps) {
  return (
    <div className="space-y-6">
      {/* Primary Emotion */}
      {full?.emotional_architecture?.primary_emotion && (
        <div className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Primary Emotion</div>
          <div className="text-2xl sm:text-4xl font-black gradient-text capitalize">{full.emotional_architecture.primary_emotion.replace(/[_-]/g, ' ')}</div>
        </div>
      )}

      {/* Emotion Shifts */}
      {full?.emotional_architecture?.emotion_shifts && full.emotional_architecture.emotion_shifts.length > 0 && (
        <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6">
          <h3 className="text-lg font-bold text-white mb-4">
            <i className="fas fa-exchange-alt mr-2 text-rose-400 text-sm"></i>Emotion Shifts
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            {full.emotional_architecture.emotion_shifts.map((shift: string, idx: number) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-full text-xs font-black bg-rose-500/10 text-rose-400 capitalize">
                  {shift.replace(/[_-]/g, ' ')}
                </span>
                {idx < full.emotional_architecture.emotion_shifts.length - 1 && (
                  <i className="fas fa-arrow-right text-slate-600 text-[10px]"></i>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emotional Architecture Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {full?.emotional_architecture?.arousal_curve && (
          <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
              <i className="fas fa-chart-line mr-1"></i>Arousal Curve
            </div>
            <p className="text-sm font-bold text-white capitalize">{full.emotional_architecture.arousal_curve.replace(/[_-]/g, ' ')}</p>
          </div>
        )}
        {full?.emotional_architecture?.specificity_level && (
          <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
              <i className="fas fa-microscope mr-1"></i>Specificity Level
            </div>
            <p className="text-sm font-bold text-white capitalize">{full.emotional_architecture.specificity_level.replace(/[_-]/g, ' ')}</p>
          </div>
        )}
        {full?.emotional_architecture?.opinion_strength && (
          <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
              <i className="fas fa-fist-raised mr-1"></i>Opinion Strength
            </div>
            <p className="text-sm font-bold text-white capitalize">{full.emotional_architecture.opinion_strength.replace(/[_-]/g, ' ')}</p>
          </div>
        )}
        {full?.emotional_architecture?.relatability_moment && (
          <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
              <i className="fas fa-users mr-1"></i>Relatability Moment
            </div>
            <p className="text-sm text-slate-300">{full.emotional_architecture.relatability_moment}</p>
          </div>
        )}
      </div>
    </div>
  )
}
