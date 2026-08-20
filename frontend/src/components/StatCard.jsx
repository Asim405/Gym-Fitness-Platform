export default function StatCard({ label, value, accent = 'emerald', icon: Icon }) {
  const accents = {
    emerald: {
      border: 'border-emerald-500/20',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-300/70',
    },
    amber: {
      border: 'border-amber-500/20',
      bg: 'bg-amber-500/10',
      text: 'text-amber-300/70',
    },
    sky: {
      border: 'border-sky-500/20',
      bg: 'bg-sky-500/10',
      text: 'text-sky-300/70',
    },
    rose: {
      border: 'border-rose-500/20',
      bg: 'bg-rose-500/10',
      text: 'text-rose-300/70',
    },
  };

  const accentStyle = accents[accent] || accents.emerald;

  return (
    <div className="rounded-xl border border-white/5 bg-[#141a1f]/80 p-5 shadow-2xl shadow-black/30 transition hover:border-white/10">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={`rounded-full p-2.5 ${accentStyle.bg}`}>
            <Icon className={`h-6 w-6 ${accentStyle.text}`} />
          </div>
        )}
        <div>
          <div
            className={`inline-block rounded-full border ${accentStyle.border} ${accentStyle.bg} px-2.5 py-1 text-xs font-medium ${accentStyle.text}`}
          >
            {label}
          </div>
          <div className="mt-1 text-3xl font-light tracking-tight text-white/90">{value}</div>
        </div>
      </div>
    </div>
  );
}