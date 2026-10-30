import React from 'react';

interface LogoProps {
  className?: string;
  size?: number | string;
  alt?: string;
}

export const Logo: React.FC<LogoProps> = ({
  className = 'w-9 h-9',
  size,
  alt = 'HabitFlow Logo',
}) => {
  return (
    <img
      src="/logo.png"
      alt={alt}
      width={size}
      height={size}
      className={`object-contain flex-shrink-0 select-none ${className}`}
      loading="eager"
      decoding="async"
    />
  );
};

export default Logo;

