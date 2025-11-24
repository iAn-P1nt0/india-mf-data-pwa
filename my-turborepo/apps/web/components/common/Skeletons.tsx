'use client';

export function FundCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4 animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-3/4" />
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-8 bg-gray-200 rounded" />
        <div className="h-8 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

export function FundListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <FundCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3" />
      <div className="h-64 bg-gray-100 rounded" />
      <div className="h-4 bg-gray-200 rounded w-2/3" />
    </div>
  );
}

export function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-lg border border-gray-200 p-4 space-y-2"
        >
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="h-8 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-3 border-b">
        <div className="h-4 bg-gray-200 rounded w-4/5" />
      </td>
      <td className="px-4 py-3 border-b">
        <div className="h-4 bg-gray-200 rounded" />
      </td>
      <td className="px-4 py-3 border-b">
        <div className="h-4 bg-gray-200 rounded" />
      </td>
      <td className="px-4 py-3 border-b">
        <div className="h-4 bg-gray-200 rounded w-2/3" />
      </td>
    </tr>
  );
}

export function TableSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-4 py-3 text-left" />
            <th className="px-4 py-3 text-left" />
            <th className="px-4 py-3 text-left" />
            <th className="px-4 py-3 text-left" />
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRowSkeleton key={i} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function InputSkeleton() {
  return <div className="h-10 bg-gray-200 rounded w-full animate-pulse" />;
}

export function ButtonSkeleton() {
  return <div className="h-10 bg-gray-300 rounded w-24 animate-pulse" />;
}
