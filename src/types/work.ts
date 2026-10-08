export type PriorityLevel = 'DO_FIRST' | 'PLAN_SOON' | 'CAN_WAIT';

export type RiskStatus = 'OVERDUE' | 'HIGH_RISK' | 'DUE_TODAY' | 'DUE_TOMORROW' | 'ON_TRACK';

/**
 * A work type configured by the manufacturer/workshop.
 * These are NOT hardcoded by the application — they are user data.
 *
 * Long-term model:
 *   Manufacturer → WorkType → default time per blouse
 *
 * When creating an order, the user selects from their own configured work types.
 */
export interface WorkType {
  id: string;
  label: string;
  defaultMinutes: number;
}

export interface BlouseWork {
  id: string;
  customerName: string;
  totalQuantity: number;
  completedQuantity: number;
  workType: string;
  timePerBlouseMinutes: number;
  dueDate: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string;
  completedAt?: string;
}

export interface CapacitySettings {
  dailyCapacityMinutes: number; // e.g. 180 = 3 hours
}

export interface WorkAnalysis {
  work: BlouseWork;
  remainingQuantity: number;
  remainingMinutes: number;
  daysRemaining: number; // 0 = today, 1 = tomorrow, negative = overdue
  availableCapacityMinutes: number;
  workDeficitMinutes: number;
  urgencyRatio: number;
  priority: PriorityLevel;
  riskStatus: RiskStatus;
  urgencyScore: number;
  badgeLabel: string;
  riskMessage: string;
}

export interface TodayTaskItem {
  work: BlouseWork;
  analysis: WorkAnalysis;
  blousesToTargetToday: number;
  minutesTargetToday: number;
  order: number;
  note?: string; // e.g., "Continue tomorrow"
}

export interface TodaySummary {
  plannedTasks: TodayTaskItem[];
  totalPlannedMinutes: number;
  dailyCapacityMinutes: number;
  remainingCapacityMinutes: number;
  isLimitReached: boolean;
}

export type ActiveTab = 'home' | 'work' | 'today' | 'history';

/**
 * A confirmed batch of blouses given out.
 * Created when the user clicks 'Confirm'.
 */
export interface GivenOutBatch {
  id: string;
  quantity: number;
  confirmedAt: string; // ISO 8601 string (e.g. 2026-10-07T10:30:00.000Z)
}

/**
 * Kept for backwards compatibility if needed.
 */
export type DailyGivenOutTotals = Record<string, number>;
export interface GivenOutEntry {
  id: string;
  quantity: number;
  givenAt: string;
}
