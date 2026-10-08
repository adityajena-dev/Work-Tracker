import React from 'react';
import { CapacitySettings } from '../types/work';
import { Clock, Scissors } from 'lucide-react';
import { formatDuration } from '../utils/priority';

interface HeaderProps {
  capacity: CapacitySettings;
  onOpenCapacity: () => void;
}

export const Header: React.FC<HeaderProps> = ({ capacity, onOpenCapacity }) => {
  return (
    <header className="bg-teal-800 text-white px-3.5 sm:px-5 py-3 sm:py-3.5 shadow-xs safe-top sticky top-0 z-30">
      <div className="max-w-md mx-auto flex items-center justify-between gap-2.5">
        {/* Title */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <Scissors className="w-4 h-4 sm:w-5 sm:h-5 text-teal-200 shrink-0" />
          </div>
          <div className="truncate min-w-0 flex-1">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight truncate">
              Blouse Work Planner
            </h1>
            <p className="text-[11px] sm:text-xs text-teal-200 font-medium truncate">
              Personal Work Assistant
            </p>
          </div>
        </div>

        {/* Capacity Button */}
        <button
          onClick={onOpenCapacity}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-xs font-semibold text-teal-50 border border-white/20 shrink-0 whitespace-nowrap"
          title="Change comfortable daily capacity"
        >
          <Clock className="w-3.5 h-3.5 text-teal-200 shrink-0" />
          <span>{formatDuration(capacity.dailyCapacityMinutes)} / day</span>
        </button>
      </div>
    </header>
  );
};
