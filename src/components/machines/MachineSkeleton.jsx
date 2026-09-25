// src/components/machines/MachineSkeleton.jsx
export default function MachineSkeleton({ rows = 5 }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            {[...Array(9)].map((_, i) => (
              <th key={i} className="px-6 py-3 text-left">
                <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {[...Array(rows)].map((_, i) => (
            <tr key={i}>
              {[...Array(9)].map((_, j) => (
                <td key={j} className="px-6 py-4">
                  <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}