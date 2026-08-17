/** Reusable skeleton loader components */

function SkeletonBlock({ className = '' }) {
  return <div className={`skeleton-shimmer rounded ${className}`} />;
}

export function SkeletonStatCard() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <SkeletonBlock className="h-3 w-20 mb-3" />
      <SkeletonBlock className="h-8 w-28 mb-2" />
      <SkeletonBlock className="h-3 w-16" />
    </div>
  );
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-3">
      <SkeletonBlock className="h-4 w-40" />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBlock key={i} className={`h-3 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} />
      ))}
    </div>
  );
}

export function SkeletonRow({ cols = 5 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <SkeletonBlock className="h-3 w-full" />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonText({ className = 'h-3 w-full' }) {
  return <SkeletonBlock className={className} />;
}

/** Default: full page skeleton (4 stat cards + table) */
export default function Skeleton({ cols = 5, rows = 6 }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)}
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <SkeletonBlock className="h-4 w-40" />
        </div>
        <table className="w-full">
          <tbody>
            {Array.from({ length: rows }).map((_, i) => <SkeletonRow key={i} cols={cols} />)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
