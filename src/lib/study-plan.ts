import { Unit, UNITS } from "./cma-units";

export type DayPlan = {
  dayNumber: number;
  date: Date;
  label: string; // "Day 1" or "Week 1"
  units: Unit[];
  totalMinutes: number;
};
export type WeekPlan = DayPlan;

export function totalMinutes(units: Unit[] = UNITS) {
  return units.reduce((s, u) => s + u.minutes, 0);
}

export function generatePlan(
  examDate: Date,
  sectionOrder: string[],
  completedKeys: Set<string>,
  from = new Date(),
  hoursPerDay = 2,
  scheduleType: "daily" | "weekly" = "daily",
  _unused_multipliers: Record<string, number> = {},
  allUnits: Unit[] = UNITS
): { weeks: DayPlan[]; recommendedHoursPerWeek: number; remainingMinutes: number; revisionDays: RevisionDay[] } {
  // Build section → units map
  const bySection: Record<string, Unit[]> = {};
  for (const u of allUnits) (bySection[u.section] ||= []).push(u);
  for (const s in bySection) bySection[s].sort((a, b) => a.index - b.index);
  const ordered = sectionOrder.flatMap(s => bySection[s] || []);

  // Filter out units already completed by the user
  const all = ordered.filter(u => !completedKeys.has(u.key));
  const remainingMins = all.reduce((s, u) => s + u.minutes, 0);

  const msPerSlot = scheduleType === "weekly" ? 7 * 86400000 : 86400000;
  const slotMinutes = scheduleType === "weekly"
    ? hoursPerDay * 7 * 60
    : hoursPerDay * 60;

  // Total slots from today until exam date
  const examMidnight = new Date(examDate);
  examMidnight.setHours(0, 0, 0, 0);
  const fromMidnight = new Date(from);
  fromMidnight.setHours(0, 0, 0, 0);

  const totalSlots = Math.max(1, Math.ceil(
    (examMidnight.getTime() - fromMidnight.getTime()) / msPerSlot
  ));

  const start = new Date(fromMidnight);

  // ── Content days ──
  // Greedily fill one day at a time up to the user's daily budget (slotMinutes).
  // New days are created as needed — however many it takes to place all units.
  const days: DayPlan[] = [];
  let cursor = 0;

  while (cursor < all.length) {
    // Never schedule a day on or after the exam date
    const nextDate = new Date(start.getTime() + (days.length) * msPerSlot);
    if (nextDate >= examMidnight) break;
    const slotNum = days.length + 1;
    const slotDate = new Date(start.getTime() + (slotNum - 1) * msPerSlot);
    const slot: DayPlan = {
      dayNumber: slotNum,
      date: slotDate,
      label: scheduleType === "weekly" ? `Week ${slotNum}` : `Day ${slotNum}`,
      units: [],
      totalMinutes: 0,
    };
    while (cursor < all.length) {
      const unit = all[cursor];
      const mins = unit.minutes;
      // Always take at least one unit per day (even if it slightly exceeds budget)
      if (slot.units.length === 0 || slot.totalMinutes + mins <= slotMinutes) {
        slot.units.push(unit);
        slot.totalMinutes += mins;
        cursor++;
      } else break;
    }
    days.push(slot);
  }

  // ── Revision days ──
  // All remaining days in the window (after content) become revision days.
  const actualContentDays = days.length;
  const actualRevisionCount = Math.max(0, totalSlots - actualContentDays);
  const revisionDays = buildRevisionDays(
    actualRevisionCount, actualContentDays, start, msPerSlot, scheduleType, sectionOrder,
  );

  return {
    weeks: days,
    recommendedHoursPerWeek: hoursPerDay,
    remainingMinutes: remainingMins,
    revisionDays,
  };
}

// ─── Revision types ───────────────────────────────────────────────────────────
export type RevisionTask = {
  icon: string;
  title: string;
  desc: string;
  tag: "textbook" | "mock" | "review" | "rest";
};

export type RevisionDay = {
  slotNumber: number;
  date: Date;
  label: string;
  tasks: RevisionTask[];
};

function buildRevisionDays(
  count: number,
  contentSlots: number,
  start: Date,
  msPerSlot: number,
  scheduleType: "daily" | "weekly",
  sectionOrder: string[],
): RevisionDay[] {
  if (count === 0) return [];

  const days: RevisionDay[] = [];

  // Schedule:
  //  0 … mock1Idx-1  → textbook re-read (one section per slot)
  //  mock1Idx        → Mock Exam 1 + review
  //  mock1Idx+1 … mock2Idx-1 → weak-area review
  //  mock2Idx        → Mock Exam 2 + review
  //  last slot       → final review + rest

  const mock1Idx = Math.max(1, Math.floor(count * 0.35));
  const mock2Idx = count >= 4 ? Math.max(mock1Idx + 1, count - 2) : Math.min(mock1Idx + 1, count - 1);

  for (let i = 0; i < count; i++) {
    const slotNum = contentSlots + i + 1;
    const date = new Date(start.getTime() + (slotNum - 1) * msPerSlot);
    const label = scheduleType === "weekly" ? `Week ${slotNum}` : `Day ${slotNum}`;

    let tasks: RevisionTask[];

    if (i === mock1Idx) {
      tasks = [
        { icon: "📝", title: "Mock Exam 1", desc: "Sit a full-length timed mock exam under real exam conditions (no notes, strict time).", tag: "mock" },
        { icon: "🔍", title: "Mock Exam 1 — Review", desc: "Go through every incorrect answer. Note the weak sections for targeted review.", tag: "review" },
      ];
    } else if (i === mock2Idx && count >= 3) {
      tasks = [
        { icon: "📝", title: "Mock Exam 2", desc: "Second full-length timed mock. Aim to beat your Mock 1 score.", tag: "mock" },
        { icon: "🔍", title: "Mock Exam 2 — Review", desc: "Analyse results. Prioritise final revision on remaining weak sections.", tag: "review" },
      ];
    } else if (i === count - 1) {
      tasks = [
        { icon: "⚡", title: "Final Formula & Concept Review", desc: "Quick pass through all key formulas, ratios and decision rules. No new material.", tag: "review" },
        { icon: "😴", title: "Rest & Prepare", desc: "Relax, get a good night's sleep, and prepare your exam-day logistics.", tag: "rest" },
      ];
    } else if (i < mock1Idx) {
      // Textbook re-read phase
      const section = sectionOrder[i % sectionOrder.length];
      tasks = [
        { icon: "📖", title: `Textbook Re-read — Section ${section}`, desc: `Full read-through of your textbook for Section ${section}. Highlight key concepts, formulas and definitions.`, tag: "textbook" },
        { icon: "✏️", title: "End-of-Chapter Questions", desc: `Work through practice questions for Section ${section} after reading.`, tag: "review" },
      ];
    } else {
      // Review phase (between mock 1 and mock 2)
      const section = sectionOrder[(i - mock1Idx - 1) % sectionOrder.length];
      tasks = [
        { icon: "🔍", title: `Weak Area Review — Section ${section}`, desc: `Revisit difficult topics and formulas in Section ${section}. Use flashcards or summary notes.`, tag: "review" },
        { icon: "✏️", title: "MCQ Drill", desc: "Drill targeted MCQs on your weakest topics identified from diagnostic quiz and Mock 1.", tag: "review" },
      ];
    }

    days.push({ slotNumber: slotNum, date, label, tasks });
  }

  return days;
}

