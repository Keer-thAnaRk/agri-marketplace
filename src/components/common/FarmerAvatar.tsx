'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface FarmerAvatarProps {
  src?: string | null;
  name: string;
  className?: string;
  size?: number;
  alt?: string;
}

export function FarmerAvatar({
  src,
  name,
  className = 'w-10 h-10 rounded-2xl',
  size = 48,
  alt,
}: FarmerAvatarProps) {
  const [hasError, setHasError] = useState(false);

  // Generate clean initials from the farmer's name
  const initials = (name || '')
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'FM';

  const hasValidPhoto = Boolean(src && !hasError && src.trim() !== '');

  if (hasValidPhoto && src) {
    return (
      <div className={`relative overflow-hidden shrink-0 select-none ${className}`}>
        <Image
          src={src}
          alt={alt || name || 'Farmer profile'}
          fill
          className="object-cover"
          sizes={`${size}px`}
          onError={() => setHasError(true)}
          unoptimized={src.startsWith('data:') || src.startsWith('blob:')}
        />
      </div>
    );
  }

  return (
    <div
      aria-label={name}
      className={`bg-forest-800 text-white font-extrabold flex items-center justify-center shrink-0 uppercase tracking-wider select-none shadow-2xs ${className}`}
    >
      <span>{initials}</span>
    </div>
  );
}

export default FarmerAvatar;
