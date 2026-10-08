import React from 'react';
import { BlouseWork, CapacitySettings } from '../types/work';
import { generateTodaySchedule, formatDuration } from '../utils/priority';
import { Plus, SlidersHorizontal, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundManager } from '../utils/sound';

interface TodayPlanProps {
  workItems: BlouseWork[];
  capacity: CapacitySettings;
  onIncrementCompleted: (id: string) => void;
  onOpenDetails: (work: BlouseWork) => void;
  onOpenCapacity: () => void;
}

export const TodayPlan: React.FC<TodayPlanProps> = ({
  workItems,
  capacity,
  onIncrementCompleted,
  onOpenDetails,
  onOpenCapacity
}) => {
  const todaySummary = generateTodaySchedule(workItems, capacity);

  const handleTaskDone = (workId: string, remainingQuantity: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onIncrementCompleted(workId);
    if (remainingQuantity === 1) {
      soundManager.playCelebrationFanfare();
      confetti({ particleCount: 60, spread: 60 });
    } else {
      soundManager.playCompletedChime();
      confetti({ particleCount: 25, spread: 40 });
    }
  };

  const progressPercent = Math.min(
    100,
    Math.round((todaySummary.totalPlannedMinutes / todaySummary.dailyCapacityMinutes) * 100)
  );

  const formatDurationNonBreaking = (minutes: number) => {
    return formatDuration(minutes).replace(/(\d+)\s+(hr|min)/g, '$1\u00A0$2');
  };

  return (
    <div className="pb-28 px-4 pt-4 max-w-md mx-auto space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1c1917]">
            Today's Plan
          </h2>
          <p className="text-xs text-stone-500 font-medium">
            A practical order of work within your daily capacity.
          </p>
        </div>

        <button
          onClick={onOpenCapacity}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200 text-xs font-semibold hover:bg-stone-200 transition-all shrink-0 whitespace-nowrap"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
          <span>{formatDuration(capacity.dailyCapacityMinutes)}</span>
        </button>
      </div>

      {/* Capacity & Progress Summary Card */}
      <div className="bg-white rounded-3xl p-3.5 sm:p-5 border border-stone-200 shadow-xs space-y-4">
        <div className="grid grid-cols-3 gap-1.5 sm:gap-3 text-center">
          <div className="bg-stone-50/80 rounded-2xl p-2 sm:p-3 flex flex-col justify-center min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-stone-500 block uppercase tracking-wider">
              Total
            </span>
            <span className="text-xs sm:text-sm md:text-base font-bold text-stone-900 mt-1 block leading-snug">
              {formatDurationNonBreaking(todaySummary.totalPlannedMinutes)}
            </span>
          </div>

          <div className="bg-stone-50/80 rounded-2xl p-2 sm:p-3 flex flex-col justify-center min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-stone-500 block uppercase tracking-wider">
              Capacity
            </span>
            <span className="text-xs sm:text-sm md:text-base font-bold text-teal-800 mt-1 block leading-snug">
              {formatDurationNonBreaking(todaySummary.dailyCapacityMinutes)}
            </span>
          </div>

          <div className="bg-stone-50/80 rounded-2xl p-2 sm:p-3 flex flex-col justify-center min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-stone-500 block uppercase tracking-wider">
              Remaining
            </span>
            <span className="text-xs sm:text-sm md:text-base font-bold text-stone-700 mt-1 block leading-snug">
              {todaySummary.isLimitReached
                ? 'Limit reached'
                : formatDurationNonBreaking(todaySummary.remainingCapacityMinutes)}
            </span>
          </div>
        </div>

        {/* Clean Progress Bar */}
        <div className="space-y-1">
          <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                todaySummary.isLimitReached ? 'bg-teal-700' : 'bg-teal-600'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {todaySummary.isLimitReached && (
            <p className="text-[11px] text-stone-500 font-medium text-center pt-0.5">
              Comfortable limit reached for today. Rest and continue tomorrow.
            </p>
          )}
        </div>
      </div>

      {/* Task Queue */}
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-stone-500 px-1">
          Work order for today
        </span>

        {todaySummary.plannedTasks.length > 0 ? (
          <div className="space-y-2.5">
            {todaySummary.plannedTasks.map((task) => (
              <div
                key={task.work.id}
                onClick={() => onOpenDetails(task.work)}
                className="bg-white rounded-2xl p-3.5 sm:p-4 border border-stone-200 shadow-xs flex items-center justify-between gap-2.5 sm:gap-3 active:scale-[0.99] transition-all cursor-pointer hover:border-stone-300"
              >
                {/* Number */}
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 font-bold text-xs sm:text-sm flex items-center justify-center shrink-0">
                  {task.order}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                    <h3 className="font-bold text-sm sm:text-base text-stone-900 truncate max-w-full">
                      {task.work.customerName}
                    </h3>
                    <span className="text-[11px] sm:text-xs text-stone-500 font-normal truncate">
                      ({task.work.workType})
                    </span>
                  </div>

                  <div className="text-xs text-stone-600 mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 font-medium">
                    <span className="text-teal-800 font-bold whitespace-nowrap">
                      {task.blousesToTargetToday} blouse{task.blousesToTargetToday > 1 ? 's' : ''}
                    </span>
                    <span className="text-stone-300">•</span>
                    <span className="whitespace-nowrap">About {formatDuration(task.minutesTargetToday)}</span>
                  </div>

                  {task.note && (
                    <div className="text-[11px] text-stone-500 font-medium mt-0.5 truncate">
                      {task.note}
                    </div>
                  )}
                </div>

                {/* + 1 Action Button */}
                <button
                  type="button"
                  onClick={(e) => handleTaskDone(task.work.id, task.analysis.remainingQuantity, e)}
                  className="px-3 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center gap-1 shrink-0 whitespace-nowrap active:scale-95 transition-all shadow-xs"
                  title="Mark 1 blouse done"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3] shrink-0" />
                  <span>1</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 text-center border border-stone-200 text-stone-500 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-stone-400 mx-auto" />
            <p className="font-bold text-stone-800 text-base">You're all caught up for today.</p>
            <p className="text-xs text-stone-500">No pending work to plan.</p>
          </div>
        )}
      </div>
    </div>
  );
};
