import React, { useState, useMemo } from 'react';
import { BlouseWork, PriorityLevel, WorkAnalysis } from '../types/work';
import { formatDuration } from '../utils/priority';
import { Search, Plus } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundManager } from '../utils/sound';

interface WorkListProps {
  rankedItems: WorkAnalysis[];
  onIncrementCompleted: (id: string) => void;
  onOpenDetails: (work: BlouseWork) => void;
  onOpenAddModal: () => void;
}

export const WorkList: React.FC<WorkListProps> = ({
  rankedItems,
  onIncrementCompleted,
  onOpenDetails,
  onOpenAddModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | PriorityLevel>('ALL');

  const filteredItems = useMemo(() => {
    return rankedItems.filter((item) => {
      const matchesSearch = item.work.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.work.workType.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedFilter === 'ALL' || item.priority === selectedFilter;
      return matchesSearch && matchesCategory;
    });
  }, [rankedItems, searchQuery, selectedFilter]);

  const doFirstGroup = filteredItems.filter(i => i.priority === 'DO_FIRST');
  const planSoonGroup = filteredItems.filter(i => i.priority === 'PLAN_SOON');
  const canWaitGroup = filteredItems.filter(i => i.priority === 'CAN_WAIT');

  const handleQuickIncrement = (analysis: WorkAnalysis, e: React.MouseEvent) => {
    e.stopPropagation();
    const isFinal = analysis.remainingQuantity === 1;
    onIncrementCompleted(analysis.work.id);
    if (isFinal) {
      soundManager.playCelebrationFanfare();
      confetti({ particleCount: 60, spread: 60 });
    } else {
      soundManager.playCompletedChime();
      confetti({ particleCount: 25, spread: 40 });
    }
  };

  const renderWorkCard = (item: WorkAnalysis) => {
    const isDoFirst = item.priority === 'DO_FIRST';
    const isPlanSoon = item.priority === 'PLAN_SOON';

    return (
      <div
        key={item.work.id}
        onClick={() => onOpenDetails(item.work)}
        className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs hover:border-stone-300 transition-all active:scale-[0.99] cursor-pointer space-y-3"
      >
        {/* Customer & Priority */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h4 className="text-base sm:text-lg font-bold text-stone-900 leading-tight truncate">
              {item.work.customerName}
            </h4>
            <p className="text-xs text-stone-500 mt-0.5 truncate">
              {item.work.workType}
            </p>
          </div>

          <span className={`px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold shrink-0 whitespace-nowrap ${
            isDoFirst
              ? 'bg-rose-100 text-rose-800'
              : isPlanSoon
              ? 'bg-amber-100 text-amber-800'
              : 'bg-emerald-100 text-emerald-800'
          }`}>
            {isDoFirst ? 'DO FIRST' : isPlanSoon ? 'PLAN SOON' : 'CAN WAIT'}
          </span>
        </div>

        {/* Quantities & Time */}
        <div className="bg-stone-50 rounded-xl p-2.5 border border-stone-100 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-stone-700">
          <div className="whitespace-nowrap">
            <span className="text-stone-500">Remaining:</span>{' '}
            <strong className="text-stone-900 font-bold">
              {item.remainingQuantity}
            </strong>{' '}
            <span className="text-stone-400">/ {item.work.totalQuantity}</span>
          </div>

          <div className="whitespace-nowrap">
            <span className="text-stone-500">Estimated time:</span>{' '}
            <strong className="text-stone-900 font-bold">
              About {formatDuration(item.remainingMinutes)}
            </strong>
          </div>
        </div>

        {/* Due date & Action */}
        <div className="flex items-center justify-between gap-2 text-xs pt-0.5">
          <span className="text-stone-500 font-medium truncate min-w-0 flex-1">
            Due: {item.work.dueDate}{' '}
            <span className="text-stone-700 font-semibold whitespace-nowrap">
              ({item.daysRemaining === 0
                ? 'Today'
                : item.daysRemaining === 1
                ? 'Tomorrow'
                : item.daysRemaining < 0
                ? `Overdue`
                : `${item.daysRemaining} days left`})
            </span>
          </span>

          <button
            type="button"
            onClick={(e) => handleQuickIncrement(item, e)}
            className="px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 whitespace-nowrap active:scale-95 transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3] shrink-0" />
            <span className="whitespace-nowrap">1 Done</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="pb-28 px-4 pt-4 max-w-md mx-auto space-y-4 animate-fade-in">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1c1917]">
            All Work
          </h2>
          <p className="text-xs text-stone-500 font-medium">
            Organized by what needs your attention first.
          </p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="px-3.5 py-2 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center gap-1 shadow-xs active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Blouse</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search customer name..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-300 rounded-2xl text-stone-900 placeholder:text-stone-400 font-medium text-sm focus:border-teal-700 focus:outline-none shadow-2xs"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
        <button
          onClick={() => setSelectedFilter('ALL')}
          className={`px-3 py-1.5 rounded-xl border transition-all shrink-0 ${
            selectedFilter === 'ALL'
              ? 'bg-stone-900 text-white border-stone-900'
              : 'bg-white text-stone-600 border-stone-200'
          }`}
        >
          All ({rankedItems.length})
        </button>

        <button
          onClick={() => setSelectedFilter('DO_FIRST')}
          className={`px-3 py-1.5 rounded-xl border transition-all shrink-0 ${
            selectedFilter === 'DO_FIRST'
              ? 'bg-rose-800 text-white border-rose-800'
              : 'bg-white text-rose-800 border-stone-200'
          }`}
        >
          Do First ({rankedItems.filter(i => i.priority === 'DO_FIRST').length})
        </button>

        <button
          onClick={() => setSelectedFilter('PLAN_SOON')}
          className={`px-3 py-1.5 rounded-xl border transition-all shrink-0 ${
            selectedFilter === 'PLAN_SOON'
              ? 'bg-amber-600 text-white border-amber-600'
              : 'bg-white text-amber-800 border-stone-200'
          }`}
        >
          Plan Soon ({rankedItems.filter(i => i.priority === 'PLAN_SOON').length})
        </button>

        <button
          onClick={() => setSelectedFilter('CAN_WAIT')}
          className={`px-3 py-1.5 rounded-xl border transition-all shrink-0 ${
            selectedFilter === 'CAN_WAIT'
              ? 'bg-emerald-700 text-white border-emerald-700'
              : 'bg-white text-emerald-800 border-stone-200'
          }`}
        >
          Can Wait ({rankedItems.filter(i => i.priority === 'CAN_WAIT').length})
        </button>
      </div>

      {/* Grouped Lists */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-stone-200 text-stone-500">
          <p className="font-semibold text-stone-800 text-sm">No blouses found in this category.</p>
        </div>
      ) : selectedFilter === 'ALL' ? (
        <div className="space-y-5">
          {/* DO FIRST */}
          {doFirstGroup.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-800 px-1">
                Do First ({doFirstGroup.length})
              </span>
              <div className="space-y-2">
                {doFirstGroup.map(renderWorkCard)}
              </div>
            </div>
          )}

          {/* PLAN SOON */}
          {planSoonGroup.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 px-1">
                Plan Soon ({planSoonGroup.length})
              </span>
              <div className="space-y-2">
                {planSoonGroup.map(renderWorkCard)}
              </div>
            </div>
          )}

          {/* CAN WAIT */}
          {canWaitGroup.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 px-1">
                Can Wait ({canWaitGroup.length})
              </span>
              <div className="space-y-2">
                {canWaitGroup.map(renderWorkCard)}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredItems.map(renderWorkCard)}
        </div>
      )}
    </div>
  );
};
