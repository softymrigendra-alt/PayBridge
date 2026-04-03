import { ReactNode } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const posClass: Record<string, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowPos: Record<string, string> = {
    top: 'top-full left-1/2 -translate-x-1/2 -mt-1',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 -mb-1',
    left: 'left-full top-1/2 -translate-y-1/2 -ml-1',
    right: 'right-full top-1/2 -translate-y-1/2 -mr-1',
  };

  return (
    <span className="relative inline-flex group/tt">
      {children}
      <span
        className={`absolute z-50 px-2.5 py-1.5 text-xs font-medium text-white bg-gray-800 rounded-md whitespace-nowrap opacity-0 group-hover/tt:opacity-100 transition-opacity duration-150 pointer-events-none shadow-sm ${posClass[position]}`}
        role="tooltip"
      >
        {content}
        <span className={`absolute w-2 h-2 bg-gray-800 rotate-45 ${arrowPos[position]}`} />
      </span>
    </span>
  );
}
