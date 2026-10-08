import React, { useState } from 'react';
import { CapacitySettings } from '../types/work';
import { Clock, Check, X } from 'lucide-react';
import { formatDuration } from '../utils/priority';
import { DataBackupSection } from './DataBackupSection';
import { BlousePlannerBackup } from '../utils/backup';

interface CapacityModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCapacity: CapacitySettings;
  onSave: (newSettings: CapacitySettings) => void;
  onRestoreBackup?: (backup: BlousePlannerBackup) => void;
}

const PRESET_OPTIONS = [
  { minutes: 90, label: '1 hr 30 min', desc: 'Light, gentle pace' },
  { minutes: 120, label: '2 hours', desc: 'Balanced and comfortable' },
  { minutes: 180, label: '3 hours', desc: 'Regular tailoring pace' },
  { minutes: 240, label: '4 hours', desc: 'More work with breaks' },
];

export const CapacityModal: React.FC<CapacityModalProps> = ({
  isOpen,
  onClose,
  currentCapacity,
  onSave,
  onRestoreBackup
}) => {
  const [selectedMinutes, setSelectedMinutes] = useState<number>(currentCapacity.dailyCapacityMinutes);
  const [isCustom, setIsCustom] = useState<boolean>(
    !PRESET_OPTIONS.some(opt => opt.minutes === currentCapacity.dailyCapacityMinutes)
  );
  const [customHours, setCustomHours] = useState<number>(
    Math.floor(currentCapacity.dailyCapacityMinutes / 60) || 3
  );

  if (!isOpen) return null;

  const handleApply = () => {
    const finalMinutes = isCustom ? customHours * 60 : selectedMinutes;
    onSave({ dailyCapacityMinutes: Math.max(30, finalMinutes) });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 animate-fade-in">
      <div 
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-stone-50 px-6 py-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 leading-tight">
                Comfortable Daily Capacity
              </h2>
              <p className="text-xs text-stone-500">
                {formatDuration(isCustom ? customHours * 60 : selectedMinutes)} / day
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white text-stone-500 hover:text-stone-800 flex items-center justify-center border border-stone-200"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          <p className="text-xs text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-200">
            This is your comfortable working time, not a target you must complete. We use this to prevent last-minute overload.
          </p>

          <div className="space-y-2">
            {PRESET_OPTIONS.map((opt) => {
              const isSelected = !isCustom && selectedMinutes === opt.minutes;
              return (
                <button
                  key={opt.minutes}
                  type="button"
                  onClick={() => {
                    setSelectedMinutes(opt.minutes);
                    setIsCustom(false);
                  }}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-teal-700 bg-teal-50/70 text-teal-950 font-bold'
                      : 'border-stone-200 bg-white hover:border-stone-300 text-stone-800'
                  }`}
                >
                  <div>
                    <div className="text-base">{opt.label}</div>
                    <div className="text-xs text-stone-500 font-normal">{opt.desc}</div>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                    isSelected ? 'bg-teal-700 border-teal-700 text-white' : 'border-stone-300 bg-stone-50'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}

            {/* Custom */}
            <button
              type="button"
              onClick={() => setIsCustom(true)}
              className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                isCustom
                  ? 'border-teal-700 bg-teal-50/70 text-teal-950 font-bold'
                  : 'border-stone-200 bg-white hover:border-stone-300 text-stone-800'
              }`}
            >
              <div>
                <div className="text-base">Custom Hours</div>
                <div className="text-xs text-stone-500 font-normal">Choose your own hours per day</div>
              </div>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                isCustom ? 'bg-teal-700 border-teal-700 text-white' : 'border-stone-300 bg-stone-50'
              }`}>
                {isCustom && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </button>
          </div>

          {isCustom && (
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-stone-700 min-w-0">Hours per day:</span>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setCustomHours(Math.max(1, customHours - 1))}
                  className="w-10 h-10 rounded-xl bg-white border border-stone-300 text-stone-700 font-bold text-lg flex items-center justify-center shrink-0 active:scale-95"
                >
                  -
                </button>
                <span className="font-bold text-base text-stone-900 w-12 text-center whitespace-nowrap">
                  {customHours} hr
                </span>
                <button
                  type="button"
                  onClick={() => setCustomHours(Math.min(8, customHours + 1))}
                  className="w-10 h-10 rounded-xl bg-white border border-stone-300 text-stone-700 font-bold text-lg flex items-center justify-center shrink-0 active:scale-95"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Backup & Restore Data Section */}
          {onRestoreBackup && (
            <DataBackupSection onRestoreCompleted={onRestoreBackup} />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex gap-3 safe-bottom">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-2xl border border-stone-300 font-semibold text-stone-700 bg-white hover:bg-stone-100 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 py-3 px-4 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-xs"
          >
            Save Capacity
          </button>
        </div>
      </div>
    </div>
  );
};
