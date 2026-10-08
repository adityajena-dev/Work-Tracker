import React, { useState } from 'react';
import { CheckCircle } from "lucide-react";
import { BlouseWork, CapacitySettings, WorkAnalysis, GivenOutBatch } from '../types/work';
import { formatDuration, generateTodaySchedule, getTodayString } from '../utils/priority';
import { Plus, RotateCcw, ArrowRight, Minus, History, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundManager } from '../utils/sound';
import { GivenOutHistoryModal } from './GivenOutHistoryModal';

interface DashboardProps {
  rankedItems: WorkAnalysis[];
  capacity: CapacitySettings;
  onIncrementCompleted: (id: string) => void;
  onDecrementCompleted: (id: string) => void;
  onOpenDetails: (work: BlouseWork) => void;
  onOpenAddModal: () => void;
  onNavigateTab: (tab: 'work' | 'today') => void;
  givenOutBatches: GivenOutBatch[];
  tempGivenOutBatch: number;
  onIncrementTempBatch: () => void;
  onDecrementTempBatch: () => void;
  onConfirmBatch: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  rankedItems,
  capacity,
  onIncrementCompleted,
  onDecrementCompleted,
  onOpenDetails,
  onOpenAddModal,
  onNavigateTab,
  givenOutBatches,
  tempGivenOutBatch,
  onIncrementTempBatch,
  onDecrementTempBatch,
  onConfirmBatch,
}) => {
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const doFirstItem = rankedItems[0];
  const otherWorkItems = rankedItems.slice(1, 4); // next 2-3 relevant jobs
  const todaySummary = generateTodaySchedule(rankedItems.map(r => r.work), capacity);

  // Today's confirmed total: sum of quantities of all batches confirmed today
  const todayDateStr = getTodayString();
  const todayConfirmedTotal = React.useMemo(() => {
    if (!Array.isArray(givenOutBatches)) return 0;
    return givenOutBatches.reduce((sum, batch) => {
      if (!batch || !batch.confirmedAt) return sum;
      const d = new Date(batch.confirmedAt);
      if (isNaN(d.getTime())) return sum;
      const batchDate = d.toLocaleDateString('en-CA');
      const qty = typeof batch.quantity === 'number' && !isNaN(batch.quantity) && batch.quantity > 0 ? batch.quantity : 0;
      return batchDate === todayDateStr ? sum + qty : sum;
    }, 0);
  }, [givenOutBatches, todayDateStr]);


  const handleConfirmBatch = () => {
    if (tempGivenOutBatch <= 0) return;
    onConfirmBatch();
  };


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

  const handleUndo = (workId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDecrementCompleted(workId);
  };

  return (
    <div className="pb-28 px-4 pt-4 max-w-md mx-auto space-y-6 animate-fade-in">
      {/* 1. Time-based Greeting */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h2 className="text-xl font-bold text-[#1c1917]">
            {getGreeting()}
          </h2>
          <p className="text-xs text-stone-500 font-medium">
            Here is your clear plan for today.
          </p>
        </div>
      </div>

      {/* 2. Empty State or Primary DO FIRST */}
      {rankedItems.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-stone-200 shadow-xs space-y-4 my-8">
          <div className="w-16 h-16 rounded-full bg-stone-100 text-stone-500 mx-auto flex items-center justify-center text-3xl">
            <CheckCircle className="w-8 h-8 text-teal-600" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-stone-900">
              You're all caught up.
            </h3>
            <p className="text-sm text-stone-600">
              Add a blouse when a new order comes in.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={onOpenAddModal}
              className="w-full min-h-[52px] bg-teal-700 hover:bg-teal-800 text-white font-bold text-base rounded-2xl shadow-sm active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              <span>Add Blouse</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Section: WHAT TO WORK ON FIRST */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                What to work on first
              </span>
            </div>

            {/* Hero Card */}
            <div 
              onClick={() => onOpenDetails(doFirstItem.work)}
              className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-stone-300 shadow-xs space-y-4 relative active:scale-[0.99] transition-all cursor-pointer"
            >
              {/* Header: Customer Name & Priority Badge */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl sm:text-2xl font-black text-stone-900 leading-tight truncate">
                    {doFirstItem.work.customerName}
                  </h3>
                  <p className="text-xs sm:text-sm font-semibold text-stone-600 mt-0.5 truncate">
                    {doFirstItem.remainingQuantity} blouse{doFirstItem.remainingQuantity > 1 ? 's' : ''} left • {doFirstItem.work.workType}
                  </p>
                </div>

                {/* Clean Priority Badge */}
                <span className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold shrink-0 whitespace-nowrap ${
                  doFirstItem.priority === 'DO_FIRST'
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : doFirstItem.priority === 'PLAN_SOON'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}>
                  {doFirstItem.priority === 'DO_FIRST'
                    ? 'DO FIRST'
                    : doFirstItem.priority === 'PLAN_SOON'
                    ? 'PLAN SOON'
                    : 'CAN WAIT'}
                </span>
              </div>

              {/* Timing info */}
              <div className="bg-stone-50 rounded-2xl p-3 sm:p-3.5 border border-stone-200/80 flex items-center justify-between gap-2 text-xs sm:text-sm">
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] text-stone-500 block leading-tight font-semibold">Due date</span>
                  <span className="font-bold text-stone-900 block truncate mt-0.5">
                    {doFirstItem.daysRemaining === 0
                      ? 'Due today'
                      : doFirstItem.daysRemaining === 1
                      ? 'Due tomorrow'
                      : doFirstItem.daysRemaining < 0
                      ? `Overdue (${Math.abs(doFirstItem.daysRemaining)}d)`
                      : `Due in ${doFirstItem.daysRemaining} days`}
                  </span>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] text-stone-500 block leading-tight font-semibold">Time left</span>
                  <span className="font-bold text-stone-900 block whitespace-nowrap mt-0.5">
                    ~{formatDuration(doFirstItem.remainingMinutes)}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Single horizontal [ + 1 Completed ] with Undo, and View Details */}
              <div className="flex flex-col gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleQuickIncrement(doFirstItem, e)}
                    className="flex-1 min-h-[48px] sm:min-h-[52px] px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm sm:text-base rounded-2xl shadow-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all whitespace-nowrap"
                  >
                    <Plus className="w-5 h-5 stroke-[3] shrink-0" />
                    <span className="whitespace-nowrap">1 Completed</span>
                  </button>

                  {doFirstItem.work.completedQuantity > 0 && (
                    <button
                      type="button"
                      onClick={(e) => handleUndo(doFirstItem.work.id, e)}
                      className="w-12 min-h-[48px] sm:min-h-[52px] rounded-2xl bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-600 flex items-center justify-center shrink-0 active:scale-95 transition-all"
                      title="Undo -1"
                      aria-label="Undo 1 completed"
                    >
                      <RotateCcw className="w-4 h-4 shrink-0" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onOpenDetails(doFirstItem.work)}
                  className="w-full min-h-[42px] px-4 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold text-xs sm:text-sm flex items-center justify-center active:scale-[0.98] transition-all whitespace-nowrap"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>

          {/* Section: TODAY SUMMARY */}
          <div 
            onClick={() => onNavigateTab('today')}
            className="bg-stone-100/80 hover:bg-stone-100 rounded-2xl p-4 border border-stone-200 flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99]"
          >
            <div className="min-w-0 flex-1 space-y-0.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
                Today
              </span>
              <div className="text-sm font-bold text-stone-900 leading-snug">
                About {formatDuration(todaySummary.totalPlannedMinutes)} planned
              </div>
              <div className="text-xs text-stone-600 leading-normal">
                {formatDuration(capacity.dailyCapacityMinutes)} comfortable capacity
                {todaySummary.isLimitReached && ' — limit reached'}
              </div>
            </div>

            <div className="shrink-0">
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-50 border border-teal-200/80 text-xs font-bold text-teal-800 whitespace-nowrap shadow-2xs">
                <span>View Today</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </span>
            </div>
          </div>

          {/* ── GIVEN OUT TODAY Card ── */}
          <div className="bg-white rounded-3xl border border-stone-200/90 p-4 sm:p-5 space-y-4 shadow-xs">
            {/* Top row: Header & History button */}
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                  Given Out Today
                </p>
                <p className="text-2xl font-black text-stone-900 leading-tight mt-0.5 truncate">
                  {todayConfirmedTotal}{' '}
                  <span className="text-base font-semibold text-stone-500">
                    {todayConfirmedTotal === 1 ? 'Blouse' : 'Blouses'}
                  </span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200/80 text-stone-700 text-xs font-bold flex items-center gap-1.5 transition-all border border-stone-200/60 active:scale-95 shrink-0 whitespace-nowrap"
                aria-label="View history"
              >
                <History className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                <span>History</span>
              </button>
            </div>

            {/* Current Batch Stepper */}
            <div className="bg-stone-50 rounded-2xl p-3 sm:p-3.5 border border-stone-200/70 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wide block">
                  Current batch
                </span>
                <span className="text-2xl font-black text-stone-900 block leading-tight mt-0.5">
                  {tempGivenOutBatch}
                </span>
              </div>

              {/* [ − ] [ +1 ] buttons for temporary batch */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={onDecrementTempBatch}
                  disabled={tempGivenOutBatch <= 0}
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl border flex items-center justify-center transition-all shrink-0 ${
                    tempGivenOutBatch > 0
                      ? 'bg-white hover:bg-stone-100 border-stone-300 text-stone-800 active:scale-95 shadow-xs'
                      : 'bg-stone-100 border-stone-200 text-stone-300 cursor-not-allowed'
                  }`}
                  aria-label="Decrease current batch"
                >
                  <Minus className="w-5 h-5 stroke-[2.5]" />
                </button>

                <button
                  type="button"
                  onClick={onIncrementTempBatch}
                  className="min-w-[60px] sm:min-w-[64px] h-11 sm:h-12 px-3.5 sm:px-4 rounded-xl bg-stone-800 hover:bg-stone-900 text-white font-bold text-base flex items-center justify-center gap-1 active:scale-95 transition-all shadow-sm shrink-0 whitespace-nowrap"
                  aria-label="Add 1 to current batch"
                >
                  <Plus className="w-4 h-4 stroke-[3] shrink-0" />
                  <span>1</span>
                </button>
              </div>
            </div>

            {/* [ Confirm ] Button */}
            <button
              type="button"
              onClick={handleConfirmBatch}
              disabled={tempGivenOutBatch <= 0}
              className={`w-full min-h-[48px] sm:min-h-[50px] px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xs ${
                tempGivenOutBatch > 0
                  ? 'bg-teal-700 hover:bg-teal-800 active:scale-[0.99] text-white'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3] shrink-0" />
              <span className="whitespace-nowrap">
                {tempGivenOutBatch > 0
                  ? `Confirm (${tempGivenOutBatch} blouse${tempGivenOutBatch > 1 ? 's' : ''})`
                  : 'Confirm'}
              </span>
            </button>
          </div>

          {/* Given Out History Modal */}
          <GivenOutHistoryModal
            isOpen={isHistoryModalOpen}
            onClose={() => setIsHistoryModalOpen(false)}
            batches={givenOutBatches}
          />


          {/* Section: OTHER WORK (Next 2-3 relevant jobs) */}
          {otherWorkItems.length > 0 && (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Other work
                </span>
                <button
                  onClick={() => onNavigateTab('work')}
                  className="text-xs font-bold text-teal-800 hover:text-teal-900"
                >
                  View all ({rankedItems.length})
                </button>
              </div>

              <div className="space-y-2">
                {otherWorkItems.map((item) => (
                  <div
                    key={item.work.id}
                    onClick={() => onOpenDetails(item.work)}
                    className="bg-white rounded-2xl p-3.5 border border-stone-200 flex items-center justify-between gap-3 active:scale-[0.99] transition-all cursor-pointer hover:border-stone-300"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900 text-base truncate">
                          {item.work.customerName}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.priority === 'DO_FIRST'
                            ? 'bg-rose-50 text-rose-800'
                            : item.priority === 'PLAN_SOON'
                            ? 'bg-amber-50 text-amber-800'
                            : 'bg-emerald-50 text-emerald-800'
                        }`}>
                          {item.badgeLabel}
                        </span>
                      </div>
                      <div className="text-xs text-stone-500 mt-1 flex items-center gap-2">
                        <span>{item.remainingQuantity} left</span>
                        <span>•</span>
                        <span>~{formatDuration(item.remainingMinutes)}</span>
                        <span>•</span>
                        <span>
                          {item.daysRemaining === 1 ? 'Due tomorrow' : `Due in ${item.daysRemaining}d`}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleQuickIncrement(item, e)}
                      className="w-10 h-10 rounded-xl bg-stone-100 hover:bg-teal-50 hover:text-teal-800 text-stone-700 font-bold flex items-center justify-center shrink-0 active:scale-95 transition-all border border-stone-200"
                      title="1 Done"
                      aria-label="1 Done"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
