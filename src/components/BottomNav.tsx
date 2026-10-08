import React from 'react';
import { ActiveTab } from '../types/work';
import { Home, List, Calendar, Check, Plus } from 'lucide-react';

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenAddModal: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  onOpenAddModal
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-200 shadow-lg safe-bottom">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-1 relative">
        {/* Tab 1: Home */}
        <button
          onClick={() => onTabChange('home')}
          className={`flex-1 min-h-[52px] py-1 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
            activeTab === 'home'
              ? 'text-teal-800 font-bold'
              : 'text-stone-500 hover:text-stone-800 font-medium'
          }`}
        >
          <Home className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
          <span className="text-[11px] leading-none">Home</span>
        </button>

        {/* Tab 2: Work */}
        <button
          onClick={() => onTabChange('work')}
          className={`flex-1 min-h-[52px] py-1 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
            activeTab === 'work'
              ? 'text-teal-800 font-bold'
              : 'text-stone-500 hover:text-stone-800 font-medium'
          }`}
        >
          <List className={`w-5 h-5 ${activeTab === 'work' ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
          <span className="text-[11px] leading-none">All Work</span>
        </button>

        {/* Center Action: + Add Blouse */}
        <div className="flex-1 flex justify-center -mt-6">
          <button
            onClick={onOpenAddModal}
            className="w-14 h-14 rounded-full bg-teal-700 hover:bg-teal-800 text-white flex items-center justify-center shadow-md shadow-teal-900/20 border-4 border-[#faf9f6] active:scale-95 transition-all"
            title="Add Blouse"
            aria-label="Add Blouse"
          >
            <Plus className="w-7 h-7 stroke-[2.8]" />
          </button>
        </div>

        {/* Tab 3: Today */}
        <button
          onClick={() => onTabChange('today')}
          className={`flex-1 min-h-[52px] py-1 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
            activeTab === 'today'
              ? 'text-teal-800 font-bold'
              : 'text-stone-500 hover:text-stone-800 font-medium'
          }`}
        >
          <Calendar className={`w-5 h-5 ${activeTab === 'today' ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
          <span className="text-[11px] leading-none">Today</span>
        </button>

        {/* Tab 4: Completed */}
        <button
          onClick={() => onTabChange('history')}
          className={`flex-1 min-h-[52px] py-1 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
            activeTab === 'history'
              ? 'text-teal-800 font-bold'
              : 'text-stone-500 hover:text-stone-800 font-medium'
          }`}
        >
          <Check className={`w-5 h-5 ${activeTab === 'history' ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
          <span className="text-[11px] leading-none">Completed</span>
        </button>
      </div>
    </div>
  );
};
