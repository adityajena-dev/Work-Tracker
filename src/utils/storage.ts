import { BlouseWork, CapacitySettings, WorkType, GivenOutBatch } from '../types/work';
import { getDateOffsetString } from './priority';

const WORK_STORAGE_KEY = 'blouse_planner_work_v2';
const CAPACITY_STORAGE_KEY = 'blouse_planner_capacity_v2';
const ONBOARDING_STORAGE_KEY = 'blouse_planner_onboarding_completed_v2';
const WORK_TYPES_STORAGE_KEY = 'blouse_planner_work_types_v1';
const GIVEN_OUT_BATCHES_STORAGE_KEY = 'blouse_planner_given_out_batches_v1';
const GIVEN_OUT_TEMP_STORAGE_KEY = 'blouse_planner_given_out_temp_v1';

// Legacy keys for backward-compatible migration
const LEGACY_WORK_STORAGE_KEY = 'saheli_blouse_work_v2';
const LEGACY_CAPACITY_STORAGE_KEY = 'saheli_blouse_capacity_v2';
const LEGACY_ONBOARDING_STORAGE_KEY = 'saheli_onboarding_completed_v2';
const LEGACY_WORK_TYPES_STORAGE_KEY = 'saheli_work_types_v1';
const LEGACY_GIVEN_OUT_BATCHES_STORAGE_KEY = 'saheli_given_out_batches_v1';
const LEGACY_GIVEN_OUT_TEMP_STORAGE_KEY = 'saheli_given_out_temp_v1';
const LEGACY_GIVEN_OUT_V1_KEY = 'saheli_given_out_v1';

export const DEFAULT_CAPACITY: CapacitySettings = {
  dailyCapacityMinutes: 180 // 3 hours per day default
};

/**
 * Seed work types for V1.
 * These are treated as user-configurable data, NOT hardcoded application categories.
 * They will be stored in localStorage and can be modified by future settings screens.
 * Different workshops will have completely different work-type lists.
 */
export const DEFAULT_WORK_TYPES: WorkType[] = [
  { id: 'wt-1', label: 'Simple Blouse',     defaultMinutes: 30  },
  { id: 'wt-2', label: 'Lining Blouse',     defaultMinutes: 45  },
  { id: 'wt-3', label: 'Neck Design',       defaultMinutes: 60  },
  { id: 'wt-4', label: 'Aari / Embroidery', defaultMinutes: 90  },
  { id: 'wt-5', label: 'Bridal Heavy Work', defaultMinutes: 180 },
  { id: 'wt-6', label: 'Other Work',        defaultMinutes: 45  },
];

/**
 * Helper to retrieve an item with migration from legacy keys.
 * If new key does not exist but legacy key does, reads legacy data and saves it to the new key.
 * Does not delete the legacy key immediately to ensure safety.
 */
function getMigratedItem(newKey: string, legacyKey: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const current = localStorage.getItem(newKey);
    if (current !== null) return current;

    const legacy = localStorage.getItem(legacyKey);
    if (legacy !== null) {
      // Migrate to new key
      localStorage.setItem(newKey, legacy);
      return legacy;
    }
    return null;
  } catch {
    return null;
  }
}

export function loadWorkTypes(): WorkType[] {
  if (typeof window === 'undefined') return DEFAULT_WORK_TYPES;
  try {
    const raw = getMigratedItem(WORK_TYPES_STORAGE_KEY, LEGACY_WORK_TYPES_STORAGE_KEY);
    if (!raw) return DEFAULT_WORK_TYPES; // First launch — use seed defaults
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_WORK_TYPES;
  } catch {
    return DEFAULT_WORK_TYPES;
  }
}

export function saveWorkTypes(types: WorkType[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WORK_TYPES_STORAGE_KEY, JSON.stringify(types));
  } catch (err) {
    console.error('Failed to save work types:', err);
  }
}

export function isOnboardingCompleted(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const val = getMigratedItem(ONBOARDING_STORAGE_KEY, LEGACY_ONBOARDING_STORAGE_KEY);
    return val === 'true';
  } catch {
    return false;
  }
}

export function setOnboardingCompleted(completed: boolean = true): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, completed ? 'true' : 'false');
  } catch (err) {
    console.error('Failed to save onboarding state:', err);
  }
}

export function loadWorkItems(): BlouseWork[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = getMigratedItem(WORK_STORAGE_KEY, LEGACY_WORK_STORAGE_KEY);
    if (!raw) {
      // Do NOT load fake customer data for a new user. Return empty array.
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to read from localStorage:', err);
    return [];
  }
}

export function saveWorkItems(items: BlouseWork[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WORK_STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

export function loadCapacitySettings(): CapacitySettings {
  if (typeof window === 'undefined') return DEFAULT_CAPACITY;
  try {
    const raw = getMigratedItem(CAPACITY_STORAGE_KEY, LEGACY_CAPACITY_STORAGE_KEY);
    if (!raw) return DEFAULT_CAPACITY;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed.dailyCapacityMinutes === 'number' ? parsed : DEFAULT_CAPACITY;
  } catch {
    return DEFAULT_CAPACITY;
  }
}

export function saveCapacitySettings(settings: CapacitySettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CAPACITY_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save capacity settings:', err);
  }
}

/**
 * Optional sample data generator for development/testing only.
 * Must NOT run automatically on first launch.
 */
export function getSampleDataForTesting(): BlouseWork[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'sample-1',
      customerName: 'Priya',
      totalQuantity: 6,
      completedQuantity: 2,
      workType: 'Lining Blouse',
      timePerBlouseMinutes: 45,
      dueDate: getDateOffsetString(2),
      notes: 'Golden lace on sleeves',
      createdAt: now
    },
    {
      id: 'sample-2',
      customerName: 'Anjali',
      totalQuantity: 1,
      completedQuantity: 0,
      workType: 'Bridal Heavy Work',
      timePerBlouseMinutes: 180,
      dueDate: getDateOffsetString(1),
      notes: 'Wedding blouse - zari work',
      createdAt: now
    },
    {
      id: 'sample-3',
      customerName: 'Neha',
      totalQuantity: 2,
      completedQuantity: 1,
      workType: 'Simple Blouse',
      timePerBlouseMinutes: 30,
      dueDate: getDateOffsetString(1),
      notes: 'Front buttons',
      createdAt: now
    }
  ];
}

export function resetToSampleData(): BlouseWork[] {
  const seed = getSampleDataForTesting();
  saveWorkItems(seed);
  return seed;
}

export function clearAllWork(): BlouseWork[] {
  saveWorkItems([]);
  return [];
}

export function loadGivenOutBatches(): GivenOutBatch[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = getMigratedItem(GIVEN_OUT_BATCHES_STORAGE_KEY, LEGACY_GIVEN_OUT_BATCHES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }

    // Migration fallback: check legacy v1 storage if batches not set yet
    const legacyRaw = localStorage.getItem(LEGACY_GIVEN_OUT_V1_KEY);
    if (legacyRaw) {
      const legacyParsed = JSON.parse(legacyRaw);
      if (Array.isArray(legacyParsed)) {
        // Migrated from GivenOutEntry[]
        const batches: GivenOutBatch[] = legacyParsed.map((entry, idx) => ({
          id: entry.id || `migrated-${idx}`,
          quantity: entry.quantity || 1,
          confirmedAt: entry.givenAt || new Date().toISOString()
        }));
        saveGivenOutBatches(batches);
        return batches;
      } else if (legacyParsed && typeof legacyParsed === 'object') {
        // Migrated from DailyGivenOutTotals: Record<string, number>
        const batches: GivenOutBatch[] = [];
        let idx = 0;
        for (const [date, count] of Object.entries(legacyParsed)) {
          if (typeof count === 'number' && count > 0) {
            batches.push({
              id: `migrated-${date}-${idx++}`,
              quantity: count,
              confirmedAt: `${date}T12:00:00.000Z`
            });
          }
        }
        saveGivenOutBatches(batches);
        return batches;
      }
    }

    return [];
  } catch (err) {
    console.error('Failed to load given-out batches:', err);
    return [];
  }
}

export function saveGivenOutBatches(batches: GivenOutBatch[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GIVEN_OUT_BATCHES_STORAGE_KEY, JSON.stringify(batches));
  } catch (err) {
    console.error('Failed to save given-out batches:', err);
  }
}

export function loadTempGivenOutBatch(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = getMigratedItem(GIVEN_OUT_TEMP_STORAGE_KEY, LEGACY_GIVEN_OUT_TEMP_STORAGE_KEY);
    if (!raw) return 0;
    const count = parseInt(raw, 10);
    return isNaN(count) || count < 0 ? 0 : count;
  } catch {
    return 0;
  }
}

export function saveTempGivenOutBatch(count: number): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GIVEN_OUT_TEMP_STORAGE_KEY, count.toString());
  } catch (err) {
    console.error('Failed to save temp given-out batch:', err);
  }
}


