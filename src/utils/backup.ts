import { BlouseWork, CapacitySettings, WorkType, GivenOutBatch } from '../types/work';
import {
  loadWorkItems,
  saveWorkItems,
  loadCapacitySettings,
  saveCapacitySettings,
  loadWorkTypes,
  saveWorkTypes,
  isOnboardingCompleted,
  setOnboardingCompleted,
  loadGivenOutBatches,
  saveGivenOutBatches,
  loadTempGivenOutBatch,
  saveTempGivenOutBatch
} from './storage';

export const CURRENT_BACKUP_VERSION = 1;

export interface BackupDataPayload {
  workItems: BlouseWork[];
  capacitySettings: CapacitySettings;
  workTypes: WorkType[];
  onboardingCompleted: boolean;
  givenOutBatches: GivenOutBatch[];
  tempGivenOutBatch: number;
}

export interface BlousePlannerBackup {
  backupVersion: number;
  app: string;
  exportedAt: string;
  data: BackupDataPayload;
}

export interface ValidationSuccess {
  isValid: true;
  backup: BlousePlannerBackup;
}

export interface ValidationFailure {
  isValid: false;
  errorMessage: string;
}

export type ValidationResult = ValidationSuccess | ValidationFailure;

/**
 * Collects current application data from localStorage and returns a formatted backup object.
 */
export function createBackup(): BlousePlannerBackup {
  return {
    backupVersion: CURRENT_BACKUP_VERSION,
    app: 'Blouse Work Planner',
    exportedAt: new Date().toISOString(),
    data: {
      workItems: loadWorkItems(),
      capacitySettings: loadCapacitySettings(),
      workTypes: loadWorkTypes(),
      onboardingCompleted: isOnboardingCompleted(),
      givenOutBatches: loadGivenOutBatches(),
      tempGivenOutBatch: loadTempGivenOutBatch(),
    }
  };
}

/**
 * Triggers a browser download of the backup JSON file.
 * Filename format: blouse-planner-backup-YYYY-MM-DD.json
 */
export function exportBackupToFile(): void {
  const backup = createBackup();
  const jsonString = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const filename = `blouse-planner-backup-${year}-${month}-${day}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Defensive validation and migration for backup data.
 */
export function validateAndParseBackup(rawText: string): ValidationResult {
  if (!rawText || !rawText.trim()) {
    return { isValid: false, errorMessage: 'The selected backup file is empty.' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return { isValid: false, errorMessage: 'Invalid file format. Please choose a valid JSON backup file.' };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { isValid: false, errorMessage: 'Invalid backup format.' };
  }

  const obj = parsed as Record<string, unknown>;

  // Check app identification
  if (typeof obj.app !== 'string' || !obj.app.toLowerCase().includes('blouse')) {
    return { isValid: false, errorMessage: 'This file is not a recognized Blouse Work Planner backup.' };
  }

  // Check backup version
  if (typeof obj.backupVersion !== 'number' || obj.backupVersion < 1) {
    return { isValid: false, errorMessage: 'Unsupported or missing backup version.' };
  }

  // Version migration support hook (future migrations can run here)
  if (obj.backupVersion > CURRENT_BACKUP_VERSION) {
    return {
      isValid: false,
      errorMessage: `This backup was made by a newer version (v${obj.backupVersion}). Please update the app first.`
    };
  }

  if (!obj.data || typeof obj.data !== 'object' || Array.isArray(obj.data)) {
    return { isValid: false, errorMessage: 'Backup data is missing or corrupted.' };
  }

  const rawData = obj.data as Record<string, unknown>;

  // Validate workItems (strictly reject if any item is malformed)
  if (!Array.isArray(rawData.workItems)) {
    return { isValid: false, errorMessage: 'Work orders data is missing or invalid in backup.' };
  }

  const validatedWorkItems: BlouseWork[] = [];
  for (const item of rawData.workItems) {
    if (!item || typeof item !== 'object') {
      return { isValid: false, errorMessage: 'Corrupted work item found in backup.' };
    }
    const w = item as Record<string, unknown>;
    if (
      typeof w.id !== 'string' ||
      !w.id.trim() ||
      typeof w.customerName !== 'string' ||
      !w.customerName.trim() ||
      typeof w.totalQuantity !== 'number' ||
      w.totalQuantity <= 0 ||
      typeof w.completedQuantity !== 'number' ||
      w.completedQuantity < 0 ||
      typeof w.workType !== 'string' ||
      typeof w.timePerBlouseMinutes !== 'number' ||
      w.timePerBlouseMinutes <= 0 ||
      typeof w.dueDate !== 'string' ||
      !w.dueDate.trim() ||
      typeof w.createdAt !== 'string'
    ) {
      return { isValid: false, errorMessage: 'Corrupted work order details found in backup.' };
    }
    validatedWorkItems.push(w as unknown as BlouseWork);
  }

  // Validate capacitySettings (strictly check format)
  let capacitySettings: CapacitySettings = { dailyCapacityMinutes: 180 };
  if (rawData.capacitySettings !== undefined) {
    if (!rawData.capacitySettings || typeof rawData.capacitySettings !== 'object') {
      return { isValid: false, errorMessage: 'Daily capacity settings in backup are corrupted.' };
    }
    const c = rawData.capacitySettings as Record<string, unknown>;
    if (typeof c.dailyCapacityMinutes !== 'number' || c.dailyCapacityMinutes <= 0) {
      return { isValid: false, errorMessage: 'Invalid daily working minutes in backup.' };
    }
    capacitySettings = { dailyCapacityMinutes: c.dailyCapacityMinutes };
  }

  // Validate workTypes (strictly reject if any item is malformed, but allow empty array [])
  let workTypes: WorkType[] = [];
  if (rawData.workTypes !== undefined) {
    if (!Array.isArray(rawData.workTypes)) {
      return { isValid: false, errorMessage: 'Work types data is corrupted in backup.' };
    }
    for (const wt of rawData.workTypes) {
      if (!wt || typeof wt !== 'object') {
        return { isValid: false, errorMessage: 'Corrupted work type found in backup.' };
      }
      const t = wt as Record<string, unknown>;
      if (
        typeof t.id !== 'string' ||
        !t.id.trim() ||
        typeof t.label !== 'string' ||
        !t.label.trim() ||
        typeof t.defaultMinutes !== 'number' ||
        t.defaultMinutes <= 0
      ) {
        return { isValid: false, errorMessage: 'Corrupted work type details found in backup.' };
      }
      workTypes.push(t as unknown as WorkType);
    }
  }

  // Validate givenOutBatches (strictly reject if any batch is malformed)
  let givenOutBatches: GivenOutBatch[] = [];
  if (rawData.givenOutBatches !== undefined) {
    if (!Array.isArray(rawData.givenOutBatches)) {
      return { isValid: false, errorMessage: 'Delivery history in backup is corrupted.' };
    }
    for (const b of rawData.givenOutBatches) {
      if (!b || typeof b !== 'object') {
        return { isValid: false, errorMessage: 'Corrupted delivery record found in backup.' };
      }
      const batch = b as Record<string, unknown>;
      if (
        typeof batch.id !== 'string' ||
        !batch.id.trim() ||
        typeof batch.quantity !== 'number' ||
        batch.quantity <= 0 ||
        typeof batch.confirmedAt !== 'string' ||
        !batch.confirmedAt.trim()
      ) {
        return { isValid: false, errorMessage: 'Corrupted delivery record details found in backup.' };
      }
      givenOutBatches.push(batch as unknown as GivenOutBatch);
    }
  }

  // Validate tempGivenOutBatch
  let tempGivenOutBatch = 0;
  if (rawData.tempGivenOutBatch !== undefined) {
    if (typeof rawData.tempGivenOutBatch !== 'number' || rawData.tempGivenOutBatch < 0) {
      return { isValid: false, errorMessage: 'Corrupted temporary delivery batch in backup.' };
    }
    tempGivenOutBatch = rawData.tempGivenOutBatch;
  }

  // Validate onboardingCompleted
  const onboardingCompleted = rawData.onboardingCompleted === true;

  const sanitizedBackup: BlousePlannerBackup = {
    backupVersion: obj.backupVersion,
    app: typeof obj.app === 'string' ? obj.app : 'Blouse Work Planner',
    exportedAt: typeof obj.exportedAt === 'string' ? obj.exportedAt : new Date().toISOString(),
    data: {
      workItems: validatedWorkItems,
      capacitySettings,
      workTypes,
      onboardingCompleted,
      givenOutBatches,
      tempGivenOutBatch,
    }
  };

  return { isValid: true, backup: sanitizedBackup };
}

/**
 * Restores all verified backup data directly to localStorage.
 * Does NOT clear unrelated keys. Writes cleanly to all app keys.
 * Correctly restores workTypes even when empty ([]).
 */
export function restoreBackupToStorage(backup: BlousePlannerBackup): void {
  saveWorkItems(backup.data.workItems);
  saveCapacitySettings(backup.data.capacitySettings);
  if (Array.isArray(backup.data.workTypes)) {
    saveWorkTypes(backup.data.workTypes);
  }
  setOnboardingCompleted(backup.data.onboardingCompleted);
  saveGivenOutBatches(backup.data.givenOutBatches);
  saveTempGivenOutBatch(backup.data.tempGivenOutBatch);
}
