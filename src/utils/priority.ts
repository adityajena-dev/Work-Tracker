import { BlouseWork, CapacitySettings, WorkAnalysis, PriorityLevel, RiskStatus, TodaySummary, TodayTaskItem } from '../types/work';

/**
 * Parses a YYYY-MM-DD date string into a local Date at start of day (00:00:00)
 */
export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * Returns today's date formatted as YYYY-MM-DD
 */
export function getTodayString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns date N days from today formatted as YYYY-MM-DD
 */
export function getDateOffsetString(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats minutes into clean, human-readable English hours and minutes (e.g. "2 hr 15 min", "45 min", "1 hr")
 */
export function formatDuration(minutes: number): string {
  const mins = Math.round(minutes);
  if (mins <= 0) return '0 min';

  const h = Math.floor(mins / 60);
  const m = mins % 60;

  if (h > 0 && m > 0) {
    return `${h} hr ${m} min`;
  } else if (h > 0) {
    return `${h} hr`;
  } else {
    return `${m} min`;
  }
}

/**
 * Computes working days available from today until due date.
 * If overdue (< 0), 0 days.
 * If due today (0), 1 working day (today).
 * If due tomorrow (1), 2 working days (today + tomorrow).
 * If due in N days, (N + 1) working days.
 */
export function getWorkingDaysUntil(dueDateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = parseDate(dueDateStr);
  const diffTime = due.getTime() - today.getTime();
  const daysRemaining = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return daysRemaining < 0 ? 0 : daysRemaining + 1;
}

/**
 * Analyzes work items with awareness of total cumulative workload.
 * Evaluates whether current and future deadlines can realistically be met
 * within comfortable daily working capacity without overloading.
 */
export function rankWorkItems(items: BlouseWork[], capacity: CapacitySettings): WorkAnalysis[] {
  const pending = items.filter(w => w.completedQuantity < w.totalQuantity);
  if (pending.length === 0) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dailyCap = Math.max(30, capacity.dailyCapacityMinutes);

  // 1. Initial analysis per item
  const initialAnalyses: {
    work: BlouseWork;
    remainingQuantity: number;
    remainingMinutes: number;
    daysRemaining: number;
    workingDaysAvailable: number;
    availableCapacityMinutes: number;
    workDeficitMinutes: number;
    urgencyRatio: number;
  }[] = pending.map(w => {
    const remainingQuantity = Math.max(0, w.totalQuantity - w.completedQuantity);
    const remainingMinutes = remainingQuantity * w.timePerBlouseMinutes;
    const due = parseDate(w.dueDate);
    const diffTime = due.getTime() - today.getTime();
    const daysRemaining = Math.round(diffTime / (1000 * 60 * 60 * 24));
    const workingDaysAvailable = daysRemaining < 0 ? 0 : daysRemaining + 1;
    const availableCapacityMinutes = workingDaysAvailable * dailyCap;
    const workDeficitMinutes = remainingMinutes - availableCapacityMinutes;
    const urgencyRatio = availableCapacityMinutes > 0 ? remainingMinutes / availableCapacityMinutes : 999;

    return {
      work: w,
      remainingQuantity,
      remainingMinutes,
      daysRemaining,
      workingDaysAvailable,
      availableCapacityMinutes,
      workDeficitMinutes,
      urgencyRatio
    };
  });

  // 2. Cumulative Workload Check:
  // Sort temporally to find cumulative bottlenecks across all orders
  const byDate = [...initialAnalyses].sort((a, b) => a.daysRemaining - b.daysRemaining);
  let cumulativeMinutesRequired = 0;
  const cumulativeDeficits = new Map<string, number>();

  for (const item of byDate) {
    cumulativeMinutesRequired += item.remainingMinutes;
    const cumulativeAvailable = Math.max(1, item.workingDaysAvailable) * dailyCap;
    const cumulativeDeficit = cumulativeMinutesRequired - cumulativeAvailable;
    cumulativeDeficits.set(item.work.id, cumulativeDeficit);
  }

  // 3. Final classification and scoring
  const analyzed: WorkAnalysis[] = initialAnalyses.map(item => {
    const { work, remainingQuantity, remainingMinutes, daysRemaining, availableCapacityMinutes, workDeficitMinutes, urgencyRatio } = item;
    const cumulativeDeficit = cumulativeDeficits.get(work.id) || 0;

    let priority: PriorityLevel = 'CAN_WAIT';
    let riskStatus: RiskStatus = 'ON_TRACK';
    let urgencyScore = 0;
    let badgeLabel = 'Can Wait';
    let riskMessage = 'On track';

    // A. Overdue
    if (daysRemaining < 0) {
      priority = 'DO_FIRST';
      riskStatus = 'OVERDUE';
      badgeLabel = 'Do First';
      const d = Math.abs(daysRemaining);
      riskMessage = `Overdue by ${d} day${d > 1 ? 's' : ''}`;
      urgencyScore = 20000 + d * 500 + remainingMinutes;
    }
    // B. Individual Work Deficit (exceeds comfortable capacity before deadline)
    else if (workDeficitMinutes > 0) {
      priority = 'DO_FIRST';
      riskStatus = 'HIGH_RISK';
      badgeLabel = 'Do First';
      riskMessage = 'Needs early start to finish comfortably';
      urgencyScore = 10000 + workDeficitMinutes * 3 + (10 - Math.min(10, daysRemaining)) * 100;
    }
    // C. Cumulative Work Deficit across all pending orders
    else if (cumulativeDeficit > 0 && daysRemaining <= 3) {
      priority = 'DO_FIRST';
      riskStatus = 'HIGH_RISK';
      badgeLabel = 'Do First';
      riskMessage = 'Heavy combined workload — start now';
      urgencyScore = 8000 + cumulativeDeficit * 2 + remainingMinutes;
    }
    // D. Due Today
    else if (daysRemaining === 0) {
      priority = 'DO_FIRST';
      riskStatus = 'DUE_TODAY';
      badgeLabel = 'Do First';
      riskMessage = 'Due today';
      urgencyScore = 7000 + remainingMinutes;
    }
    // E. Due Tomorrow
    else if (daysRemaining === 1) {
      // If it takes more than 40% of comfortable daily capacity, start immediately
      if (remainingMinutes > dailyCap * 0.4) {
        priority = 'DO_FIRST';
        riskStatus = 'DUE_TOMORROW';
        badgeLabel = 'Do First';
        riskMessage = 'Due tomorrow';
        urgencyScore = 6000 + remainingMinutes;
      } else {
        priority = 'PLAN_SOON';
        riskStatus = 'DUE_TOMORROW';
        badgeLabel = 'Plan Soon';
        riskMessage = 'Due tomorrow';
        urgencyScore = 4000 + remainingMinutes;
      }
    }
    // F. High portion of capacity required (>= 60%)
    else if (urgencyRatio >= 0.60) {
      priority = 'PLAN_SOON';
      riskStatus = 'HIGH_RISK';
      badgeLabel = 'Plan Soon';
      riskMessage = `Due in ${daysRemaining} days`;
      urgencyScore = 3000 + urgencyRatio * 200 + remainingMinutes;
    }
    // G. Due in 2–3 days
    else if (daysRemaining <= 3) {
      priority = 'PLAN_SOON';
      riskStatus = 'ON_TRACK';
      badgeLabel = 'Plan Soon';
      riskMessage = `Due in ${daysRemaining} days`;
      urgencyScore = 2000 + (4 - daysRemaining) * 50 + remainingMinutes / 2;
    }
    // H. Can Wait
    else {
      priority = 'CAN_WAIT';
      riskStatus = 'ON_TRACK';
      badgeLabel = 'Can Wait';
      riskMessage = `Due in ${daysRemaining} days`;
      urgencyScore = Math.max(10, 500 - daysRemaining * 10 + remainingMinutes / 10);
    }

    return {
      work,
      remainingQuantity,
      remainingMinutes,
      daysRemaining,
      availableCapacityMinutes,
      workDeficitMinutes,
      urgencyRatio,
      priority,
      riskStatus,
      urgencyScore,
      badgeLabel,
      riskMessage
    };
  });

  // Sort descending by urgencyScore, then soonest due date, then remaining minutes
  analyzed.sort((a, b) => {
    if (b.urgencyScore !== a.urgencyScore) {
      return b.urgencyScore - a.urgencyScore;
    }
    if (a.daysRemaining !== b.daysRemaining) {
      return a.daysRemaining - b.daysRemaining;
    }
    return b.remainingMinutes - a.remainingMinutes;
  });

  return analyzed;
}

/**
 * Analyzes a single work item against capacity.
 */
export function analyzeWork(work: BlouseWork, capacity: CapacitySettings): WorkAnalysis {
  const ranked = rankWorkItems([work], capacity);
  if (ranked.length > 0) return ranked[0];

  return {
    work,
    remainingQuantity: 0,
    remainingMinutes: 0,
    daysRemaining: 0,
    availableCapacityMinutes: capacity.dailyCapacityMinutes,
    workDeficitMinutes: 0,
    urgencyRatio: 0,
    priority: 'CAN_WAIT',
    riskStatus: 'ON_TRACK',
    urgencyScore: 0,
    badgeLabel: 'Completed',
    riskMessage: 'Completed'
  };
}

/**
 * Generates Today's Schedule strictly respecting daily capacity.
 * The daily plan will NEVER intentionally exceed comfortable daily capacity.
 */
export function generateTodaySchedule(items: BlouseWork[], capacity: CapacitySettings): TodaySummary {
  const ranked = rankWorkItems(items, capacity);
  const tasks: TodayTaskItem[] = [];
  let currentPlannedMinutes = 0;
  const maxCapacity = Math.max(30, capacity.dailyCapacityMinutes);

  for (const analysis of ranked) {
    if (currentPlannedMinutes >= maxCapacity) {
      break;
    }

    const timePerPiece = analysis.work.timePerBlouseMinutes;
    const remainingPieces = analysis.remainingQuantity;
    const remainingMinutesToday = maxCapacity - currentPlannedMinutes;

    // How many pieces fit within today's remaining comfortable capacity?
    let piecesToAssign = Math.floor(remainingMinutesToday / timePerPiece);

    // If pieces fit comfortably:
    if (piecesToAssign >= 1) {
      piecesToAssign = Math.min(remainingPieces, piecesToAssign);
      const taskMinutes = piecesToAssign * timePerPiece;

      tasks.push({
        work: analysis.work,
        analysis,
        blousesToTargetToday: piecesToAssign,
        minutesTargetToday: taskMinutes,
        order: tasks.length + 1,
        note: piecesToAssign < remainingPieces ? 'Continue tomorrow' : undefined
      });

      currentPlannedMinutes += taskMinutes;
    } else {
      // If even 1 piece exceeds remaining time today, but it's the very first task:
      if (tasks.length === 0) {
        // Assign 1 piece so user knows where to start, but cap planned minutes at max capacity
        // and explicitly note that the comfortable limit is reached.
        tasks.push({
          work: analysis.work,
          analysis,
          blousesToTargetToday: 1,
          minutesTargetToday: Math.min(maxCapacity, timePerPiece),
          order: 1,
          note: 'Comfortable limit reached — continue tomorrow'
        });
        currentPlannedMinutes = maxCapacity;
      }
      break;
    }
  }

  const remainingCapacityMinutes = Math.max(0, maxCapacity - currentPlannedMinutes);
  const isLimitReached = currentPlannedMinutes >= maxCapacity;

  return {
    plannedTasks: tasks,
    totalPlannedMinutes: Math.min(maxCapacity, currentPlannedMinutes),
    dailyCapacityMinutes: maxCapacity,
    remainingCapacityMinutes,
    isLimitReached
  };
}
