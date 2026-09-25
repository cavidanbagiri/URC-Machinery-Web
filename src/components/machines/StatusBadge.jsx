// src/components/machines/StatusBadge.jsx

const COLORS = {
  green: 'bg-green-100 text-green-700 ring-green-200',
  yellow: 'bg-yellow-100 text-yellow-700 ring-yellow-200',
  blue: 'bg-blue-100 text-blue-700 ring-blue-200',
  red: 'bg-red-100 text-red-700 ring-red-200',
  gray: 'bg-gray-100 text-gray-700 ring-gray-200',
};

export default function StatusBadge({ status }) {
  if (!status) {
    return (
      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-gray-400 ring-1 ring-inset ring-gray-200">
        —
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
        COLORS[status.color] || COLORS.gray
      }`}
    >
      {status.name}
    </span>
  );
}