// src/components/ui/FlaticonIcon.jsx
// Uicons by Flaticon — https://www.flaticon.com/uicons
const SIZE_CLASSES = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
};

/**
 * Flaticon Uicons (regular rounded) ikonunu tek bir yerden kullanmak için.
 *
 * @param {string} name - "fi-rr-" öneki olmadan ikon adı (ör. "truck-side").
 * @param {keyof typeof SIZE_CLASSES | string} [size] - Hazır boyut veya
 *   doğrudan Tailwind font-size sınıfı (ör. "text-[18px]").
 */
export default function FlaticonIcon({
  name,
  size,
  className = '',
  title,
  ...props
}) {
  if (!name) return null;

  const sizeClass = size ? SIZE_CLASSES[size] || size : '';

  return (
    <i
      className={`fi fi-rr-${name} inline-block shrink-0 leading-none ${sizeClass} ${className}`}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      role={title ? 'img' : undefined}
      title={title}
      {...props}
    />
  );
}
