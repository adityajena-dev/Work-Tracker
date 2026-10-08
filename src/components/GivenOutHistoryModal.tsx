import React, { useState, useMemo } from 'react';
import { GivenOutBatch } from '../types/work';
import { X, Calendar, Clock, History } from 'lucide-react';

interface GivenOutHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  batches: GivenOutBatch[];
}

type HistoryCategory = 'TODAY' | 'THIS_WEEK' | 'LAST_WEEK' | 'THIS_MONTH' | 'LAST_MONTH';

interface CategoryOption {
  id: HistoryCategory;
  label: string;
}

const CATEGORIES: CategoryOption[] = [
  { id: 'TODAY', label: 'Today' },
  { id: 'THIS_WEEK', label: 'This Week' },
  { id: 'LAST_WEEK', label: 'Last Week' },
  { id: 'THIS_MONTH', label: 'This Month' },
  { id: 'LAST_MONTH', label: 'Last Month' },
];

interface ValidatedBatch {
  id: string;
  quantity: number;
  confirmedAt: string;
  dateObj: Date;
}

interface GroupedDateBatches {
  dateStr: string; // YYYY-MM-DD
  dateLabel: string; // e.g. "7 Oct"
  dayOfWeek: string; // e.g. "Wed"
  batches: ValidatedBatch[];
  totalQuantity: number;
}

export const GivenOutHistoryModal: React.FC<GivenOutHistoryModalProps> = ({
  isOpen,
  onClose,
  batches
}) => {
  const [selectedCategory, setSelectedCategory] = useState<HistoryCategory>('TODAY');

  // Format time defensively (e.g. "10:30 am")

  const formatTime = (dateObj: Date) => {
    try {
      if (isNaN(dateObj.getTime())) return '';
      return dateObj.toLocaleTimeString('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).toLowerCase();
    } catch {
      return '';
    }
  };

  // Format date label defensively (e.g. "7 Oct")
  const formatDateLabel = (dateObj: Date) => {
    try {
      if (isNaN(dateObj.getTime())) return '';
      return dateObj.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short'
      });
    } catch {
      return '';
    }
  };

  // Format day of week defensively (e.g. "Wed")
  const formatDayOfWeek = (dateObj: Date) => {
    try {
      if (isNaN(dateObj.getTime())) return '';
      return dateObj.toLocaleDateString('en-GB', {
        weekday: 'short'
      });
    } catch {
      return '';
    }
  };

  // Total count of all valid blouses across all batches
  const totalAllTime = useMemo(() => {
    if (!Array.isArray(batches)) return 0;
    return batches.reduce((sum, b) => {
      if (!b) return sum;
      const qty = typeof b.quantity === 'number' && !isNaN(b.quantity) && b.quantity > 0 ? b.quantity : 0;
      return sum + qty;
    }, 0);
  }, [batches]);

  // Total number of valid batches
  const validBatchCount = useMemo(() => {
    if (!Array.isArray(batches)) return 0;
    return batches.filter(b => b && b.confirmedAt && !isNaN(new Date(b.confirmedAt).getTime())).length;
  }, [batches]);

  // Calculate boundary ranges and filter for the selected category
  const { filteredDateGroups, periodTotal, periodTitle } = useMemo(() => {
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    // This Week: Monday 00:00:00 to tomorrow 00:00:00
    const dayOfWeek = (todayMidnight.getDay() + 6) % 7; // 0 for Mon, 6 for Sun
    const startOfThisWeek = new Date(todayMidnight);
    startOfThisWeek.setDate(todayMidnight.getDate() - dayOfWeek);

    // Last Week: Monday 00:00:00 to following Monday 00:00:00
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);
    const endOfLastWeek = new Date(startOfThisWeek);

    // This Month: 1st of current month to 1st of next month
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Last Month: 1st of last month to 1st of current month
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let periodTitleLabel = '';
    let isMatch = (_date: Date) => false;

    switch (selectedCategory) {
      case 'TODAY':
        periodTitleLabel = 'Today';
        isMatch = (d) => d >= todayMidnight && d < tomorrowMidnight;
        break;
      case 'THIS_WEEK':
        periodTitleLabel = 'This Week';
        isMatch = (d) => d >= startOfThisWeek && d < tomorrowMidnight;
        break;
      case 'LAST_WEEK':
        periodTitleLabel = 'Last Week';
        isMatch = (d) => d >= startOfLastWeek && d < endOfLastWeek;
        break;
      case 'THIS_MONTH':
        periodTitleLabel = 'This Month';
        isMatch = (d) => d >= startOfThisMonth && d < startOfNextMonth;
        break;
      case 'LAST_MONTH':
        periodTitleLabel = 'Last Month';
        isMatch = (d) => d >= startOfLastMonth && d < endOfLastMonth;
        break;
      default:
        periodTitleLabel = 'Today';
        isMatch = (d) => d >= todayMidnight && d < tomorrowMidnight;
        break;
    }

    // Sanitize and filter batches
    const rawList = Array.isArray(batches) ? batches : [];
    const validBatches: ValidatedBatch[] = [];

    for (const item of rawList) {
      if (!item || !item.confirmedAt) continue;
      const d = new Date(item.confirmedAt);
      if (isNaN(d.getTime())) continue;

      const qty = typeof item.quantity === 'number' && !isNaN(item.quantity) && item.quantity > 0 ? item.quantity : 1;
      validBatches.push({
        id: item.id || `batch-${d.getTime()}-${Math.random()}`,
        quantity: qty,
        confirmedAt: item.confirmedAt,
        dateObj: d
      });
    }

    // Filter by category
    const matchedBatches = validBatches.filter((b) => isMatch(b.dateObj));

    // Sort descending by confirmedAt (newest first)
    matchedBatches.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());

    // Group by calendar date (YYYY-MM-DD local time)
    const dateMap = new Map<string, { date: Date; batches: ValidatedBatch[] }>();
    for (const batch of matchedBatches) {
      let dateKey = '';
      try {
        dateKey = batch.dateObj.toLocaleDateString('en-CA');
      } catch {
        dateKey = `${batch.dateObj.getFullYear()}-${String(batch.dateObj.getMonth() + 1).padStart(2, '0')}-${String(batch.dateObj.getDate()).padStart(2, '0')}`;
      }

      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { date: batch.dateObj, batches: [] });
      }
      dateMap.get(dateKey)!.batches.push(batch);
    }

    const groups: GroupedDateBatches[] = [];
    let total = 0;

    for (const [dateStr, { date, batches: dateBatches }] of dateMap.entries()) {
      const dayTotal = dateBatches.reduce((sum, b) => sum + b.quantity, 0);
      total += dayTotal;

      groups.push({
        dateStr,
        dateLabel: formatDateLabel(date),
        dayOfWeek: formatDayOfWeek(date),
        batches: dateBatches,
        totalQuantity: dayTotal
      });
    }

    return {
      filteredDateGroups: groups,
      periodTotal: total,
      periodTitle: periodTitleLabel
    };
  }, [batches, selectedCategory]);

  if (!isOpen) return null;

  return (

    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 animate-fade-in">
      <div 
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-stone-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-stone-300" />
            <div>
              <h2 className="font-bold text-base tracking-wide text-white">
                Given Out History
              </h2>
              <p className="text-xs text-stone-400">
                {validBatchCount} batch{validBatchCount !== 1 ? 'es' : ''} ({totalAllTime} blouse{totalAllTime !== 1 ? 's' : ''})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Pills Navigation */}
        <div className="bg-stone-100/80 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-stone-200/70">
          <div className="flex flex-wrap gap-1.5 justify-center">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    isSelected
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-white text-stone-600 hover:bg-stone-200/70 border border-stone-200/80'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-stone-800 flex-1">
          {/* Period Total Banner */}
          <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
                {periodTitle}
              </span>
              <span className="text-2xl font-black text-stone-900 leading-tight block mt-0.5">
                {periodTotal}{' '}
                <span className="text-sm font-semibold text-stone-500">
                  {periodTotal === 1 ? 'blouse total' : 'blouses total'}
                </span>
              </span>
            </div>
          </div>

          {/* Date-wise List */}
          {filteredDateGroups.length === 0 ? (
            <div className="py-12 text-center text-stone-400 space-y-2">
              <Calendar className="w-10 h-10 mx-auto stroke-[1.5] text-stone-300" />
              <p className="text-base font-semibold text-stone-600">No blouse history for this period.</p>
              <p className="text-xs text-stone-400 max-w-xs mx-auto">
                Any blouses confirmed in this period will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDateGroups.map((dateGroup) => (
                <div 
                  key={dateGroup.dateStr}
                  className="bg-white border border-stone-200 rounded-2xl p-4 space-y-2.5 shadow-2xs"
                >
                  {/* Date Header & Day Total */}
                  <div className="flex items-center justify-between pb-2 border-b border-stone-100 gap-2">
                    <div className="flex items-baseline gap-1.5 min-w-0 truncate">
                      <span className="text-sm sm:text-base font-bold text-stone-900 truncate">
                        {dateGroup.dateLabel || dateGroup.dateStr}
                      </span>
                      {dateGroup.dayOfWeek && (
                        <span className="text-xs text-stone-400 font-medium shrink-0">
                          ({dateGroup.dayOfWeek})
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-stone-800 bg-stone-100 px-2.5 py-1 rounded-full border border-stone-200/70 shrink-0 whitespace-nowrap">
                      {dateGroup.totalQuantity} {dateGroup.totalQuantity === 1 ? 'blouse total' : 'blouses total'}
                    </span>
                  </div>

                  {/* Batches for this date */}
                  <div className="space-y-1.5 pt-0.5">
                    {dateGroup.batches.map((batch) => (
                      <div
                        key={batch.id}
                        className="flex items-center justify-between text-xs py-1 px-1"
                      >
                        <span className="text-stone-500 font-medium flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-stone-400" />
                          {formatTime(batch.dateObj) || 'Confirmed'}
                        </span>
                        <span className="font-bold text-stone-900 text-sm">
                          {batch.quantity} {batch.quantity === 1 ? 'blouse' : 'blouses'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl bg-stone-800 hover:bg-stone-900 text-white font-bold text-sm transition-all active:scale-[0.99]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
