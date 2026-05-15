import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import {
  CalendarIcon, CheckCircle2, Circle, Clock, GraduationCap,
  LogOut, RotateCcw, Save, Sparkles, Trophy, Zap,
  LayoutDashboard, BookOpen, Briefcase, Sun, Moon, ChevronRight, Settings2,
  X, MonitorPlay, FileDown, MousePointer2, Pen, Highlighter, Trash2,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { SectionOrderEditor } from "@/components/planner/section-order";
import { SECTIONS, UNITS, formatMinutes } from "@/lib/cma-units";
import { SECTIONS_P2, UNITS_P2 } from "@/lib/cma-units-p2";
import { generatePlan } from "@/lib/study-plan";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "CMA Study Planner" }] }),
  component: Index,
});

const DEFAULT_ORDER = ["A", "B", "C", "D", "E", "F"];
type Page = "dashboard" | "generate" | "study" | "career";
type Part = 1 | 2;

const LOS_URL = "https://prodcm.imanet.org/-/media/IMA/Files/Home/IMA-Certifications/CMA-Certification/2024-CMA-Learning-Outcome-Statement-Final.ashx";

const SIMULATIONS = [
  { id: "essay", label: "Essay Simulation",           tag: "Real", tagColor: "red",  url: "https://training.prod.prometric.mindgrb.io/CMA-Tutorial/launch_html_delivery.html" },
  { id: "cbq",   label: "CBQ Simulation",             tag: "Real", tagColor: "red",  url: "https://training.prod.prometric.mindgrb.io/CMA-AIT-Tutorial/launch_html_delivery.html" },
  { id: "los",   label: "Learning Outcome Statement", tag: "LOS",  tagColor: "blue", url: `https://docs.google.com/viewer?url=${encodeURIComponent(LOS_URL)}&embedded=true` },
] as const;

function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [part, setPart] = useState<Part>(1);
  const [examDate, setExamDate] = useState<Date | undefined>();
  const [order, setOrder] = useState<string[]>(DEFAULT_ORDER);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [savedPlan, setSavedPlan] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [scheduleType, setScheduleType] = useState<"daily"|"weekly">("daily");
  const [page, setPage] = useState<Page>("dashboard");
  const [dark, setDark] = useState(false);
  const [simUrl, setSimUrl] = useState<{ url: string; label: string } | null>(null);

  // Derived data based on active part
  const ACTIVE_UNITS    = part === 1 ? UNITS    : UNITS_P2;
  const ACTIVE_SECTIONS = part === 1 ? SECTIONS : SECTIONS_P2;

  useEffect(() => { document.documentElement.classList.toggle("dark", dark); }, [dark]);
  useEffect(() => { if (!loading && !user) navigate({ to: "/login" }); }, [user, loading, navigate]);

  // Re-load plan & progress whenever user or active part changes
  useEffect(() => {
    if (!user) return;
    setExamDate(undefined);
    setOrder(DEFAULT_ORDER);
    setCompleted(new Set());
    setSavedPlan(false);
    (async () => {
      const [{ data: plan }, { data: prog }] = await Promise.all([
        supabase.from("study_plans").select("*").eq("user_id", user.id).eq("part", part).maybeSingle(),
        supabase.from("unit_progress").select("unit_key").eq("user_id", user.id).eq("part", part),
      ]);
      if (plan) {
        setExamDate(new Date(plan.exam_date));
        setOrder(plan.section_order ?? DEFAULT_ORDER);
        setHoursPerDay(plan.hours_per_day ?? 2);
        setScheduleType(plan.schedule_type ?? "daily");
        setSavedPlan(true);
      }
      if (prog) setCompleted(new Set(prog.map((p: any) => p.unit_key)));
    })();
  }, [user, part]);

  async function savePlan() {
    if (!user || !examDate) return;
    setSaving(true);
    const { error } = await supabase.from("study_plans").upsert(
      { user_id: user.id, part, exam_date: format(examDate, "yyyy-MM-dd"), section_order: order, hours_per_day: hoursPerDay, schedule_type: scheduleType },
      { onConflict: "user_id,part" }
    );
    setSaving(false);
    if (error) return toast.error(error.message);
    setSavedPlan(true);
    toast.success(`Part ${part} study plan saved!`);
    setPage("study");
  }

  const [resetting, setResetting] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  function resetPlan() {
    if (!user) return;
    setShowResetModal(true);
  }

  async function doReset(deleteProgress: boolean) {
    if (!user) return;
    setShowResetModal(false);
    setResetting(true);
    const ops: Promise<any>[] = [
      supabase.from("study_plans").delete().eq("user_id", user.id).eq("part", part),
    ];
    if (deleteProgress) {
      ops.push(supabase.from("unit_progress").delete().eq("user_id", user.id).eq("part", part));
    }
    await Promise.all(ops);
    setResetting(false);
    setExamDate(undefined);
    setOrder(DEFAULT_ORDER);
    setHoursPerDay(2);
    setScheduleType("daily");
    setSavedPlan(false);
    if (deleteProgress) setCompleted(new Set());
    toast.success(deleteProgress ? "Study plan and progress reset." : "Study plan reset. Progress kept.");
  }

  async function toggleUnit(key: string, value: boolean) {
    if (!user) return;
    const next = new Set(completed);
    if (value) next.add(key); else next.delete(key);
    setCompleted(next);
    if (value) {
      await supabase.from("unit_progress").upsert({ user_id: user.id, part, unit_key: key, completed: true }, { onConflict: "user_id,part,unit_key" });
    } else {
      await supabase.from("unit_progress").delete().eq("user_id", user.id).eq("part", part).eq("unit_key", key);
    }
  }

  // Stable "today" reference — recalculated only once per mount.
  const today = useMemo(() => new Date(), []);

  const plan = useMemo(() =>
    examDate
      ? generatePlan(examDate, order, completed, today, hoursPerDay, scheduleType, {}, ACTIVE_UNITS)
      : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [examDate, order, completed, hoursPerDay, scheduleType, today, ACTIVE_UNITS]
  );

  const totalUnits = ACTIVE_UNITS.length;
  const completedCount = completed.size;
  const progressPct = Math.round((completedCount / totalUnits) * 100);

  if (loading || !user) return (
    <div className="loading-screen">
      <div className="loading-icon"><GraduationCap size={22} color="#fff" /></div>
      <span>Loading…</span>
    </div>
  );

  const pages: Record<Page, { title: string; sub: string }> = {
    dashboard:  { title: "Dashboard",            sub: "Overview of your CMA Part 1 journey" },
    generate:   { title: "Generate Study Plan",  sub: "Set your exam date, daily hours and section order" },
    study:      { title: "Study Plan",           sub: "Your daily study schedule" },
    career:     { title: "Career Plan",          sub: "Your CMA career roadmap" },
  };

  const sharedProps = {
    part, plan, examDate, setExamDate, order, setOrder,
    hoursPerDay, setHoursPerDay, scheduleType, setScheduleType,
    savedPlan, saving, savePlan, resetting, resetPlan,
    completed, completedCount, totalUnits, progressPct,
    toggleUnit, setPage,
    activeSections: { ...ACTIVE_SECTIONS, _allUnits: ACTIVE_UNITS },
  };

  const NAV: [Page, string, any][] = [
    ["dashboard",  "Dashboard",           LayoutDashboard],
    ["generate",   "Generate Study Plan",  Settings2],
    ["study",      "Study Plan",           BookOpen],
    ["career",     "Career Plan",          Briefcase],
  ];

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon"><GraduationCap size={17} color="#fff" /></div>
          <div>
            <div className="sidebar-logo-text">CMA Planner</div>
            <div className="sidebar-logo-sub">Study Planner</div>
          </div>
        </div>

        {/* Part Switcher */}
        <div className="sidebar-section">
          <div className="sidebar-section-label">Exam Part</div>
          <div className="part-switcher">
            <button
              className={`part-btn ${part === 1 ? "active" : ""}`}
              onClick={() => { setPart(1); setPage("dashboard"); }}
            >
              Part 1
            </button>
            <button
              className={`part-btn ${part === 2 ? "active" : ""}`}
              onClick={() => { setPart(2); setPage("dashboard"); }}
            >
              Part 2
            </button>
          </div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-label">Navigation</div>
          <nav className="sidebar-nav">
            {NAV.map(([id, label, Icon]) => (
              <button key={id} className={`nav-item ${page === id ? "active" : ""}`} onClick={() => setPage(id)}>
                <Icon className="nav-icon" /> {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Exam Simulations */}
        <div className="sidebar-section">
          <div className="sidebar-section-label">Exam Simulations</div>
          <nav className="sidebar-nav">
            {SIMULATIONS.map(sim => (
              <button key={sim.id} className="nav-item sim-item" onClick={() => setSimUrl({ url: sim.url, label: sim.label })}>
                <MonitorPlay className="nav-icon" />
                <span style={{ flex: 1, textAlign: "left" }}>{sim.label}</span>
                <span className={`sim-tag ${sim.tagColor === "blue" ? "sim-tag-blue" : ""}`}>{sim.tag}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="sidebar-bottom">
          <button className="theme-toggle" onClick={() => setDark(d => !d)}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem" }}>
              {dark ? <Moon size={14} /> : <Sun size={14} />} {dark ? "Dark" : "Light"}
            </span>
            <div className={`toggle-track ${dark ? "on" : ""}`}><div className="toggle-thumb" /></div>
          </button>
          <div className="sidebar-user">
            <div className="avatar">{user.email?.[0]?.toUpperCase()}</div>
            <div style={{ overflow: "hidden", flex: 1 }}>
              <div className="sidebar-user-label">Account</div>
              <div className="sidebar-user-email">{user.email}</div>
            </div>
          </div>
          <button className="nav-item danger" onClick={() => supabase.auth.signOut()}>
            <LogOut className="nav-icon" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        {/* WhatsApp community banner */}
        <a
          href="https://chat.whatsapp.com/L1AgKGUy7IEKxA7KFZ6wkC?mode=gi_t"
          target="_blank"
          rel="noopener noreferrer"
          className="wa-banner no-print"
        >
          <span className="wa-dot" />
          <svg viewBox="0 0 24 24" fill="currentColor" className="wa-icon" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          <span className="wa-text">
            <strong>AI Learning &amp; Upskilling</strong>
            <span className="wa-sub">Join our WhatsApp community →</span>
          </span>
        </a>

        <div className="page-header">
          <div>
            <div className="page-title">{pages[page].title}</div>
            <div className="page-sub">{pages[page].sub}</div>
          </div>
          {completedCount > 0 && (
            <span className="badge badge-green"><Trophy size={11} /> {completedCount} / {totalUnits} done</span>
          )}
        </div>

        <div className="page-body">
          {page === "dashboard"  && <DashboardPage {...sharedProps} />}
          {page === "generate"   && <GeneratePlanPage {...sharedProps} />}
          {page === "study"      && <StudyPage {...sharedProps} />}
          {page === "career"     && <CareerPage />}
        </div>
      </div>

      {/* Full-screen simulation popup with annotation canvas */}
      {simUrl && <SimOverlay sim={simUrl} onClose={() => setSimUrl(null)} />}

      {/* ── Reset plan modal ── */}
      {showResetModal && (
        <div className="reset-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="reset-modal-title">
          <div className="reset-modal">
            <div className="reset-modal-icon"><RotateCcw size={22} /></div>
            <h3 id="reset-modal-title" className="reset-modal-title">Reset Study Plan?</h3>
            <p className="reset-modal-desc">
              This will clear your exam date, section order and hours settings for Part {part}.
              What would you like to do with your <strong>unit completion progress</strong>?
            </p>
            <div className="reset-modal-actions">
              <button
                className="reset-modal-btn reset-modal-btn-keep"
                onClick={() => doReset(false)}
                disabled={resetting}
              >
                <CheckCircle2 size={15} /> Keep Progress
              </button>
              <button
                className="reset-modal-btn reset-modal-btn-delete"
                onClick={() => doReset(true)}
                disabled={resetting}
              >
                <Trash2 size={15} /> Delete Progress
              </button>
            </div>
            <button className="reset-modal-cancel" onClick={() => setShowResetModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════
   DASHBOARD
═══════════════════════════════ */
function DashboardPage({ plan, completedCount, totalUnits, progressPct, setPage }: any) {
  return (
    <div className="fade-up">
      <div className="dashboard-welcome">
        <h2>Welcome back 👋</h2>
        <p>Your CMA Part 1 journey is in progress. Keep going!</p>
      </div>

      <div className="stat-grid">
        <StatCard icon={<Clock size={18} />} label="Study days planned" value={plan ? `${plan.weeks.length}` : "—"} color="var(--accent-blue)" bg="var(--accent-blue-bg)" />
        <StatCard icon={<Sparkles size={18} />} label="Hours / day" value={plan ? `${plan.recommendedHoursPerWeek}h` : "—"} color="var(--accent-blue)" bg="var(--accent-blue-bg)" />
        <StatCard icon={<Trophy size={18} />} label="Units completed" value={`${completedCount} / ${totalUnits}`} color="var(--accent-green)" bg="var(--accent-green-bg)"
          extra={<div className="progress-wrap"><div className="progress-bar" style={{ width: `${progressPct}%` }} /><div className="progress-label">{progressPct}% complete</div></div>}
        />
      </div>

      <div className="dash-actions">
        <button className="dash-action-btn" onClick={() => setPage("generate")}>
          <div className="dash-action-icon" style={{ background: "var(--accent-blue-bg)" }}><Settings2 size={20} color="var(--accent-blue)" /></div>
          <div>
            <div className="dash-action-title">Generate Study Plan</div>
            <div className="dash-action-desc">Set exam date, hours per day & section order</div>
          </div>
          <ChevronRight size={16} color="var(--text-muted)" style={{ marginLeft: "auto", flexShrink: 0 }} />
        </button>
        <button className="dash-action-btn" onClick={() => setPage("study")} style={{ opacity: plan ? 1 : 0.5, cursor: plan ? "pointer" : "not-allowed" }} disabled={!plan}>
          <div className="dash-action-icon" style={{ background: "var(--accent-green-bg)" }}><BookOpen size={20} color="var(--accent-green)" /></div>
          <div>
            <div className="dash-action-title">Study Plan</div>
            <div className="dash-action-desc">{plan ? `${plan.weeks.length} study days scheduled` : "Generate a plan first"}</div>
          </div>
          <ChevronRight size={16} color="var(--text-muted)" style={{ marginLeft: "auto", flexShrink: 0 }} />
        </button>
        <button className="dash-action-btn" onClick={() => setPage("career")}>
          <div className="dash-action-icon" style={{ background: "rgba(147,51,234,0.1)" }}><Briefcase size={20} color="#9333ea" /></div>
          <div>
            <div className="dash-action-title">Career Plan</div>
            <div className="dash-action-desc">View your CMA career roadmap</div>
          </div>
          <ChevronRight size={16} color="var(--text-muted)" style={{ marginLeft: "auto", flexShrink: 0 }} />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════
   GENERATE STUDY PLAN PAGE
═══════════════════════════════ */
function GeneratePlanPage({ part, examDate, setExamDate, order, setOrder, hoursPerDay, setHoursPerDay, scheduleType, setScheduleType, savedPlan, saving, savePlan, resetting, resetPlan, activeSections, completed, toggleUnit }: any) {
  const [showSkip, setShowSkip] = useState(false);
  const [applying, setApplying] = useState(false);

  const allUnits: any[] = activeSections._allUnits || [];

  // Local selection — which sections user has ticked as already done
  // Pre-populate from current completed state (sections where ALL units done)
  const [skipped, setSkipped] = useState<Set<string>>(() => {
    const done = new Set<string>();
    const sectionIds = allUnits.map((u: any) => u.section).filter((v, i, a) => a.indexOf(v) === i);
    for (const sId of sectionIds) {
      const units = allUnits.filter((u: any) => u.section === sId);
      if (units.length > 0 && units.every((u: any) => (completed as Set<string>).has(u.key))) {
        done.add(sId);
      }
    }
    return done;
  });

  function toggleSkip(sId: string) {
    setSkipped(prev => {
      const next = new Set(prev);
      if (next.has(sId)) next.delete(sId); else next.add(sId);
      return next;
    });
  }

  async function applySkipped() {
    setApplying(true);
    for (const u of allUnits) {
      const shouldBeDone = skipped.has(u.section);
      const isDone = (completed as Set<string>).has(u.key);
      if (shouldBeDone && !isDone) await toggleUnit(u.key, true);
      if (!shouldBeDone && isDone) await toggleUnit(u.key, false);
    }
    setApplying(false);
    setShowSkip(false);
  }

  return (
    <div className="fade-up">
      <div className="setup-grid">
        <div className="setup-card">
          <div className="setup-card-title"><CalendarIcon size={14} color="var(--accent-blue)" /> Exam Date</div>
          <div className="setup-card-desc">Pick your target CMA Part {part} exam date. <span style={{fontSize:"0.72rem",color:"var(--accent-blue)"}}>📅 Exam windows: Jan–Feb · May–Jun · Sep–Oct</span></div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start mb-4", !examDate && "text-muted-foreground")} style={{ fontSize: "0.83rem" }}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {examDate ? format(examDate, "PPP") : "Pick exam date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={examDate} onSelect={setExamDate}
                disabled={(d) => {
                  const today = new Date(); today.setHours(0,0,0,0);
                  if (d < today) return true;
                  const m = d.getMonth();
                  return ![0,1,4,5,8,9].includes(m);
                }}
                initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>

          {/* Schedule type toggle */}
          <div className="field-label" style={{ marginBottom: 8 }}>Schedule type</div>
          <div className="schedule-toggle">
            <button className={`sched-btn ${scheduleType === "daily" ? "active" : ""}`} onClick={() => setScheduleType("daily")}>
              📅 Daily
            </button>
            <button className={`sched-btn ${scheduleType === "weekly" ? "active" : ""}`} onClick={() => setScheduleType("weekly")}>
              📆 Weekly
            </button>
          </div>

          <div className="field-label" style={{ marginTop: 14 }}>
            {scheduleType === "daily" ? "Study hours per day" : "Study hours per day (×7 = weekly budget)"}: <strong>{hoursPerDay}h</strong>
          </div>
          <input type="range" min={0.5} max={16} step={0.5} value={hoursPerDay}
            onChange={e => setHoursPerDay(parseFloat(e.target.value))} className="hours-slider" />
          <div className="slider-ticks"><span>0.5h</span><span>8h</span><span>16h</span></div>

          <Button onClick={savePlan} disabled={!examDate || saving} className="w-full mt-5" style={{ fontSize: "0.85rem" }}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving…" : savedPlan ? "Update Plan" : "Generate Study Plan"}
          </Button>

          {savedPlan && (
            <button className="reset-plan-btn" onClick={resetPlan} disabled={resetting}>
              <RotateCcw size={12} />
              {resetting ? "Resetting…" : "Reset Study Plan"}
            </button>
          )}

          <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 8, textAlign: "center" }}>
            After saving you'll be taken to your Study Plan automatically.
          </p>
        </div>

        <div className="setup-card">
          <div className="setup-card-title"><Zap size={14} color="var(--accent-blue)" /> Section Study Order</div>
          <div className="setup-card-desc">Drag to reorder the 6 CMA Part {part} sections.</div>
          <SectionOrderEditor order={order} onChange={setOrder} sections={activeSections} />

          {/* ── Already completed sections ── */}
          <button
            className="skip-section-toggle"
            onClick={() => setShowSkip(s => !s)}
            type="button"
          >
            <CheckCircle2 size={13} color="var(--accent-green)" />
            Already completed any sections?
            {skipped.size > 0 && <span className="skip-done-badge" style={{marginLeft:4}}>{skipped.size} selected</span>}
            <ChevronRight size={12} style={{ marginLeft: "auto", transform: showSkip ? "rotate(90deg)" : "none", transition: "transform .2s" }} />
          </button>

          {showSkip && (
            <div className="skip-section-list">
              <p className="skip-section-hint">
                ✏️ Tick sections you've already studied. Click <strong>Apply</strong> to update your plan.
              </p>
              {order.map((sId: string) => {
                const sec = activeSections[sId];
                if (!sec) return null;
                const isDone = skipped.has(sId);
                return (
                  <div
                    key={sId}
                    className={`skip-section-row ${isDone ? "done" : ""}`}
                    onClick={() => toggleSkip(sId)}
                    role="checkbox"
                    aria-checked={isDone}
                    tabIndex={0}
                    onKeyDown={e => e.key === " " && toggleSkip(sId)}
                  >
                    <span className={`skip-checkbox-box ${isDone ? "checked" : ""}`}>
                      {isDone && "✓"}
                    </span>
                    <span className="skip-section-label">
                      <strong>Section {sId}</strong> — {sec.title.replace(/^Section [A-F] — /, "")}
                    </span>
                    {isDone && <span className="skip-done-badge">✓ Done</span>}
                  </div>
                );
              })}
              <div style={{ padding: "10px 12px", background: "var(--surface-2)", borderTop: "1px solid var(--border)", display: "flex", gap: 8 }}>
                <button
                  className="skip-apply-btn"
                  onClick={applySkipped}
                  disabled={applying}
                >
                  {applying ? "Applying…" : "✓ Apply Selection"}
                </button>
                <button className="skip-cancel-btn" onClick={() => setShowSkip(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════
   STUDY PLAN PAGE  (flow only)
═══════════════════════════════ */
function StudyPage({ part, plan, completed, completedCount, totalUnits, toggleUnit, activeSections, examDate }: any) {
  function downloadPDF() { window.print(); }

  const revisionDays: any[] = plan?.revisionDays ?? [];

  return (
    <div className="fade-up">
      {!plan ? (
        <div className="empty-state">
          Go to <strong style={{ color: "var(--accent-blue)" }}>Generate Study Plan</strong> to create your daily schedule.
        </div>
      ) : plan.weeks.length === 0 && revisionDays.length === 0 ? (
        <div className="all-done-banner">🎉 All units completed — you're exam-ready!</div>
      ) : (
        <>
          {/* Header row */}
          <div className="study-plan-toolbar no-print">
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 6 }}>
                <span>Overall progress</span>
                <span>{completedCount} / {totalUnits} units</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: "var(--border)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.round((completedCount / totalUnits) * 100)}%`, background: "var(--accent-green)", transition: "width .5s" }} />
              </div>
            </div>
            {revisionDays.length > 0 && (
              <span className="badge badge-blue" style={{ flexShrink: 0 }}>
                📚 {revisionDays.length} revision {revisionDays.length === 1 ? "day" : "days"}
              </span>
            )}
            <button className="pdf-btn" onClick={downloadPDF} title="Download as PDF">
              <FileDown size={15} /> Download PDF
            </button>
          </div>

          {/* Print-only header */}
          <div className="print-only print-header">
            <div className="print-header-title">CMA Part {part} — Study Plan</div>
            {examDate && <div className="print-header-sub">Exam date: {format(examDate, "PPP")} · {completedCount}/{totalUnits} units completed</div>}
          </div>

          <DayFlowList plan={plan} completed={completed} toggleUnit={toggleUnit} activeSections={activeSections} />
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════
   DAY FLOW LIST
   — shows ALL units per day, completed in-place
   — then shows revision days
═══════════════════════════════ */
function DayFlowList({ plan, completed, toggleUnit, preview = false, activeSections = {} }: any) {
  const days = preview ? plan.weeks.slice(0, 4) : plan.weeks;
  const revDays: any[] = preview ? [] : (plan.revisionDays ?? []);
  const totalItems = days.length + revDays.length;

  return (
    <div className="week-flow">
      {days.map((day: any, idx: number) => {
        const doneToday = day.units.filter((u: any) => completed.has(u.key)).length;
        const allDone = doneToday === day.units.length;
        const isLast = idx === days.length - 1 && revDays.length === 0;
        return (
          <div key={day.dayNumber} className="week-node">
            <div className="week-connector">
              <div className={`week-dot ${allDone ? "all-done" : doneToday > 0 ? "done" : ""}`} />
              {!isLast && <div className={`week-line-segment ${allDone ? "done" : ""}`} />}
            </div>
            <div className="week-card-wrap">
              <div className={`week-card ${allDone ? "all-done" : ""}`}>
                <div className="week-card-header">
                  <div>
                    <span className="week-number">{day.label}</span>
                    <span className="week-dates">{format(day.date, "EEE, MMM d yyyy")}</span>
                  </div>
                  <div className="week-badges">
                    <span className="badge badge-gray">{formatMinutes(day.totalMinutes)}</span>
                    <span className={`badge ${allDone ? "badge-green" : doneToday > 0 ? "badge-blue" : "badge-gray"}`}>
                      {doneToday}/{day.units.length} done
                    </span>
                  </div>
                </div>
                <div className="units-list">
                  {day.units.map((unit: any) => {
                    const done = completed.has(unit.key);
                    return (
                      <div key={unit.key} className={`unit-row ${done ? "done" : ""}`}>
                        <div className="unit-row-left">
                          {done
                            ? <CheckCircle2 size={18} color="var(--accent-green)" style={{ flexShrink: 0 }} />
                            : <Circle size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                          }
                          <div style={{ minWidth: 0 }}>
                            <div className={`unit-title ${done ? "done" : ""}`}>{unit.title}</div>
                            <div className="unit-meta">
                              <span className="unit-section-pill">{(activeSections[unit.section]?.title ?? unit.section).split(" — ")[0]}</span>
                              <span className="unit-index-pill">Unit {unit.index}</span>
                            </div>
                          </div>
                        </div>
                        <div className="unit-row-right">
                          <span className="badge badge-gray no-print">{formatMinutes(unit.minutes)}</span>
                          <button
                            className={`unit-tick ${done ? "ticked" : ""}`}
                            onClick={() => toggleUnit(unit.key, !done)}
                            title={done ? "Mark as not done" : "Mark as done"}
                            aria-label={done ? "Unmark as done" : "Mark as done"}
                          >
                            {done ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* ── Revision phase divider ── */}
      {revDays.length > 0 && (
        <div className="revision-divider">
          <div className="revision-divider-line" />
          <span className="revision-divider-label">📚 Revision Phase — {revDays.length} {revDays.length === 1 ? "day" : "days"}</span>
          <div className="revision-divider-line" />
        </div>
      )}

      {/* ── Revision day cards ── */}
      {revDays.map((rd: any, idx: number) => {
        const isLast = idx === revDays.length - 1;
        return (
          <div key={`rev-${rd.slotNumber}`} className="week-node">
            <div className="week-connector">
              <div className="week-dot rev-dot" />
              {!isLast && <div className="week-line-segment rev-line" />}
            </div>
            <div className="week-card-wrap">
              <div className="week-card revision-card">
                <div className="week-card-header revision-card-header">
                  <div>
                    <span className="week-number">{rd.label}</span>
                    <span className="week-dates">{format(rd.date, "EEE, MMM d yyyy")}</span>
                  </div>
                  <span className="badge revision-badge">📚 Revision
                  </span>
                </div>
                <div className="units-list">
                  {rd.tasks.map((task: any, ti: number) => (
                    <div key={ti} className="revision-task-row">
                      <span className="revision-task-icon">{task.icon}</span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div className="revision-task-title">{task.title}</div>
                        <div className="revision-task-desc">{task.desc}</div>
                      </div>
                      <span className={`revision-task-tag revision-tag-${task.tag}`}>{task.tag}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {preview && plan.weeks.length > 4 && (
        <div style={{ paddingLeft: 48, color: "var(--text-muted)", fontSize: "0.78rem", paddingBottom: 8 }}>
          + {plan.weeks.length - 4} more study days
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════
   CAREER PAGE
═══════════════════════════════ */
function CareerPage() {
  const milestones = [
    { icon: "📚", title: "Pass CMA Part 1", desc: "Financial Planning, Performance & Analytics" },
    { icon: "📝", title: "Pass CMA Part 2", desc: "Strategic Financial Management" },
    { icon: "🏆", title: "Earn CMA Certification", desc: "Complete 2 years of relevant experience" },
    { icon: "💼", title: "Financial Analyst / Controller", desc: "Apply your CMA in a management accounting role" },
    { icon: "🚀", title: "CFO / Finance Director", desc: "Lead financial strategy at your organisation" },
  ];
  return (
    <div className="fade-up">
      <div className="dashboard-welcome" style={{ background: "linear-gradient(135deg,#107c10,#0b5c0b)" }}>
        <h2>Your CMA Career Roadmap 🚀</h2>
        <p>A clear path from studying to senior finance leadership.</p>
      </div>
      <div className="week-flow" style={{ marginTop: 16 }}>
        {milestones.map((m, i) => (
          <div key={i} className="week-node">
            <div className="week-connector">
              <div className="week-dot" style={{ background: "var(--accent-blue)", border: "2px solid var(--accent-blue)", fontSize: "0.9rem", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>{m.icon}</div>
              {i < milestones.length - 1 && <div className="week-line-segment" />}
            </div>
            <div className="week-card-wrap">
              <div className="ms-card" style={{ padding: "14px 18px", marginTop: 8 }}>
                <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--text-primary)", marginBottom: 3 }}>{m.title}</div>
                <div style={{ fontSize: "0.77rem", color: "var(--text-muted)" }}>{m.desc}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════
   STAT CARD
═══════════════════════════════ */
function StatCard({ icon, label, value, color, bg, extra }: any) {
  return (
    <div className="stat-card">
      <div className="stat-card-icon" style={{ background: bg, color }}>{icon}</div>
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">{value}</div>
      {extra}
      <div className="stat-card-bar" style={{ background: `linear-gradient(90deg,${color},transparent)` }} />
    </div>
  );
}

/* ═══════════════════════════════
   SIM OVERLAY — iframe + canvas annotation
═══════════════════════════════ */
type DrawTool = "navigate" | "pen" | "highlight";

const PEN_COLORS   = ["#f59e0b", "#ef4444", "#10b981", "#3b82f6", "#8b5cf6", "#000000", "#ffffff"];
const HL_COLORS    = ["#facc15", "#86efac", "#93c5fd", "#f9a8d4"];

function SimOverlay({ sim, onClose }: { sim: { url: string; label: string }; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool]     = useState<DrawTool>("navigate");
  const [color, setColor]   = useState("#facc15");
  const [size, setSize]     = useState(4);
  const drawing             = useRef(false);

  // Resize canvas whenever window resizes
  useEffect(() => {
    function fit() {
      const c = canvasRef.current;
      if (!c) return;
      // save existing pixels
      const tmp = document.createElement("canvas");
      tmp.width = c.width; tmp.height = c.height;
      tmp.getContext("2d")!.drawImage(c, 0, 0);
      c.width  = c.offsetWidth;
      c.height = c.offsetHeight;
      c.getContext("2d")!.drawImage(tmp, 0, 0);
    }
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function pos(e: React.MouseEvent<HTMLCanvasElement>) {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function startDraw(e: React.MouseEvent<HTMLCanvasElement>) {
    if (tool === "navigate") return;
    drawing.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    const p   = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }

  function doDraw(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!drawing.current || tool === "navigate") return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const p   = pos(e);
    if (tool === "highlight") {
      ctx.globalAlpha  = 0.32;
      ctx.strokeStyle  = color;
      ctx.lineWidth    = 22;
      ctx.lineCap      = "square";
      ctx.lineJoin     = "bevel";
    } else {
      ctx.globalAlpha  = 1;
      ctx.strokeStyle  = color;
      ctx.lineWidth    = size;
      ctx.lineCap      = "round";
      ctx.lineJoin     = "round";
    }
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }

  function endDraw() { drawing.current = false; }

  function clearCanvas() {
    const c = canvasRef.current!;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
  }

  const COLORS = tool === "highlight" ? HL_COLORS : PEN_COLORS;
  const cursor = tool === "pen" ? "crosshair" : tool === "highlight" ? "cell" : "default";

  return (
    <div className="sim-overlay" role="dialog" aria-modal="true">
      {/* ── Topbar ── */}
      <div className="sim-topbar">
        <span className="sim-topbar-title">
          <MonitorPlay size={15} style={{ marginRight: 7 }} />{sim.label}
        </span>

        {/* Annotation toolbar */}
        <div className="sim-annotation-bar">
          {/* Tool buttons */}
          <div className="sim-tool-group">
            <button className={`sim-tool-btn ${tool === "navigate" ? "active" : ""}`} onClick={() => setTool("navigate")} title="Navigate (interact with content)">
              <MousePointer2 size={14} />
            </button>
            <button className={`sim-tool-btn ${tool === "pen" ? "active" : ""}`} onClick={() => setTool("pen")} title="Pen">
              <Pen size={14} />
            </button>
            <button className={`sim-tool-btn ${tool === "highlight" ? "active" : ""}`} onClick={() => setTool("highlight")} title="Highlighter">
              <Highlighter size={14} />
            </button>
          </div>

          {/* Colour swatches */}
          {tool !== "navigate" && (
            <div className="sim-color-row">
              {COLORS.map(c => (
                <button
                  key={c}
                  className={`sim-color-swatch ${color === c ? "selected" : ""}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                  title={c}
                />
              ))}
            </div>
          )}

          {/* Pen size slider */}
          {tool === "pen" && (
            <div className="sim-size-wrap">
              <span className="sim-size-label">{size}px</span>
              <input type="range" min={1} max={16} value={size}
                onChange={e => setSize(+e.target.value)}
                className="sim-size-slider"
              />
            </div>
          )}

          {/* Clear */}
          {tool !== "navigate" && (
            <button className="sim-tool-btn sim-clear-btn" onClick={clearCanvas} title="Clear all annotations">
              <Trash2 size={14} />
            </button>
          )}
        </div>

        <button className="sim-close-btn" onClick={onClose} title="Close (Esc)">
          <X size={17} /> Close
        </button>
      </div>

      {/* ── Content + canvas layer ── */}
      <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>
        <iframe
          src={sim.url}
          className="sim-iframe"
          title={sim.label}
          allow="fullscreen"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation allow-downloads"
          style={{ pointerEvents: tool === "navigate" ? "auto" : "none" }}
        />
        <canvas
          ref={canvasRef}
          className="sim-canvas"
          style={{ cursor, pointerEvents: tool === "navigate" ? "none" : "auto" }}
          onMouseDown={startDraw}
          onMouseMove={doDraw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
        />
      </div>
    </div>
  );
}
