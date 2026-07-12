import type { HTMLAttributes } from 'react';

interface BrandLogoProps extends HTMLAttributes<HTMLDivElement> {
  showText?: boolean;
  textClassName?: string;
}

export default function BrandLogo({ showText = true, className = '', textClassName = '', ...props }: BrandLogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`} {...props}>
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground shadow-sm shadow-primary/20">
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" aria-hidden="true">
          <path d="M6 14.5L10.4 9.5L14.8 14.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9.2 15.8L9.2 8.2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          <path d="M14.8 14.5L19 9.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M19 14.5L14.8 19.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {showText && (
        <span className={`font-semibold text-[0.9375rem] tracking-tight ${textClassName}`}>TransitOps</span>
      )}
    </div>
  );
}
