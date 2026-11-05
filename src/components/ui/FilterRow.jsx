// src/components/ui/FilterRow.jsx
// Excel-style filter row: a second <thead> row that holds one small input or
// select per column. Values live in the page's redux slice, so typing here goes
// through the same debounced fetch the old filter panels used.
import { XMarkIcon } from '@heroicons/react/24/outline';

const CELL_CLASS =
  'border-t border-gray-200 bg-gray-50 px-3 py-1 align-top font-normal normal-case';
const CONTROL_CLASS =
  'w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-[11px] font-normal normal-case tracking-normal text-gray-800 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-200';

function isFilled(value) {
  return value !== '' && value !== null && value !== undefined;
}

function normalizeOptions(options) {
  return (options || [])
    .map((option) => {
      if (option === null || option === undefined) return null;
      if (typeof option === 'object') {
        const value = option.value ?? option.id;
        const label = option.label ?? option.name;
        if (value === undefined || label === undefined) return null;
        return { value: String(value), label: String(label) };
      }
      return { value: String(option), label: String(option) };
    })
    .filter(Boolean);
}

function TextControl({ fieldKey, value, placeholder, label, onChange }) {
  const filled = isFilled(value);
  const text = label || placeholder || 'Kolon';

  return (
    <div className="relative">
      <input
        type="text"
        value={value ?? ''}
        onChange={(event) => onChange?.(fieldKey, event.target.value)}
        placeholder={placeholder || label}
        aria-label={`${text} filtresi`}
        title={text}
        className={`${CONTROL_CLASS} ${filled ? 'pr-6' : ''}`}
      />
      {filled && (
        <button
          type="button"
          onClick={() => onChange?.(fieldKey, '')}
          title={`${text} filtresini temizle`}
          aria-label={`${text} filtresini temizle`}
          className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
        >
          <XMarkIcon className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

function SelectControl({
  fieldKey,
  value,
  options,
  extraOptions,
  placeholder,
  label,
  onChange,
}) {
  const allOptions = [
    ...normalizeOptions(options),
    ...normalizeOptions(extraOptions),
  ];
  const text = label || placeholder || 'Kolon';

  return (
    <select
      value={value ?? ''}
      onChange={(event) => onChange?.(fieldKey, event.target.value)}
      aria-label={`${text} filtresi`}
      title={text}
      className={`${CONTROL_CLASS} cursor-pointer`}
    >
      <option value="">{placeholder || 'Tümü'}</option>
      {allOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function DateControl({ fieldKey, value, label, onChange }) {
  return (
    <input
      type="date"
      value={value ?? ''}
      onChange={(event) => onChange?.(fieldKey, event.target.value)}
      aria-label={`${label} filtresi`}
      title={label}
      className={CONTROL_CLASS}
    />
  );
}

function renderCell(column, values, onChange, index) {
  if (!column) return null;

  switch (column.kind) {
    case 'actions':
      return null;

    case 'select':
      return (
        <SelectControl
          fieldKey={column.key}
          value={isFilled(column.value) ? column.value : values[column.key]}
          options={column.options}
          extraOptions={column.extraOptions}
          placeholder={column.placeholder}
          label={column.label}
          onChange={onChange}
        />
      );

    case 'dateRange':
      return (
        <div className="flex flex-col gap-1">
          {column.keys.map((fieldKey, position) => (
            <DateControl
              key={fieldKey}
              fieldKey={fieldKey}
              value={values[fieldKey]}
              label={
                column.labels?.[position] ||
                `${column.label || 'Tarih'} ${
                  position === 0 ? 'başlangıç' : 'bitiş'
                }`
              }
              onChange={onChange}
            />
          ))}
        </div>
      );

    case 'stack':
      return (
        <div className="flex flex-col gap-1">
          {column.fields.map((field) =>
            field.kind === 'select' || field.options ? (
              <SelectControl
                key={field.key}
                fieldKey={field.key}
                value={field.value ?? values[field.key]}
                options={field.options}
                extraOptions={field.extraOptions}
                placeholder={field.placeholder || field.label}
                label={field.label || field.placeholder}
                onChange={onChange}
              />
            ) : (
              <TextControl
                key={field.key}
                fieldKey={field.key}
                value={values[field.key]}
                placeholder={field.placeholder}
                label={field.label || field.placeholder}
                onChange={onChange}
              />
            )
          )}
        </div>
      );

    default:
      return (
        <TextControl
          fieldKey={column.key ?? `column-${index}`}
          value={values[column.key]}
          placeholder={column.placeholder}
          label={column.label}
          onChange={onChange}
        />
      );
  }
}

export default function FilterRow({ columns = [], values = {}, onChange }) {
  return (
    <tr>
      {columns.map((column, index) => {
        const cellKey =
          column?.key ||
          (column?.fields || column?.keys || [])
            .map((field) => field.key || field)
            .join('-') ||
          `cell-${index}`;

        return (
          <th
            key={cellKey}
            scope="col"
            className={`${CELL_CLASS} ${
              column?.kind === 'actions' ? 'text-right' : 'text-left'
            }`}
          >
            {renderCell(column, values, onChange, index)}
          </th>
        );
      })}
    </tr>
  );
}
