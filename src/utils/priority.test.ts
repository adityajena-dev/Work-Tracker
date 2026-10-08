import { rankWorkItems, generateTodaySchedule, getDateOffsetString, formatDuration } from './priority.ts';
import { BlouseWork, CapacitySettings } from '../types/work.ts';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✓ ${message}`);
}

console.log('--- Starting Refined Priority Engine & Capacity Protection Tests ---');

const capacity2h: CapacitySettings = { dailyCapacityMinutes: 120 }; // 2 hours/day

// Test 1: Heavy work in 2 days vs small 30m work tomorrow
const urgentHeavyWork: BlouseWork = {
  id: 'heavy-1',
  customerName: 'Aarti',
  totalQuantity: 6,
  completedQuantity: 0,
  workType: 'Bridal Heavy Work',
  timePerBlouseMinutes: 60, // 360 mins (6 hours)
  dueDate: getDateOffsetString(2), // due in 2 days -> 3 days capacity available = 360 mins
  createdAt: new Date().toISOString()
};

const smallQuickWork: BlouseWork = {
  id: 'quick-2',
  customerName: 'Bina',
  totalQuantity: 1,
  completedQuantity: 0,
  workType: 'Simple Blouse',
  timePerBlouseMinutes: 30, // 30 mins
  dueDate: getDateOffsetString(1), // due tomorrow
  createdAt: new Date().toISOString()
};

const ranked = rankWorkItems([smallQuickWork, urgentHeavyWork], capacity2h);
assert(ranked[0].work.id === 'heavy-1', 'Urgent 6-hour job is ranked #1 (DO NEXT) ahead of 30-min job due tomorrow');
assert(ranked[0].priority === 'DO_FIRST', 'Urgent heavy work is classified as DO_FIRST');
assert(ranked[0].badgeLabel === 'Do First', 'Badge label is English "Do First"');
assert(ranked[1].priority === 'PLAN_SOON', 'Small job due tomorrow is classified as PLAN_SOON');

// Test 2: Overdue work is always top priority
const overdueWork: BlouseWork = {
  id: 'overdue-1',
  customerName: 'Divya',
  totalQuantity: 2,
  completedQuantity: 0,
  workType: 'Lining Blouse',
  timePerBlouseMinutes: 45,
  dueDate: getDateOffsetString(-1),
  createdAt: new Date().toISOString()
};

const rankedWithOverdue = rankWorkItems([smallQuickWork, urgentHeavyWork, overdueWork], capacity2h);
assert(rankedWithOverdue[0].work.id === 'overdue-1', 'Overdue job is ranked #1 immediately');
assert(rankedWithOverdue[0].riskStatus === 'OVERDUE', 'Risk status is OVERDUE');

// Test 3: STRICT Daily Capacity Protection
// The daily plan must NEVER intentionally exceed the comfortable daily capacity (120 mins).
const todayPlan = generateTodaySchedule([urgentHeavyWork, smallQuickWork], capacity2h);
assert(todayPlan.dailyCapacityMinutes === 120, 'Capacity is 120 min');
assert(todayPlan.totalPlannedMinutes <= 120, `Planned minutes (${todayPlan.totalPlannedMinutes}) is <= 120 min`);
assert(todayPlan.plannedTasks.length > 0, 'Planned tasks exist');
assert(todayPlan.isLimitReached === true, 'Daily comfortable limit is recognized as reached');

// Test 4: Format duration English check
assert(formatDuration(90) === '1 hr 30 min', '90 minutes formats as "1 hr 30 min"');
assert(formatDuration(60) === '1 hr', '60 minutes formats as "1 hr"');
assert(formatDuration(45) === '45 min', '45 minutes formats as "45 min"');

// Test 5: Completed blouses are excluded from active list
const finishedWork: BlouseWork = {
  id: 'finished-1',
  customerName: 'Kavita',
  totalQuantity: 3,
  completedQuantity: 3,
  workType: 'Lining Blouse',
  timePerBlouseMinutes: 45,
  dueDate: getDateOffsetString(1),
  createdAt: new Date().toISOString()
};

const activeOnly = rankWorkItems([finishedWork, smallQuickWork], capacity2h);
assert(activeOnly.length === 1 && activeOnly[0].work.id === 'quick-2', 'Finished blouses excluded from active queue');

console.log('--- All Refined Tests Passed Successfully! ---');
