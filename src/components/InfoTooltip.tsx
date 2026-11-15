// Generated with AI assistance (Antigravity). Reviewed by the team.
import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  text: string;
  title?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  text,
  title,
  position = 'top',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className={`relative inline-flex items-center align-middle ${className}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onBlur={() => setIsOpen(false)}
    >
      <button
        type="button"
        className="w-4 h-4 rounded-full flex items-center justify-center text-muted hover:text-primary transition-colors focus:outline-none focus:ring-1 focus:ring-primary/40"
        aria-label={title || 'Information'}
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div
          role="tooltip"
          className={`absolute ${positionClasses[position]} z-50 w-64 max-w-xs p-2.5 rounded-xl bg-ink text-white text-[11px] leading-relaxed shadow-xl border border-white/10 pointer-events-none animate-in fade-in zoom-in-95 duration-150 backdrop-blur-sm`}
        >
          {title && <div className="font-bold text-mint-light text-xs mb-1">{title}</div>}
          <div className="text-white/90">{text}</div>
        </div>
      )}
    </div>
  );
};
