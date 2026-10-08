import React from 'react';
import { BlouseWork } from '../types/work';
import { Check, RotateCcw, Calendar, Trash2 } from 'lucide-react';
import { DataBackupSection } from './DataBackupSection';
import { BlousePlannerBackup } from '../utils/backup';

interface CompletedHistoryProps {
  completedItems: BlouseWork[];
  onReopenWork: (id: string) => void;
  onClearAll: () => void;
  onRestoreBackup?: (backup: BlousePlannerBackup) => void;
}

export const CompletedHistory: React.FC<CompletedHistoryProps> = ({
  completedItems,
  onReopenWork,
  onClearAll,
  onRestoreBackup
}) => {
  return (
    <div className="pb-28 px-4 pt-4 max-w-md mx-auto space-y-4 animate-fade-in">
      {/* Title */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold text-[#1c1917]">
            Completed Work
          </h2>
          <p className="text-xs text-stone-500 font-medium">
            Finished blouse orders and delivery records.
          </p>
        </div>
        <div className="shrink-0 flex flex-col items-center justify-center min-w-[56px] px-3.5 py-1.5 bg-stone-100/90 border border-stone-200/90 rounded-2xl text-center shadow-2xs">
          <span className="text-lg font-black text-stone-900 leading-none">
            {completedItems.length}
          </span>
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider leading-tight mt-1">
            done
          </span>
        </div>
      </div>

      {completedItems.length > 0 ? (
        <div className="space-y-2.5">
          {completedItems.map((item) => {
            const completedDateStr = item.completedAt
              ? new Date(item.completedAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })
              : item.dueDate;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                    <h4 className="font-bold text-stone-900 text-base truncate">
                      {item.customerName}
                    </h4>
                  </div>

                  <div className="text-xs text-stone-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="truncate">{item.workType}</span>
                    <span className="text-stone-300">•</span>
                    <span className="font-semibold text-stone-700 whitespace-nowrap">
                      {item.totalQuantity} blouse{item.totalQuantity > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-stone-400 mt-1 font-medium">
                    <Calendar className="w-3 h-3 text-stone-400 shrink-0" />
                    <span className="truncate">Completed on {completedDateStr}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onReopenWork(item.id)}
                  className="px-3 py-2 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200 font-semibold text-xs flex items-center gap-1.5 active:scale-95 transition-all shrink-0 whitespace-nowrap"
                  title="Reopen"
                >
                  <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                  <span>Reopen</span>
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-8 text-center border border-stone-200 text-stone-500 space-y-2">
          <p className="font-semibold text-stone-800 text-sm">No completed work yet.</p>
          <p className="text-xs text-stone-400">
            Finished blouses will appear here for your reference.
          </p>
        </div>
      )}

      {/* Clear option if items exist */}
      {completedItems.length > 0 && (
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs font-semibold text-stone-400 hover:text-rose-700 transition-colors inline-flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear Completed History</span>
          </button>
        </div>
      )}

      {/* Backup & Restore Data Section */}
      {onRestoreBackup && (
        <div className="pt-3">
          <DataBackupSection onRestoreCompleted={onRestoreBackup} />
        </div>
      )}
    </div>
  );
};
