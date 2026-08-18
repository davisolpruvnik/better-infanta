// src/components/ui/WeatherIcon.tsx
import React from 'react';

// Eagerly bundles all static fill icons from @meteocons/svg-static
const staticIcons = import.meta.glob(
  '/node_modules/@meteocons/svg-static/flat/*.svg',
  { eager: true, import: 'default' }
) as Record<string, string>;

interface MeteoIconProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  name: string;
  className?: string;
}

export default function MeteoIcon({
  name,
  className = 'w-10 h-10',
  alt = 'weather icon',
  ...props
}: MeteoIconProps) {
  // Resolve static SVG path
  const iconPath = `/node_modules/@meteocons/svg-static/flat/${name}.svg`;
  const iconSrc = staticIcons[iconPath] || staticIcons['/node_modules/@meteocons/svg-static/flat/cloudy.svg'];

  if (!iconSrc) return null;

  return (
    <img
      src={iconSrc}
      alt={alt}
      className={`select-none pointer-events-none ${className}`}
      loading="lazy"
      {...props}
    />
  );
}
