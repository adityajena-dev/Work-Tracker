import React, { useState, useEffect } from 'react';
import { BlouseWork } from '../types/work';
import { getDateOffsetString, getTodayString, formatDuration } from '../utils/priority';
import { loadWorkTypes } from '../utils/storage';
import { X, Plus, Minus, Calendar, Clock, User } from 'lucide-react';

interface AddEditWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (workData: Omit<BlouseWork, 'id' | 'createdAt'> & { id?: string }) => void;
  initialWork?: BlouseWork | null;
}

// Work types are loaded from storage, not hardcoded.
// On first launch they are seeded with defaults; manufacturers customise them over time.
const getWorkTypePresets = () => loadWorkTypes();

const TIME_PRESETS = [
  { minutes: 30, label: '30 min' },
  { minutes: 45, label: '45 min' },
  { minutes: 60, label: '1 hr' },
  { minutes: 90, label: '1.5 hr' },
  { minutes: 120, label: '2 hr' },
  { minutes: 180, label: '3 hr' }
];

export const AddEditWorkModal: React.FC<AddEditWorkModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialWork
}) => {
  const [customerName, setCustomerName] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [workType, setWorkType] = useState('Lining Blouse');
  const [timePerBlouse, setTimePerBlouse] = useState<number>(45);
  const [dueDate, setDueDate] = useState<string>(getDateOffsetString(2));
  const [notes, setNotes] = useState('');

  // Load work types on each open so changes from a future settings screen are reflected
  const workTypePresets = getWorkTypePresets();

  useEffect(() => {
    if (initialWork) {
      setCustomerName(initialWork.customerName);
      setQuantity(initialWork.totalQuantity);
      setWorkType(initialWork.workType);
      setTimePerBlouse(initialWork.timePerBlouseMinutes);
      setDueDate(initialWork.dueDate);
      setNotes(initialWork.notes || '');
    } else {
      setCustomerName('');
      setQuantity(1);
      // Default to the first configured work type, not a hardcoded label
      setWorkType(workTypePresets[0]?.label ?? '');
      setTimePerBlouse(workTypePresets[0]?.defaultMinutes ?? 45);
      setDueDate(getDateOffsetString(2));
      setNotes('');
    }
  }, [initialWork, isOpen]);

  if (!isOpen) return null;

  const handleSelectWorkType = (preset: { label: string; defaultMinutes: number }) => {
    setWorkType(preset.label);
    setTimePerBlouse(preset.defaultMinutes);
  };


  const handleQuickDate = (offset: number) => {
    setDueDate(getDateOffsetString(offset));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) return;

    onSave({
      id: initialWork ? initialWork.id : undefined,
      customerName: customerName.trim(),
      totalQuantity: Math.max(1, quantity),
      completedQuantity: initialWork ? Math.min(initialWork.completedQuantity, quantity) : 0,
      workType,
      timePerBlouseMinutes: Math.max(10, timePerBlouse),
      dueDate: dueDate || getTodayString(),
      notes: notes.trim() ? notes.trim() : undefined,
      completedAt: initialWork?.completedAt
    });
    onClose();
  };

  const totalMinutes = quantity * timePerBlouse;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 animate-fade-in">
      <div 
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[92vh] animate-slide-up"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-teal-800 text-white px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight leading-tight">
              {initialWork ? 'Edit Blouse' : 'Add Blouse'}
            </h2>
            <p className="text-xs text-teal-200">
              Basic details to plan and prioritize your work.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Customer Name */}
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-teal-700" />
              <span>Customer Name *</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Priya"
              className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-2xl text-stone-900 font-semibold text-base focus:bg-white focus:border-teal-700 focus:outline-none transition-all"
            />
          </div>

          {/* Number of Blouses */}
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
              Number of Blouses
            </label>
            <div className="flex items-center gap-3 bg-stone-50 p-2 rounded-2xl border border-stone-200">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-12 h-12 rounded-xl bg-white border border-stone-300 text-stone-700 text-xl font-bold flex items-center justify-center active:bg-stone-100"
              >
                <Minus className="w-5 h-5" />
              </button>

              <div className="flex-1 text-center">
                <span className="text-2xl font-bold text-stone-900 block leading-tight">
                  {quantity}
                </span>
                <span className="text-xs text-stone-500 font-medium">
                  blouse{quantity > 1 ? 's' : ''}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-12 h-12 rounded-xl bg-teal-700 text-white text-xl font-bold flex items-center justify-center active:bg-teal-800"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Work Type */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
              Work Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {workTypePresets.map((preset) => {
                const isSelected = workType === preset.label;
                return (
                  <button
                    key={preset.id ?? preset.label}
                    type="button"
                    onClick={() => handleSelectWorkType(preset)}
                    className={`p-2.5 rounded-xl border text-left transition-all text-xs ${
                      isSelected
                        ? 'border-teal-700 bg-teal-50 text-teal-900 font-bold'
                        : 'border-stone-200 bg-white text-stone-700 font-medium hover:border-stone-300'
                    }`}
                  >
                    <div>{preset.label}</div>
                    <div className="text-[10px] text-stone-400 font-normal">
                      ~{preset.defaultMinutes} min
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Needed */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-teal-700" />
                <span>Time per blouse</span>
              </label>
              <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md">
                {formatDuration(timePerBlouse)}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {TIME_PRESETS.map((preset) => {
                const isSelected = timePerBlouse === preset.minutes;
                return (
                  <button
                    key={preset.minutes}
                    type="button"
                    onClick={() => setTimePerBlouse(preset.minutes)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      isSelected
                        ? 'border-teal-700 bg-teal-700 text-white'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-teal-700" />
              <span>Due Date *</span>
            </label>

            <div className="grid grid-cols-4 gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleQuickDate(0)}
                className="py-2 px-1 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-center truncate active:scale-95 transition-all"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handleQuickDate(1)}
                className="py-2 px-1 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-center truncate active:scale-95 transition-all"
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => handleQuickDate(3)}
                className="py-2 px-1 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-center truncate active:scale-95 transition-all"
              >
                In 3 Days
              </button>
              <button
                type="button"
                onClick={() => handleQuickDate(7)}
                className="py-2 px-1 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-center truncate active:scale-95 transition-all"
              >
                In 1 Week
              </button>
            </div>

            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-2xl text-stone-900 font-medium text-sm focus:border-teal-700 focus:outline-none"
            />
          </div>

          {/* Notes — textarea for multi-line special instructions */}
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. golden lace, deep back neck"
              rows={3}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-2xl text-stone-800 text-sm font-medium focus:border-teal-700 focus:outline-none resize-none leading-relaxed"
            />
          </div>


          {/* Preview */}
          <div className="bg-stone-100 rounded-2xl p-3 text-xs text-stone-700 flex flex-wrap items-center justify-between gap-2 font-medium">
            <span>Total estimated work:</span>
            <span className="font-bold text-stone-900 whitespace-nowrap">
              {quantity} blouse{quantity > 1 ? 's' : ''} = ~{formatDuration(totalMinutes)}
            </span>
          </div>

          {/* Actions */}
          <div className="pt-2 flex gap-3 safe-bottom">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 px-4 rounded-2xl border border-stone-300 font-semibold text-stone-700 bg-white hover:bg-stone-50 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3.5 px-4 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-xs"
            >
              {initialWork ? 'Save Changes' : 'Save Blouse'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
