import React, { useRef, useState } from 'react';
import {
  exportBackupToFile,
  validateAndParseBackup,
  restoreBackupToStorage,
  BlousePlannerBackup
} from '../utils/backup';
import {
  Download,
  Upload,
  Database,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface DataBackupSectionProps {
  onRestoreCompleted: (backup: BlousePlannerBackup) => void;
}

export const DataBackupSection: React.FC<DataBackupSectionProps> = ({
  onRestoreCompleted
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingBackup, setPendingBackup] = useState<BlousePlannerBackup | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleExport = () => {
    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      exportBackupToFile();
      setSuccessMessage('Backup downloaded successfully.');
    } catch (err) {
      console.error('Export failed:', err);
      setErrorMessage('Could not download backup. Please try again.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text !== 'string') {
        setErrorMessage('Could not read the selected file.');
        return;
      }

      const result = validateAndParseBackup(text);
      if (!result.isValid) {
        setErrorMessage(result.errorMessage);
        setPendingBackup(null);
      } else {
        setPendingBackup(result.backup);
      }
    };

    reader.onerror = () => {
      setErrorMessage('Error reading file. Please try again.');
    };

    reader.readAsText(file);
    // Reset input value so the same file can be selected again if needed
    e.target.value = '';
  };

  const handleConfirmRestore = () => {
    if (!pendingBackup) return;

    try {
      restoreBackupToStorage(pendingBackup);
      onRestoreCompleted(pendingBackup);
      setPendingBackup(null);
      setSuccessMessage('Backup restored successfully!');
    } catch (err) {
      console.error('Restore failed:', err);
      setErrorMessage('Failed to restore data. Please try again.');
    }
  };

  const handleCancelRestore = () => {
    setPendingBackup(null);
  };

  return (
    <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-3.5">
      <div className="flex items-center gap-2">
        <Database className="w-4 h-4 text-teal-800 shrink-0" />
        <h3 className="text-sm font-bold text-stone-900">
          Backup & Restore
        </h3>
      </div>

      <p className="text-xs text-stone-500 leading-relaxed">
        Save a copy of your blouse orders to this device or restore an earlier saved copy.
      </p>

      {/* Success notification */}
      {successMessage && (
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 text-xs p-3 rounded-xl border border-emerald-200 font-medium animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error notification */}
      {errorMessage && (
        <div className="flex items-center gap-2 bg-rose-50 text-rose-800 text-xs p-3 rounded-xl border border-rose-200 font-medium animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Confirmation prompt */}
      {pendingBackup ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3 animate-fade-in">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-950">
              Restore this backup?
            </h4>
            <p className="text-xs text-amber-900">
              Your current app data will be replaced.
            </p>
            <div className="text-[11px] text-amber-800 pt-1">
              Found {pendingBackup.data.workItems.length} orders
              {pendingBackup.data.givenOutBatches?.length
                ? ` and ${pendingBackup.data.givenOutBatches.length} delivery records`
                : ''}.
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleCancelRestore}
              className="flex-1 py-2.5 px-3 rounded-xl bg-white border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-100 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmRestore}
              className="flex-1 py-2.5 px-3 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold transition-all active:scale-95 shadow-xs"
            >
              Restore
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {/* Export Button */}
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white border border-stone-300 hover:border-teal-700 hover:text-teal-900 text-stone-800 text-xs font-semibold shadow-2xs active:scale-95 transition-all whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-teal-700 shrink-0" />
            <span>Export Backup</span>
          </button>

          {/* Import Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white border border-stone-300 hover:border-teal-700 hover:text-teal-900 text-stone-800 text-xs font-semibold shadow-2xs active:scale-95 transition-all whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5 text-teal-700 shrink-0" />
            <span>Import Backup</span>
          </button>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Select backup file"
          />
        </div>
      )}
    </div>
  );
};
