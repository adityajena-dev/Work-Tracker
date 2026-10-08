import {
  createBackup,
  validateAndParseBackup,
  restoreBackupToStorage
} from './backup';
import {
  saveWorkItems,
  loadWorkItems,
  saveCapacitySettings,
  loadCapacitySettings,
  saveWorkTypes,
  loadWorkTypes,
  saveGivenOutBatches,
  loadGivenOutBatches,
  saveTempGivenOutBatch,
  loadTempGivenOutBatch,
  setOnboardingCompleted,
  isOnboardingCompleted
} from './storage';
import { BlouseWork, GivenOutBatch, WorkType } from '../types/work';

// Simple in-memory localStorage shim for NodeJS testing environment
class LocalStorageMock {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

const mockStorage = new LocalStorageMock();
(globalThis as any).localStorage = mockStorage;
(globalThis as any).window = { localStorage: mockStorage };

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✓ ${message}`);
  }
}

console.log('--- Starting Comprehensive Backup & Restore Tests ---');

// 1. Populate real initial test data across all keys
const initialOrders: BlouseWork[] = [
  {
    id: 'blouse-101',
    customerName: 'Meena',
    totalQuantity: 3,
    completedQuantity: 1,
    workType: 'Neck Design',
    timePerBlouseMinutes: 60,
    dueDate: '2026-10-10',
    notes: 'Square neck with piping',
    createdAt: '2026-10-08T09:00:00.000Z'
  },
  {
    id: 'blouse-102',
    customerName: 'Sunita',
    totalQuantity: 2,
    completedQuantity: 2,
    workType: 'Bridal Heavy Work',
    timePerBlouseMinutes: 180,
    dueDate: '2026-10-09',
    completedAt: '2026-10-08T10:00:00.000Z',
    createdAt: '2026-10-07T08:00:00.000Z'
  }
];

const initialWorkTypes: WorkType[] = [
  { id: 'custom-wt-1', label: 'Designer Cut', defaultMinutes: 75 },
  { id: 'custom-wt-2', label: 'Simple Cotton', defaultMinutes: 30 }
];

const initialBatches: GivenOutBatch[] = [
  { id: 'batch-001', quantity: 5, confirmedAt: '2026-10-07T14:30:00.000Z' },
  { id: 'batch-002', quantity: 3, confirmedAt: '2026-10-08T10:15:00.000Z' }
];

saveWorkItems(initialOrders);
saveCapacitySettings({ dailyCapacityMinutes: 240 }); // 4 hours
saveWorkTypes(initialWorkTypes);
setOnboardingCompleted(true);
saveGivenOutBatches(initialBatches);
saveTempGivenOutBatch(4);

// Verify initial state
assert(loadWorkItems().length === 2, 'Initial 2 work items saved');
assert(loadCapacitySettings().dailyCapacityMinutes === 240, 'Initial capacity set to 240 min');
assert(loadWorkTypes().length === 2, 'Initial 2 custom work types saved');
assert(isOnboardingCompleted() === true, 'Initial onboarding state is true');
assert(loadGivenOutBatches().length === 2, 'Initial 2 given out batches saved');
assert(loadTempGivenOutBatch() === 4, 'Initial temporary batch is 4');

// 2. Test createBackup
const backup = createBackup();
assert(backup.backupVersion === 1, 'Backup version is 1');
assert(backup.app === 'Blouse Work Planner', 'Backup app identifier is Blouse Work Planner');
assert(backup.data.workItems.length === 2, 'Backup contains 2 work orders');
assert(backup.data.capacitySettings.dailyCapacityMinutes === 240, 'Backup contains capacity of 240');
assert(backup.data.workTypes.length === 2, 'Backup contains work types');
assert(backup.data.givenOutBatches.length === 2, 'Backup contains given out batches');
assert(backup.data.tempGivenOutBatch === 4, 'Backup contains temp given out batch of 4');
assert(backup.data.onboardingCompleted === true, 'Backup preserves onboarding state');

// 3. Serialize and test parsing/validation
const backupJson = JSON.stringify(backup, null, 2);
const validation = validateAndParseBackup(backupJson);
assert(validation.isValid === true, 'Exported backup JSON passes validation');

// 4. Test invalid JSON handling
const invalidJsonRes = validateAndParseBackup('{ corrupted json ...');
assert(invalidJsonRes.isValid === false, 'Gracefully rejected invalid JSON syntax');
if (!invalidJsonRes.isValid) {
  assert(invalidJsonRes.errorMessage.includes('Invalid file format'), 'Error message is clear and non-technical');
}

// 5. Test empty backup
const emptyRes = validateAndParseBackup('');
assert(emptyRes.isValid === false, 'Gracefully rejected empty backup');

// 6. Test unsupported backup version
const futureVersionBackup = {
  ...backup,
  backupVersion: 99
};
const futureRes = validateAndParseBackup(JSON.stringify(futureVersionBackup));
assert(futureRes.isValid === false, 'Gracefully rejected future/unsupported backup version');

// 7. Test missing/corrupted data
const corruptedBackup = {
  backupVersion: 1,
  app: 'Blouse Work Planner',
  data: {
    workItems: 'not an array'
  }
};
const corruptedRes = validateAndParseBackup(JSON.stringify(corruptedBackup));
assert(corruptedRes.isValid === false, 'Gracefully rejected corrupted work items data');

// 8. Test wrong app name
const wrongAppBackup = {
  backupVersion: 1,
  app: 'Unknown App',
  data: backup.data
};
const wrongAppRes = validateAndParseBackup(JSON.stringify(wrongAppBackup));
assert(wrongAppRes.isValid === false, 'Gracefully rejected backup from another app');

// 9. Clear/replace current app data in test environment (Simulate data wipe or device switch)
saveWorkItems([]);
saveCapacitySettings({ dailyCapacityMinutes: 180 });
saveWorkTypes([]);
setOnboardingCompleted(false);
saveGivenOutBatches([]);
saveTempGivenOutBatch(0);

assert(loadWorkItems().length === 0, 'Current work items cleared to 0');
assert(loadGivenOutBatches().length === 0, 'Current batches cleared to 0');
assert(loadTempGivenOutBatch() === 0, 'Current temp batch reset to 0');

// 10. Perform Restore from validated backup
if (validation.isValid) {
  restoreBackupToStorage(validation.backup);
}

// 11. Verify complete restoration of all data
const restoredWork = loadWorkItems();
assert(restoredWork.length === 2, 'Restored all 2 work items');
assert(restoredWork[0].customerName === 'Meena', 'Restored customer Meena');
assert(restoredWork[1].customerName === 'Sunita', 'Restored customer Sunita');
assert(restoredWork[1].completedQuantity === 2, 'Restored completed blouse count');

const restoredCapacity = loadCapacitySettings();
assert(restoredCapacity.dailyCapacityMinutes === 240, 'Restored capacity 240 min');

const restoredWorkTypes = loadWorkTypes();
assert(restoredWorkTypes.length === 2, 'Restored 2 custom work types');
assert(restoredWorkTypes[0].label === 'Designer Cut', 'Restored work type Designer Cut');

const restoredBatches = loadGivenOutBatches();
assert(restoredBatches.length === 2, 'Restored Given Out history batches');
assert(restoredBatches[0].quantity === 5, 'Restored batch 1 quantity 5');
assert(restoredBatches[1].quantity === 3, 'Restored batch 2 quantity 3');

const restoredTempBatch = loadTempGivenOutBatch();
assert(restoredTempBatch === 4, 'Restored temporary Given Out batch count of 4');

const restoredOnboarding = isOnboardingCompleted();
assert(restoredOnboarding === true, 'Restored onboarding completion state');

// 12. Test restoring a backup where workTypes = []
const emptyWorkTypesBackup = {
  ...backup,
  data: {
    ...backup.data,
    workTypes: []
  }
};
const emptyWorkTypesValidation = validateAndParseBackup(JSON.stringify(emptyWorkTypesBackup));
assert(emptyWorkTypesValidation.isValid === true, 'Validation allows empty workTypes: []');
if (emptyWorkTypesValidation.isValid) {
  restoreBackupToStorage(emptyWorkTypesValidation.backup);
  const recheckedTypes = loadWorkTypes();
  assert(Array.isArray(recheckedTypes) && recheckedTypes.length === 0, 'Restoring backup with workTypes = [] correctly empties workTypes');
}

// 13. Test importing backup containing malformed work type (must strictly reject)
const malformedWorkTypeBackup = {
  ...backup,
  data: {
    ...backup.data,
    workTypes: [
      { id: 'wt-ok', label: 'Good Type', defaultMinutes: 30 },
      { id: '', label: 'Bad Type', defaultMinutes: -10 } // malformed
    ]
  }
};
const malformedWorkTypeRes = validateAndParseBackup(JSON.stringify(malformedWorkTypeBackup));
assert(malformedWorkTypeRes.isValid === false, 'Strictly rejected backup with a malformed work type');

// 14. Test importing backup containing malformed Given Out batch (must strictly reject)
const malformedBatchBackup = {
  ...backup,
  data: {
    ...backup.data,
    givenOutBatches: [
      { id: 'b-ok', quantity: 2, confirmedAt: '2026-10-08T10:00:00.000Z' },
      { id: 'b-bad', quantity: 0, confirmedAt: '' } // malformed
    ]
  }
};
const malformedBatchRes = validateAndParseBackup(JSON.stringify(malformedBatchBackup));
assert(malformedBatchRes.isValid === false, 'Strictly rejected backup with a malformed Given Out batch');

// 15. Test importing backup containing malformed work item (must strictly reject)
const malformedWorkItemBackup = {
  ...backup,
  data: {
    ...backup.data,
    workItems: [
      {
        id: 'w-bad',
        customerName: '', // empty name
        totalQuantity: -5 // invalid qty
      }
    ]
  }
};
const malformedWorkItemRes = validateAndParseBackup(JSON.stringify(malformedWorkItemBackup));
assert(malformedWorkItemRes.isValid === false, 'Strictly rejected backup with a malformed work order');

// 16. Verify backward-compatible migration from legacy saheli_* localStorage keys
mockStorage.clear();
mockStorage.setItem('saheli_blouse_work_v2', JSON.stringify([initialOrders[0]]));
mockStorage.setItem('saheli_blouse_capacity_v2', JSON.stringify({ dailyCapacityMinutes: 150 }));
mockStorage.setItem('saheli_work_types_v1', JSON.stringify([initialWorkTypes[0]]));
mockStorage.setItem('saheli_given_out_batches_v1', JSON.stringify([initialBatches[0]]));
mockStorage.setItem('saheli_given_out_temp_v1', '7');
mockStorage.setItem('saheli_onboarding_completed_v2', 'true');

// Read using storage functions which should migrate data into new blouse_planner_* keys
const migratedItems = loadWorkItems();
assert(migratedItems.length === 1 && migratedItems[0].customerName === 'Meena', 'Migrated work items from legacy key');
assert(loadCapacitySettings().dailyCapacityMinutes === 150, 'Migrated capacity from legacy key');
assert(loadWorkTypes().length === 1 && loadWorkTypes()[0].label === 'Designer Cut', 'Migrated work types from legacy key');
assert(loadGivenOutBatches().length === 1 && loadGivenOutBatches()[0].quantity === 5, 'Migrated batches from legacy key');
assert(loadTempGivenOutBatch() === 7, 'Migrated temp batch from legacy key');
assert(isOnboardingCompleted() === true, 'Migrated onboarding state from legacy key');

// Check that new keys now exist in localStorage
assert(mockStorage.getItem('blouse_planner_work_v2') !== null, 'New key blouse_planner_work_v2 populated');
assert(mockStorage.getItem('blouse_planner_capacity_v2') !== null, 'New key blouse_planner_capacity_v2 populated');
assert(mockStorage.getItem('saheli_blouse_work_v2') !== null, 'Old legacy key preserved without data loss');

console.log('--- All Backup & Restore Integration Tests Passed Successfully! ---');
