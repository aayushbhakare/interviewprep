import React from 'react';
import { Link } from 'react-router-dom';

/**
 * BrandLogo — Geometric globe emblem and InterviewPrep wordmark.
 * Inspired by the Stitch design system reference.
 */
export default function BrandLogo({
  size = 32,
  showWordmark = true,
  subtitle = null,
  linkTo = '/',
  className = '',
  textColor = 'text-slate-900',
  accentColor = 'text-sky-500',
}) {
  const emblem = (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-200 group-hover:scale-105"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="brandGlobeGrad" x1="10" y1="10" x2="110" y2="110" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
          <linearGradient id="brandAccentGrad" x1="20" y1="30" x2="100" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
        </defs>
        {/* Outer Globe Circle */}
        <circle cx="60" cy="60" r="48" stroke="url(#brandGlobeGrad)" strokeWidth="6" strokeLinecap="round" />
        {/* Longitudinal Ellipse */}
        <ellipse cx="60" cy="60" rx="26" ry="48" stroke="url(#brandGlobeGrad)" strokeWidth="4.5" strokeOpacity="0.95" />
        {/* Central Axis */}
        <line x1="60" y1="12" x2="60" y2="108" stroke="url(#brandGlobeGrad)" strokeWidth="4" strokeLinecap="round" />
        {/* Latitude Arcs */}
        <path d="M 22 40 Q 60 52 98 40" stroke="url(#brandAccentGrad)" strokeWidth="4" strokeLinecap="round" />
        <path d="M 14 60 Q 60 74 106 60" stroke="url(#brandAccentGrad)" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M 22 80 Q 60 92 98 80" stroke="url(#brandAccentGrad)" strokeWidth="4" strokeLinecap="round" />
        {/* Center Node */}
        <circle cx="60" cy="60" r="8" fill="#0ea5e9" />
        <circle cx="60" cy="60" r="3.5" fill="#ffffff" />
        {/* Polar Pins */}
        <circle cx="60" cy="12" r="5" fill="#0284c7" />
        <circle cx="60" cy="108" r="4" fill="#0284c7" />
      </svg>

      {showWordmark && (
        <div className="flex flex-col">
          <span className={`font-display font-extrabold tracking-tight ${textColor} leading-tight text-lg`}>
            Interview<span className={accentColor}>Prep</span>
          </span>
          {subtitle && (
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 -mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="group inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-lg">
        {emblem}
      </Link>
    );
  }

  return emblem;
}
