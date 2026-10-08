import React, { useState } from 'react';
import { BlouseWork, CapacitySettings } from '../types/work';
import { analyzeWork, formatDuration } from '../utils/priority';
import { X, Plus, RotateCcw, Check, Edit3, Trash2, Calendar, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundManager } from '../utils/sound';

interface WorkDetailModalProps {
  work: BlouseWork | null;
  isOpen: boolean;
  onClose: () => void;
  capacity: CapacitySettings;
  onIncrementCompleted: (id: string) => void;
  onDecrementCompleted: (id: string) => void;
  onMarkAllComplete: (id: string) => void;
  onEdit: (work: BlouseWork) => void;
  onDelete: (id: string) => void;
}

export const WorkDetailModal: React.FC<WorkDetailModalProps> = ({
  work,
  isOpen,
  onClose,
  capacity,
  onIncrementCompleted,
  onDecrementCompleted,
  onMarkAllComplete,
  onEdit,
  onDelete
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!isOpen || !work) return null;

  const analysis = analyzeWork(work, capacity);
  const isCompleted = work.completedQuantity >= work.totalQuantity;
  const progressPct = Math.min(100, (work.completedQuantity / work.totalQuantity) * 100);

  const handleIncrement = () => {
    const isFinal = work.completedQuantity + 1 >= work.totalQuantity;
    onIncrementCompleted(work.id);
    if (isFinal) {
      soundManager.playCelebrationFanfare();
      confetti({ particleCount: 70, spread: 60 });
    } else {
      soundManager.playCompletedChime();
      confetti({ particleCount: 25, spread: 40 });
    }
  };

  const handleMarkComplete = () => {
    onMarkAllComplete(work.id);
    soundManager.playCelebrationFanfare();
    confetti({ particleCount: 80, spread: 70 });
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete(work.id);
    onClose();
  };

  // Priority badge
  const priorityBadge = isCompleted
    ? { label: 'Completed', cls: 'bg-emerald-100 text-emerald-800' }
    : analysis.priority === 'DO_FIRST'
    ? { label: 'Do First', cls: 'bg-rose-100 text-rose-800' }
    : analysis.priority === 'PLAN_SOON'
    ? { label: 'Plan Soon', cls: 'bg-amber-100 text-amber-800' }
    : { label: 'Can Wait', cls: 'bg-emerald-100 text-emerald-800' };

  // Days-remaining text
  const daysText =
    analysis.daysRemaining < 0
      ? `Overdue by ${Math.abs(analysis.daysRemaining)}d`
      : analysis.daysRemaining === 0
      ? 'Due today'
      : analysis.daysRemaining === 1
      ? 'Due tomorrow'
      : `${analysis.daysRemaining} days left`;

  const daysColor =
    analysis.daysRemaining <= 0
      ? 'text-rose-700'
      : analysis.daysRemaining === 1
      ? 'text-amber-700'
      : 'text-stone-500';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 animate-fade-in">
      <div
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[92vh] animate-slide-up"
        role="dialog"
        aria-modal="true"
      >
        {/* Drag handle (mobile only) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-stone-300" />
        </div>

        {/* Close button */}
        <div className="flex items-center justify-end px-4 pt-2 pb-1 sm:pt-4 sm:px-5">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-all"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-5">

          {/* â”€â”€ 1. CUSTOMER & WORK TYPE â”€â”€ */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 leading-tight tracking-tight break-words">
              {work.customerName}
            </h2>
            <p className="mt-1 text-sm sm:text-base font-medium text-stone-500 break-words">
              {work.workType}
            </p>
          </div>

          {/* â”€â”€ 2. NOTES (prominent) â”€â”€ */}
          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2">
              Notes
            </p>
            {work.notes ? (
              <p className="text-base text-stone-800 leading-relaxed whitespace-pre-wrap">
                {work.notes}
              </p>
            ) : (
              <p className="text-sm text-stone-400 italic">No notes added</p>
            )}
          </div>

          {/* â”€â”€ 3. PROGRESS â”€â”€ */}
          <div className="space-y-3">
            {/* Count line */}
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-stone-900">
                {work.completedQuantity}
                <span className="text-stone-400 font-semibold text-lg"> / {work.totalQuantity}</span>
              </span>
              <span className="text-sm font-semibold text-stone-500">
                {isCompleted ? 'All done!' : `${analysis.remainingQuantity} remaining`}
              </span>
            </div>

            {/* Bar */}
            <div className="w-full bg-stone-200 h-3 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isCompleted ? 'bg-emerald-600' : 'bg-teal-700'
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {/* Primary action: +1 Completed */}
            {!isCompleted && (
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleIncrement}
                  className="flex-1 min-h-[52px] sm:min-h-[56px] px-4 rounded-2xl bg-teal-700 hover:bg-teal-800 active:scale-95 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-sm whitespace-nowrap"
                >
                  <Plus className="w-5 h-5 stroke-[2.5] shrink-0" />
                  <span className="whitespace-nowrap">1 Completed</span>
                </button>

                {work.completedQuantity > 0 && (
                  <button
                    type="button"
                    onClick={() => onDecrementCompleted(work.id)}
                    className="px-4 min-h-[52px] sm:min-h-[56px] rounded-2xl bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-700 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all border border-stone-300 shrink-0 whitespace-nowrap"
                    title="Undo last"
                  >
                    <RotateCcw className="w-4 h-4 shrink-0" />
                    <span>Undo</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── 4. DEADLINE & ESTIMATED TIME (secondary, compact) ── */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-3 min-w-0">
              <div className="flex items-center gap-1 text-stone-400 mb-1.5">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[11px] font-bold uppercase tracking-wide">Deadline</span>
              </div>
              <p className="text-sm font-bold text-stone-900 truncate">{work.dueDate}</p>
              <p className={`text-xs font-semibold mt-0.5 truncate ${daysColor}`}>{daysText}</p>
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-3 min-w-0">
              <div className="flex items-center gap-1 text-stone-400 mb-1.5">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[11px] font-bold uppercase tracking-wide">Est. work</span>
              </div>
              <p className="text-sm font-bold text-stone-900 truncate">
                {isCompleted ? '-' : formatDuration(analysis.remainingMinutes)}
              </p>
              <p className="text-[11px] text-stone-400 mt-0.5 truncate">
                {formatDuration(work.timePerBlouseMinutes)} per blouse
              </p>
            </div>
          </div>

          {/* â”€â”€ 5. PRIORITY (small supporting status) â”€â”€ */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
              Priority
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${priorityBadge.cls}`}>
              {priorityBadge.label}
            </span>
          </div>

          {/* â”€â”€ 6. SECONDARY ACTIONS â”€â”€ */}
          <div className="pt-1 border-t border-stone-200 space-y-2">
            {!isCompleted && (
              <button
                type="button"
                onClick={handleMarkComplete}
                className="w-full py-3 px-4 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 font-semibold text-sm flex items-center justify-center gap-2 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Mark All Complete</span>
              </button>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(work);
                }}
                className="flex-1 py-3 px-3 rounded-xl border border-stone-300 text-stone-700 font-semibold text-sm flex items-center justify-center gap-1.5 hover:bg-stone-50 transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className={`py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 transition-all ${
                  confirmDelete
                    ? 'bg-rose-700 text-white border border-rose-700'
                    : 'border border-stone-300 text-stone-500 hover:text-rose-700 hover:border-rose-300'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{confirmDelete ? 'Confirm Delete?' : 'Delete'}</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
