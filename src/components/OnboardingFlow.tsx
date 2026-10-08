import React, { useState } from 'react';
import { BlouseWork, CapacitySettings } from '../types/work';
import { getDateOffsetString, formatDuration } from '../utils/priority';
import { Clock, Plus, Minus, ArrowRight, Check } from 'lucide-react';

interface OnboardingFlowProps {
  onComplete: (firstBlouse: BlouseWork, initialCapacity: CapacitySettings) => void;
}

const CAPACITY_OPTIONS = [
  { minutes: 90, label: '1 hr 30 min' },
  { minutes: 120, label: '2 hours' },
  { minutes: 180, label: '3 hours' },
  { minutes: 240, label: '4 hours' },
];

const WORK_TYPES = [
  'Simple Blouse',
  'Lining Blouse',
  'Neck Design',
  'Aari / Embroidery',
  'Bridal Work',
  'Other Work'
];

const TIME_PRESETS = [
  { minutes: 30, label: '30 min' },
  { minutes: 45, label: '45 min' },
  { minutes: 60, label: '1 hr' },
  { minutes: 90, label: '1.5 hr' },
  { minutes: 120, label: '2 hr' },
];

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [step, setStep] = useState<'WELCOME' | 'CAPACITY' | 'FIRST_BLOUSE' | 'READY'>('WELCOME');

  // Step 1: Capacity
  const [capacityMinutes, setCapacityMinutes] = useState<number>(180); // 3 hours default
  const [isCustomCapacity, setIsCustomCapacity] = useState<boolean>(false);
  const [customHours, setCustomHours] = useState<number>(3);

  // Step 2: First Blouse
  const [customerName, setCustomerName] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(2);
  const [workType, setWorkType] = useState<string>('Lining Blouse');
  const [timePerBlouse, setTimePerBlouse] = useState<number>(45);
  const [dueDate, setDueDate] = useState<string>(getDateOffsetString(2));
  const [notes, setNotes] = useState<string>('');

  // Created First Blouse for Step 3
  const [createdBlouse, setCreatedBlouse] = useState<BlouseWork | null>(null);

  const handleCapacityNext = () => {
    const finalMinutes = isCustomCapacity ? customHours * 60 : capacityMinutes;
    setCapacityMinutes(finalMinutes);
    setStep('FIRST_BLOUSE');
  };

  const handleSaveFirstBlouse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) return;

    const blouse: BlouseWork = {
      id: 'blouse-' + Date.now(),
      customerName: customerName.trim(),
      totalQuantity: Math.max(1, quantity),
      completedQuantity: 0,
      workType,
      timePerBlouseMinutes: timePerBlouse,
      dueDate: dueDate || getDateOffsetString(2),
      notes: notes.trim() ? notes.trim() : undefined,
      createdAt: new Date().toISOString()
    };

    setCreatedBlouse(blouse);
    setStep('READY');
  };

  const handleFinishOnboarding = () => {
    if (createdBlouse) {
      onComplete(createdBlouse, { dailyCapacityMinutes: capacityMinutes });
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#1c1917] flex flex-col justify-between p-5 max-w-md mx-auto">
      {/* SCREEN 0: WELCOME */}
      {step === 'WELCOME' && (
        <div className="my-auto space-y-6 animate-fade-in text-center py-8">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 mx-auto flex items-center justify-center text-3xl shadow-xs">
            ✂️
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#1c1917]">
              Let's set up your work plan
            </h1>
            <p className="text-base text-stone-600 leading-relaxed max-w-sm mx-auto font-normal">
              We'll help you finish important blouse work early and avoid last-minute pressure.
            </p>
          </div>

          <div className="pt-6">
            <button
              onClick={() => setStep('CAPACITY')}
              className="w-full min-h-[56px] rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-lg shadow-sm active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 1: CAPACITY */}
      {step === 'CAPACITY' && (
        <div className="my-auto space-y-6 animate-fade-in py-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
              Step 1 of 2
            </span>
            <h2 className="text-2xl font-bold text-[#1c1917] mt-1">
              How much work can you comfortably do in a day?
            </h2>
            <p className="text-sm text-stone-600 mt-2 leading-relaxed">
              This is your comfortable working time, not a target you must complete.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {CAPACITY_OPTIONS.map((opt) => {
              const isSelected = !isCustomCapacity && capacityMinutes === opt.minutes;
              return (
                <button
                  key={opt.minutes}
                  type="button"
                  onClick={() => {
                    setCapacityMinutes(opt.minutes);
                    setIsCustomCapacity(false);
                  }}
                  className={`w-full min-h-[56px] px-5 py-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    isSelected
                      ? 'border-teal-700 bg-teal-50/60 text-teal-950 font-bold'
                      : 'border-stone-200 bg-white hover:border-stone-300 text-stone-800 font-medium'
                  }`}
                >
                  <span className="text-base">{opt.label}</span>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-teal-700 text-white flex items-center justify-center">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}

            {/* Custom Option */}
            <button
              type="button"
              onClick={() => setIsCustomCapacity(true)}
              className={`w-full min-h-[56px] px-5 py-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                isCustomCapacity
                  ? 'border-teal-700 bg-teal-50/60 text-teal-950 font-bold'
                  : 'border-stone-200 bg-white hover:border-stone-300 text-stone-800 font-medium'
              }`}
            >
              <span className="text-base">Custom</span>
              {isCustomCapacity && (
                <div className="w-6 h-6 rounded-full bg-teal-700 text-white flex items-center justify-center">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              )}
            </button>

            {isCustomCapacity && (
              <div className="bg-white border border-stone-200 rounded-2xl p-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-stone-700">Hours per day:</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCustomHours(Math.max(1, customHours - 1))}
                    className="w-10 h-10 rounded-xl bg-stone-100 text-stone-800 text-xl font-bold flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="text-lg font-bold text-stone-900 w-12 text-center">
                    {customHours} hr
                  </span>
                  <button
                    type="button"
                    onClick={() => setCustomHours(Math.min(8, customHours + 1))}
                    className="w-10 h-10 rounded-xl bg-stone-100 text-stone-800 text-xl font-bold flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4">
            <button
              onClick={handleCapacityNext}
              className="w-full min-h-[56px] rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-base shadow-sm active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <span>Continue</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: ADD FIRST BLOUSE */}
      {step === 'FIRST_BLOUSE' && (
        <form onSubmit={handleSaveFirstBlouse} className="my-auto space-y-5 animate-fade-in py-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
              Step 2 of 2
            </span>
            <h2 className="text-2xl font-bold text-[#1c1917] mt-1">
              Add your first blouse
            </h2>
            <p className="text-sm text-stone-600 mt-1">
              Enter basic details to calculate what needs your attention first.
            </p>
          </div>

          {/* Customer Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
              Customer Name *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Riya"
              className="w-full px-4 py-3.5 bg-white border border-stone-300 rounded-2xl text-stone-900 font-semibold text-base focus:border-teal-700 focus:outline-none shadow-xs"
            />
          </div>

          {/* Number of Blouses */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
              Number of Blouses
            </label>
            <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-stone-300">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-12 h-12 rounded-xl bg-stone-100 text-stone-700 text-2xl font-bold flex items-center justify-center shrink-0 active:bg-stone-200"
              >
                <Minus className="w-5 h-5 shrink-0" />
              </button>
              <div className="flex-1 text-center font-bold text-2xl text-stone-900">
                {quantity}
              </div>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-12 h-12 rounded-xl bg-teal-700 text-white text-2xl font-bold flex items-center justify-center shrink-0 active:bg-teal-800"
              >
                <Plus className="w-5 h-5 shrink-0" />
              </button>
            </div>
          </div>

          {/* Work Type */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
              Work Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {WORK_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setWorkType(type)}
                  className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                    workType === type
                      ? 'border-teal-700 bg-teal-50 text-teal-900 font-bold'
                      : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Time Needed */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
              Time needed per blouse
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {TIME_PRESETS.map((preset) => (
                <button
                  key={preset.minutes}
                  type="button"
                  onClick={() => setTimePerBlouse(preset.minutes)}
                  className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                    timePerBlouse === preset.minutes
                      ? 'border-teal-700 bg-teal-700 text-white'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
              Due Date
            </label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-stone-300 rounded-2xl text-stone-900 font-semibold text-sm focus:border-teal-700 focus:outline-none"
            />
          </div>

          {/* Optional Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. golden lace, deep back neck"
              className="w-full px-4 py-3 bg-white border border-stone-300 rounded-2xl text-stone-900 font-medium text-sm focus:border-teal-700 focus:outline-none"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full min-h-[56px] rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-base shadow-sm active:scale-[0.99] transition-all"
            >
              Save Blouse
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: YOU'RE READY */}
      {step === 'READY' && createdBlouse && (
        <div className="my-auto space-y-6 animate-fade-in text-center py-6">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
              Setup Complete
            </span>
            <h2 className="text-3xl font-extrabold text-[#1c1917]">
              You're ready.
            </h2>
            <p className="text-stone-600 text-sm">
              Here is your first recommended task:
            </p>
          </div>

          {/* Recommendation Card */}
          <div className="bg-white border-2 border-teal-700/80 rounded-3xl p-6 text-left shadow-sm space-y-4 max-w-sm mx-auto">
            <div>
              <span className="text-xs font-extrabold text-teal-800 uppercase tracking-wide">
                Start with
              </span>
              <h3 className="text-2xl font-bold text-stone-900 mt-0.5">
                {createdBlouse.customerName}
              </h3>
              <p className="text-xs font-medium text-stone-500 mt-0.5">
                {createdBlouse.workType}
              </p>
            </div>

            <div className="bg-stone-50 rounded-2xl p-3.5 space-y-1.5 text-sm border border-stone-200/80">
              <div className="font-semibold text-stone-800">
                {createdBlouse.totalQuantity} blouse{createdBlouse.totalQuantity > 1 ? 's' : ''} left
              </div>
              <div className="text-xs text-stone-600 flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-teal-700" />
                <span>About {formatDuration(createdBlouse.totalQuantity * createdBlouse.timePerBlouseMinutes)} of work</span>
              </div>
              <div className="text-xs text-stone-500 font-medium">
                Due {createdBlouse.dueDate}
              </div>
            </div>
          </div>

          <div className="pt-4 max-w-sm mx-auto">
            <button
              onClick={handleFinishOnboarding}
              className="w-full min-h-[56px] rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-lg shadow-sm active:scale-[0.99] transition-all"
            >
              Start Work
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
