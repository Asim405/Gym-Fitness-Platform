export default function StatCard({ label, value, accent = 'emerald' }) {
  const accents = {
    emerald: 'text-emerald-600 bg-emerald-50',
    amber: 'text-amber-600 bg-amber-50',
    sky: 'text-sky-600 bg-sky-50',
    rose: 'text-rose-600 bg-rose-50',
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className={`inline-block text-xs font-medium px-2 py-1 rounded-full mb-3 ${accents[accent]}`}>
        {label}
      </div>
      <div className="text-3xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}
