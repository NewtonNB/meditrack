import { useApi } from '../hooks/useApi';
import { system } from '../api';

export default function SystemOverview() {
  const { data, loading, error } = useApi(() => system.stats());
  const stats = data ?? {};

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading system overview…</div>;
  if (error)   return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">System Overview</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(stats).map(([key, value]) => (
          <div key={key} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-wide">{key.replace(/_/g, ' ')}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{JSON.stringify(value)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
